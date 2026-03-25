from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Query, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Storage config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "astuceson-forum")
JWT_SECRET = os.environ.get("JWT_SECRET", "default_secret_key")
storage_key = None

# Create the main app
app = FastAPI(title="Astuceson Forum API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ STORAGE FUNCTIONS ============
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ============ PYDANTIC MODELS ============
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"  # user, streamer, vip, modo, admin
    bio: Optional[str] = None
    social_links: Dict[str, str] = {}
    is_banned: bool = False
    created_at: str

class UserPublic(BaseModel):
    user_id: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    bio: Optional[str] = None
    social_links: Dict[str, str] = {}

class CategoryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str
    name: str
    description: str
    icon: str = "MessageSquare"
    color: str = "#7C3AED"
    order: int = 0
    created_at: str

class CategoryCreate(BaseModel):
    name: str
    description: str
    icon: str = "MessageSquare"
    color: str = "#7C3AED"

class TopicBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    topic_id: str
    category_id: str
    title: str
    content: str
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    author_role: str = "user"
    is_pinned: bool = False
    is_locked: bool = False
    views: int = 0
    reply_count: int = 0
    last_reply_at: Optional[str] = None
    last_reply_by: Optional[str] = None
    created_at: str

class TopicCreate(BaseModel):
    category_id: str
    title: str
    content: str

class PostBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str
    topic_id: str
    content: str
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    author_role: str = "user"
    parent_id: Optional[str] = None
    likes: List[str] = []
    like_count: int = 0
    is_edited: bool = False
    created_at: str
    updated_at: Optional[str] = None

class PostCreate(BaseModel):
    topic_id: str
    content: str
    parent_id: Optional[str] = None

class NotificationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str
    user_id: str
    type: str  # reply, mention, like
    message: str
    link: str
    is_read: bool = False
    created_at: str

class AlertBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    alert_id: str
    type: str  # admin, modo
    message: str
    post_id: str
    topic_id: str
    from_user_id: str
    from_user_name: str
    status: str = "pending"  # pending, handled
    handled_by: Optional[str] = None
    created_at: str

class ReportBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    report_id: str
    reporter_id: str
    reporter_name: str
    target_type: str  # post, topic, user
    target_id: str
    reason: str
    status: str = "pending"  # pending, reviewed, dismissed
    reviewed_by: Optional[str] = None
    created_at: str

class ReportCreate(BaseModel):
    target_type: str
    target_id: str
    reason: str

# ============ AUTH HELPERS ============
async def get_current_user(authorization: str = Header(None), request: Request = None) -> dict:
    token = None
    
    # Try cookie first
    if request and request.cookies.get("session_token"):
        token = request.cookies.get("session_token")
    # Then header
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="User is banned")
    
    return user

async def get_optional_user(authorization: str = Header(None), request: Request = None) -> Optional[dict]:
    try:
        return await get_current_user(authorization, request)
    except:
        return None

def require_role(roles: List[str]):
    async def check_role(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return check_role

# ============ AUTH ROUTES ============
@api_router.post("/auth/session")
async def exchange_session(request: Request):
    """Exchange session_id for session_token after Google OAuth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=30
        )
        resp.raise_for_status()
        auth_data = resp.json()
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid session_id")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Admin emails - these users get admin role automatically
    ADMIN_EMAILS = ["lefoulonmeyer0@gmail.com"]
    
    # Find or create user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing:
        user_id = existing["user_id"]
        # Update user info and ensure admin role for admin emails
        update_data = {"name": name, "picture": picture}
        if email in ADMIN_EMAILS:
            update_data["role"] = "admin"
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        # Set admin role for admin emails
        role = "admin" if email in ADMIN_EMAILS else "user"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "bio": None,
            "social_links": {},
            "is_banned": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    response = JSONResponse(content={"user": user, "session_token": session_token})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    return response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, user: dict = Depends(get_current_user)):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token", path="/")
    return response

# ============ USER ROUTES ============
@api_router.get("/users/{user_id}", response_model=UserPublic)
async def get_user(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserPublic(**user)

@api_router.put("/users/me")
async def update_me(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    allowed = ["name", "bio", "social_links"]
    updates = {k: v for k, v in body.items() if k in allowed}
    
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ============ CATEGORY ROUTES ============
@api_router.get("/categories", response_model=List[CategoryBase])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.post("/categories", response_model=CategoryBase)
async def create_category(data: CategoryCreate, user: dict = Depends(require_role(["admin"]))):
    cat = CategoryBase(
        category_id=f"cat_{uuid.uuid4().hex[:8]}",
        name=data.name,
        description=data.description,
        icon=data.icon,
        color=data.color,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    await db.categories.insert_one(cat.model_dump())
    return cat

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, request: Request, user: dict = Depends(require_role(["admin"]))):
    body = await request.json()
    allowed = ["name", "description", "icon", "color", "order"]
    updates = {k: v for k, v in body.items() if k in allowed}
    
    if updates:
        await db.categories.update_one({"category_id": category_id}, {"$set": updates})
    
    updated = await db.categories.find_one({"category_id": category_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(require_role(["admin"]))):
    result = await db.categories.delete_one({"category_id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ============ TOPIC ROUTES ============
@api_router.get("/topics")
async def get_topics(
    category_id: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    
    skip = (page - 1) * limit
    topics = await db.topics.find(query, {"_id": 0}).sort([("is_pinned", -1), ("created_at", -1)]).skip(skip).limit(limit).to_list(limit)
    total = await db.topics.count_documents(query)
    
    return {"topics": topics, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/topics/{topic_id}")
async def get_topic(topic_id: str, user: dict = Depends(get_optional_user)):
    topic = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Increment view count
    await db.topics.update_one({"topic_id": topic_id}, {"$inc": {"views": 1}})
    topic["views"] = topic.get("views", 0) + 1
    
    return topic

@api_router.post("/topics", response_model=TopicBase)
async def create_topic(data: TopicCreate, user: dict = Depends(get_current_user)):
    # Check category exists
    cat = await db.categories.find_one({"category_id": data.category_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    topic = TopicBase(
        topic_id=f"topic_{uuid.uuid4().hex[:8]}",
        category_id=data.category_id,
        title=data.title,
        content=data.content,
        author_id=user["user_id"],
        author_name=user["name"],
        author_picture=user.get("picture"),
        author_role=user.get("role", "user"),
        created_at=datetime.now(timezone.utc).isoformat()
    )
    await db.topics.insert_one(topic.model_dump())
    
    # Check for mentions in content
    await process_mentions(data.content, topic.topic_id, None, user)
    
    return topic

@api_router.put("/topics/{topic_id}")
async def update_topic(topic_id: str, request: Request, user: dict = Depends(get_current_user)):
    topic = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Check permission
    if topic["author_id"] != user["user_id"] and user.get("role") not in ["admin", "modo"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    body = await request.json()
    allowed = ["title", "content"]
    if user.get("role") in ["admin", "modo"]:
        allowed.extend(["is_pinned", "is_locked"])
    
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates:
        await db.topics.update_one({"topic_id": topic_id}, {"$set": updates})
    
    updated = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    return updated

@api_router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str, user: dict = Depends(get_current_user)):
    topic = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if topic["author_id"] != user["user_id"] and user.get("role") not in ["admin", "modo"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.topics.delete_one({"topic_id": topic_id})
    await db.posts.delete_many({"topic_id": topic_id})
    return {"message": "Topic deleted"}

# ============ POST ROUTES ============
@api_router.get("/posts")
async def get_posts(topic_id: str, page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    posts = await db.posts.find({"topic_id": topic_id}, {"_id": 0}).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.posts.count_documents({"topic_id": topic_id})
    
    return {"posts": posts, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.post("/posts", response_model=PostBase)
async def create_post(data: PostCreate, user: dict = Depends(get_current_user)):
    # Check topic exists and not locked
    topic = await db.topics.find_one({"topic_id": data.topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic.get("is_locked"):
        raise HTTPException(status_code=403, detail="Topic is locked")
    
    post = PostBase(
        post_id=f"post_{uuid.uuid4().hex[:8]}",
        topic_id=data.topic_id,
        content=data.content,
        author_id=user["user_id"],
        author_name=user["name"],
        author_picture=user.get("picture"),
        author_role=user.get("role", "user"),
        parent_id=data.parent_id,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    await db.posts.insert_one(post.model_dump())
    
    # Update topic reply count
    await db.topics.update_one(
        {"topic_id": data.topic_id},
        {
            "$inc": {"reply_count": 1},
            "$set": {
                "last_reply_at": post.created_at,
                "last_reply_by": user["name"]
            }
        }
    )
    
    # Notify topic author
    if topic["author_id"] != user["user_id"]:
        notif = {
            "notification_id": f"notif_{uuid.uuid4().hex[:8]}",
            "user_id": topic["author_id"],
            "type": "reply",
            "message": f"{user['name']} a répondu à votre sujet",
            "link": f"/topic/{data.topic_id}",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    # Check for mentions
    await process_mentions(data.content, data.topic_id, post.post_id, user)
    
    return post

@api_router.put("/posts/{post_id}")
async def update_post(post_id: str, request: Request, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["author_id"] != user["user_id"] and user.get("role") not in ["admin", "modo"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    body = await request.json()
    updates = {"content": body.get("content"), "is_edited": True, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.posts.update_one({"post_id": post_id}, {"$set": updates})
    
    updated = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    return updated

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["author_id"] != user["user_id"] and user.get("role") not in ["admin", "modo"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"post_id": post_id})
    await db.topics.update_one({"topic_id": post["topic_id"]}, {"$inc": {"reply_count": -1}})
    return {"message": "Post deleted"}

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    likes = post.get("likes", [])
    if user["user_id"] in likes:
        likes.remove(user["user_id"])
        action = "unliked"
    else:
        likes.append(user["user_id"])
        action = "liked"
        # Notify post author
        if post["author_id"] != user["user_id"]:
            notif = {
                "notification_id": f"notif_{uuid.uuid4().hex[:8]}",
                "user_id": post["author_id"],
                "type": "like",
                "message": f"{user['name']} a aimé votre message",
                "link": f"/topic/{post['topic_id']}",
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notif)
    
    await db.posts.update_one({"post_id": post_id}, {"$set": {"likes": likes, "like_count": len(likes)}})
    return {"action": action, "like_count": len(likes)}

# ============ MENTION PROCESSING ============
async def process_mentions(content: str, topic_id: str, post_id: Optional[str], author: dict):
    # Detect @admin and @modo mentions
    admin_pattern = r'@admin'
    modo_pattern = r'@mod[eo](?:rateur)?'
    
    if re.search(admin_pattern, content, re.IGNORECASE):
        alert = {
            "alert_id": f"alert_{uuid.uuid4().hex[:8]}",
            "type": "admin",
            "message": f"{author['name']} demande l'attention d'un admin",
            "post_id": post_id or "",
            "topic_id": topic_id,
            "from_user_id": author["user_id"],
            "from_user_name": author["name"],
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.alerts.insert_one(alert)
    
    if re.search(modo_pattern, content, re.IGNORECASE):
        alert = {
            "alert_id": f"alert_{uuid.uuid4().hex[:8]}",
            "type": "modo",
            "message": f"{author['name']} demande l'attention d'un modérateur",
            "post_id": post_id or "",
            "topic_id": topic_id,
            "from_user_id": author["user_id"],
            "from_user_name": author["name"],
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.alerts.insert_one(alert)

# ============ NOTIFICATION ROUTES ============
@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user), limit: int = 20):
    notifs = await db.notifications.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    unread = await db.notifications.count_documents({"user_id": user["user_id"], "is_read": False})
    return {"notifications": notifs, "unread_count": unread}

@api_router.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["user_id"]}, {"$set": {"is_read": True}})
    return {"message": "All marked as read"}

@api_router.post("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "Marked as read"}

# ============ REPORT ROUTES ============
@api_router.post("/reports", response_model=ReportBase)
async def create_report(data: ReportCreate, user: dict = Depends(get_current_user)):
    report = ReportBase(
        report_id=f"report_{uuid.uuid4().hex[:8]}",
        reporter_id=user["user_id"],
        reporter_name=user["name"],
        target_type=data.target_type,
        target_id=data.target_id,
        reason=data.reason,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    await db.reports.insert_one(report.model_dump())
    return report

@api_router.get("/reports")
async def get_reports(status: str = "pending", user: dict = Depends(require_role(["admin", "modo"]))):
    reports = await db.reports.find({"status": status}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reports

@api_router.put("/reports/{report_id}")
async def update_report(report_id: str, request: Request, user: dict = Depends(require_role(["admin", "modo"]))):
    body = await request.json()
    status = body.get("status", "reviewed")
    await db.reports.update_one(
        {"report_id": report_id},
        {"$set": {"status": status, "reviewed_by": user["user_id"]}}
    )
    return {"message": "Report updated"}

# ============ ALERT ROUTES ============
@api_router.get("/alerts")
async def get_alerts(status: str = "pending", user: dict = Depends(require_role(["admin", "modo"]))):
    query = {"status": status}
    if user.get("role") == "modo":
        query["type"] = "modo"
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return alerts

@api_router.put("/alerts/{alert_id}")
async def handle_alert(alert_id: str, request: Request, user: dict = Depends(require_role(["admin", "modo"]))):
    body = await request.json()
    await db.alerts.update_one(
        {"alert_id": alert_id},
        {"$set": {"status": body.get("status", "handled"), "handled_by": user["user_id"]}}
    )
    return {"message": "Alert updated"}

# ============ ADMIN ROUTES ============
@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_role(["admin"]))):
    users_count = await db.users.count_documents({})
    topics_count = await db.topics.count_documents({})
    posts_count = await db.posts.count_documents({})
    reports_pending = await db.reports.count_documents({"status": "pending"})
    alerts_pending = await db.alerts.count_documents({"status": "pending"})
    
    # Recent activity
    recent_users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_topics = await db.topics.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "users_count": users_count,
        "topics_count": topics_count,
        "posts_count": posts_count,
        "reports_pending": reports_pending,
        "alerts_pending": alerts_pending,
        "recent_users": recent_users,
        "recent_topics": recent_topics
    }

@api_router.get("/admin/users")
async def get_all_users(page: int = 1, limit: int = 20, user: dict = Depends(require_role(["admin"]))):
    skip = (page - 1) * limit
    users = await db.users.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, request: Request, admin: dict = Depends(require_role(["admin"]))):
    body = await request.json()
    allowed = ["role", "is_banned"]
    updates = {k: v for k, v in body.items() if k in allowed}
    
    if updates:
        await db.users.update_one({"user_id": user_id}, {"$set": updates})
        # Log action
        log = {
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "admin_id": admin["user_id"],
            "action": "update_user",
            "target_id": user_id,
            "details": updates,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_logs.insert_one(log)
    
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_role(["admin"]))):
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    # Log action
    log = {
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": admin["user_id"],
        "action": "delete_user",
        "target_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log)
    return {"message": "User deleted"}

@api_router.get("/admin/logs")
async def get_admin_logs(page: int = 1, limit: int = 50, user: dict = Depends(require_role(["admin"]))):
    skip = (page - 1) * limit
    logs = await db.admin_logs.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return logs

# ============ MODERATION ROUTES ============
@api_router.post("/modo/warn/{user_id}")
async def warn_user(user_id: str, request: Request, modo: dict = Depends(require_role(["admin", "modo"]))):
    body = await request.json()
    reason = body.get("reason", "Comportement inapproprié")
    
    # Create warning notification
    notif = {
        "notification_id": f"notif_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "type": "warning",
        "message": f"Avertissement: {reason}",
        "link": "",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif)
    
    # Log action
    log = {
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": modo["user_id"],
        "action": "warn_user",
        "target_id": user_id,
        "details": {"reason": reason},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log)
    
    return {"message": "User warned"}

# ============ FILE UPLOAD ============
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    # Store in DB
    file_doc = {
        "file_id": f"file_{uuid.uuid4().hex[:8]}",
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "user_id": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    
    return {"file_id": file_doc["file_id"], "path": result["path"]}

@api_router.get("/files/{path:path}")
async def download_file(path: str, auth: str = Query(None), authorization: str = Header(None)):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ============ SEARCH ============
@api_router.get("/search")
async def search(q: str, type: str = "all", page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    results = {"topics": [], "users": []}
    
    if type in ["all", "topics"]:
        topics = await db.topics.find(
            {"$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"content": {"$regex": q, "$options": "i"}}
            ]},
            {"_id": 0}
        ).skip(skip).limit(limit).to_list(limit)
        results["topics"] = topics
    
    if type in ["all", "users"]:
        users = await db.users.find(
            {"name": {"$regex": q, "$options": "i"}},
            {"_id": 0, "email": 0}
        ).skip(skip).limit(limit).to_list(limit)
        results["users"] = users
    
    return results

# ============ PUBLIC STATS ============
@api_router.get("/stats")
async def get_public_stats():
    users_count = await db.users.count_documents({})
    topics_count = await db.topics.count_documents({})
    posts_count = await db.posts.count_documents({})
    return {
        "users_count": users_count,
        "topics_count": topics_count,
        "posts_count": posts_count
    }

# ============ HEALTH CHECK ============
@api_router.get("/")
async def root():
    return {"message": "Astuceson Forum API", "status": "running"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # Create indexes
    await db.topics.create_index([("title", "text"), ("content", "text")])
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.categories.create_index("category_id", unique=True)
    await db.topics.create_index("topic_id", unique=True)
    await db.posts.create_index("post_id", unique=True)
    
    # Create default categories if none exist
    count = await db.categories.count_documents({})
    if count == 0:
        default_cats = [
            {"category_id": "cat_general", "name": "Général", "description": "Discussions générales sur le streaming", "icon": "MessageSquare", "color": "#7C3AED", "order": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_tiktok", "name": "TikTok", "description": "Tout sur TikTok et les créateurs TikTok", "icon": "Video", "color": "#06B6D4", "order": 1, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_twitch", "name": "Twitch", "description": "Discussions sur Twitch et les streamers", "icon": "Tv", "color": "#9333EA", "order": 2, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_youtube", "name": "YouTube", "description": "YouTube Gaming et créateurs de contenu", "icon": "Youtube", "color": "#EF4444", "order": 3, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_setup", "name": "Setup & Matos", "description": "Partagez vos setups et équipements", "icon": "Monitor", "color": "#10B981", "order": 4, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_events", "name": "Events & IRL", "description": "Événements, meet-ups et rencontres", "icon": "Calendar", "color": "#F59E0B", "order": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.categories.insert_many(default_cats)
        logger.info("Default categories created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
