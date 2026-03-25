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

# Admin emails - these users get admin role automatically
ADMIN_EMAILS = ["lefoulonmeyer0@gmail.com"]

# Verification badge types
VERIFICATION_BADGES = {
    "verified": {"label": "Vérifié", "color": "#3B82F6", "icon": "BadgeCheck"},
    "official": {"label": "Officiel", "color": "#F59E0B", "icon": "Shield"},
    "governmental": {"label": "Gouvernemental", "color": "#10B981", "icon": "Building"},
    "partner": {"label": "Partenaire", "color": "#8B5CF6", "icon": "Handshake"},
    "creator": {"label": "Créateur", "color": "#EC4899", "icon": "Star"},
    "press": {"label": "Presse", "color": "#6366F1", "icon": "Newspaper"},
}

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
    verification_badge: Optional[str] = None  # verified, official, governmental, partner, creator, press
    account_status: str = "active"  # active, pending_verification, suspended, banned
    bio: Optional[str] = None
    social_links: Dict[str, str] = {}
    is_banned: bool = False
    ban_reason: Optional[str] = None
    ban_expires_at: Optional[str] = None
    suspension_reason: Optional[str] = None
    warnings_count: int = 0
    created_at: str

class UserPublic(BaseModel):
    user_id: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    verification_badge: Optional[str] = None
    account_status: str = "active"
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
    is_visible: bool = True
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
    author_badge: Optional[str] = None
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
    author_badge: Optional[str] = None
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
    type: str  # reply, mention, like, warning, report_update, system
    title: str
    message: str
    link: str
    data: Dict[str, Any] = {}
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
    handled_at: Optional[str] = None
    created_at: str

class ReportBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    report_id: str
    reporter_id: str
    reporter_name: str
    target_type: str  # post, topic, user
    target_id: str
    reason: str
    details: Optional[str] = None
    status: str = "pending"  # pending, in_review, resolved, dismissed
    priority: str = "normal"  # low, normal, high, urgent
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    resolution_note: Optional[str] = None
    action_taken: Optional[str] = None  # none, warning, delete, ban
    created_at: str
    updated_at: Optional[str] = None

class ReportCreate(BaseModel):
    target_type: str
    target_id: str
    reason: str
    details: Optional[str] = None

class ReportUpdate(BaseModel):
    status: str
    resolution_note: Optional[str] = None
    action_taken: Optional[str] = None
    priority: Optional[str] = None

# ============ HELPER: CREATE NOTIFICATION ============
async def create_notification(
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    link: str = "",
    data: dict = None
):
    """Create a notification for a user"""
    notif = {
        "notification_id": f"notif_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link,
        "data": data or {},
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif)
    return notif

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
    
    # Check account status
    account_status = user.get("account_status", "active")
    if account_status == "banned" or user.get("is_banned"):
        ban_reason = user.get("ban_reason", "Violation des règles")
        raise HTTPException(status_code=403, detail=f"BANNED:{ban_reason}")
    
    if account_status == "suspended":
        suspension_reason = user.get("suspension_reason", "Compte suspendu temporairement")
        raise HTTPException(status_code=403, detail=f"SUSPENDED:{suspension_reason}")
    
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
            "verification_badge": None,
            "bio": None,
            "social_links": {},
            "is_banned": False,
            "ban_reason": None,
            "warnings_count": 0,
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
@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "email": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/me")
async def update_me(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    allowed = ["name", "bio", "social_links"]
    updates = {k: v for k, v in body.items() if k in allowed}
    
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ============ VERIFICATION BADGES ============
@api_router.get("/verification-badges")
async def get_verification_badges():
    """Get all available verification badge types"""
    return VERIFICATION_BADGES

@api_router.post("/admin/users/{user_id}/badge")
async def set_user_badge(user_id: str, request: Request, admin: dict = Depends(require_role(["admin"]))):
    """Set or remove a user's verification badge"""
    body = await request.json()
    badge = body.get("badge")  # None to remove
    
    if badge and badge not in VERIFICATION_BADGES:
        raise HTTPException(status_code=400, detail="Invalid badge type")
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"verification_badge": badge}}
    )
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": admin["user_id"],
        "admin_name": admin["name"],
        "action": "set_badge",
        "target_type": "user",
        "target_id": user_id,
        "details": {"badge": badge},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify user
    if badge:
        badge_info = VERIFICATION_BADGES[badge]
        await create_notification(
            user_id=user_id,
            notif_type="system",
            title="Badge de vérification",
            message=f"Félicitations ! Vous avez reçu le badge {badge_info['label']}.",
            data={"badge": badge}
        )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

# ============ CATEGORY ROUTES ============
@api_router.get("/categories", response_model=List[CategoryBase])
async def get_categories():
    categories = await db.categories.find({"is_visible": {"$ne": False}}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.get("/admin/categories")
async def get_all_categories(user: dict = Depends(require_role(["admin"]))):
    """Get all categories including hidden ones (admin only)"""
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
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": user["user_id"],
        "admin_name": user["name"],
        "action": "create_category",
        "target_type": "category",
        "target_id": cat.category_id,
        "details": {"name": data.name},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return cat

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, request: Request, user: dict = Depends(require_role(["admin"]))):
    body = await request.json()
    allowed = ["name", "description", "icon", "color", "order", "is_visible"]
    updates = {k: v for k, v in body.items() if k in allowed}
    
    if updates:
        await db.categories.update_one({"category_id": category_id}, {"$set": updates})
        
        # Log action
        await db.admin_logs.insert_one({
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "admin_id": user["user_id"],
            "admin_name": user["name"],
            "action": "update_category",
            "target_type": "category",
            "target_id": category_id,
            "details": updates,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    updated = await db.categories.find_one({"category_id": category_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(require_role(["admin"]))):
    cat = await db.categories.find_one({"category_id": category_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    result = await db.categories.delete_one({"category_id": category_id})
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": user["user_id"],
        "admin_name": user["name"],
        "action": "delete_category",
        "target_type": "category",
        "target_id": category_id,
        "details": {"name": cat.get("name")},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
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
        author_badge=user.get("verification_badge"),
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
    
    # Log if admin/modo action
    if user.get("role") in ["admin", "modo"] and topic["author_id"] != user["user_id"]:
        await db.admin_logs.insert_one({
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "admin_id": user["user_id"],
            "admin_name": user["name"],
            "action": "delete_topic",
            "target_type": "topic",
            "target_id": topic_id,
            "details": {"title": topic.get("title"), "author": topic.get("author_name")},
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
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
        author_badge=user.get("verification_badge"),
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
        await create_notification(
            user_id=topic["author_id"],
            notif_type="reply",
            title="Nouvelle réponse",
            message=f"{user['name']} a répondu à votre sujet « {topic['title'][:50]} »",
            link=f"/topic/{data.topic_id}",
            data={"topic_id": data.topic_id, "post_id": post.post_id}
        )
    
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
    
    # Log if admin/modo action
    if user.get("role") in ["admin", "modo"] and post["author_id"] != user["user_id"]:
        await db.admin_logs.insert_one({
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "admin_id": user["user_id"],
            "admin_name": user["name"],
            "action": "delete_post",
            "target_type": "post",
            "target_id": post_id,
            "details": {"author": post.get("author_name"), "topic_id": post.get("topic_id")},
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
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
            await create_notification(
                user_id=post["author_id"],
                notif_type="like",
                title="Nouveau like",
                message=f"{user['name']} a aimé votre message",
                link=f"/topic/{post['topic_id']}",
                data={"post_id": post_id}
            )
    
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
        
        # Notify all admins
        admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1}).to_list(100)
        for admin in admins:
            await create_notification(
                user_id=admin["user_id"],
                notif_type="mention",
                title="Mention @admin",
                message=f"{author['name']} vous a mentionné dans une discussion",
                link=f"/topic/{topic_id}",
                data={"alert_id": alert["alert_id"]}
            )
    
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
        
        # Notify all modos and admins
        staff = await db.users.find({"role": {"$in": ["modo", "admin"]}}, {"_id": 0, "user_id": 1}).to_list(100)
        for member in staff:
            await create_notification(
                user_id=member["user_id"],
                notif_type="mention",
                title="Mention @modo",
                message=f"{author['name']} demande l'aide d'un modérateur",
                link=f"/topic/{topic_id}",
                data={"alert_id": alert["alert_id"]}
            )

# ============ NOTIFICATION ROUTES ============
@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user), limit: int = 50):
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

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.delete_one({"notification_id": notification_id, "user_id": user["user_id"]})
    return {"message": "Notification deleted"}

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
        details=data.details,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    await db.reports.insert_one(report.model_dump())
    
    # Notify reporter
    await create_notification(
        user_id=user["user_id"],
        notif_type="report_update",
        title="Signalement envoyé",
        message=f"Votre signalement a été envoyé et sera examiné par notre équipe.",
        link="",
        data={"report_id": report.report_id, "status": "pending"}
    )
    
    # Notify all modos and admins
    staff = await db.users.find({"role": {"$in": ["modo", "admin"]}}, {"_id": 0, "user_id": 1}).to_list(100)
    for member in staff:
        await create_notification(
            user_id=member["user_id"],
            notif_type="system",
            title="Nouveau signalement",
            message=f"{user['name']} a signalé un contenu ({data.target_type})",
            link="/moderation",
            data={"report_id": report.report_id}
        )
    
    return report

@api_router.get("/reports")
async def get_reports(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(require_role(["admin", "modo"]))
):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    skip = (page - 1) * limit
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.reports.count_documents(query)
    
    return {"reports": reports, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/reports/{report_id}")
async def get_report(report_id: str, user: dict = Depends(require_role(["admin", "modo"]))):
    report = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Get target content
    target = None
    if report["target_type"] == "post":
        target = await db.posts.find_one({"post_id": report["target_id"]}, {"_id": 0})
    elif report["target_type"] == "topic":
        target = await db.topics.find_one({"topic_id": report["target_id"]}, {"_id": 0})
    elif report["target_type"] == "user":
        target = await db.users.find_one({"user_id": report["target_id"]}, {"_id": 0, "email": 0})
    
    return {"report": report, "target": target}

@api_router.put("/reports/{report_id}")
async def update_report(report_id: str, data: ReportUpdate, user: dict = Depends(require_role(["admin", "modo"]))):
    report = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    old_status = report["status"]
    
    updates = {
        "status": data.status,
        "reviewed_by": user["user_id"],
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if data.resolution_note:
        updates["resolution_note"] = data.resolution_note
    if data.action_taken:
        updates["action_taken"] = data.action_taken
    if data.priority:
        updates["priority"] = data.priority
    
    await db.reports.update_one({"report_id": report_id}, {"$set": updates})
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": user["user_id"],
        "admin_name": user["name"],
        "action": "update_report",
        "target_type": "report",
        "target_id": report_id,
        "details": {"old_status": old_status, "new_status": data.status, "action_taken": data.action_taken},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify reporter of status change
    status_messages = {
        "in_review": "Votre signalement est en cours d'examen.",
        "resolved": f"Votre signalement a été traité. {data.resolution_note or ''}",
        "dismissed": f"Votre signalement a été classé. {data.resolution_note or ''}"
    }
    
    if data.status in status_messages:
        await create_notification(
            user_id=report["reporter_id"],
            notif_type="report_update",
            title="Mise à jour de votre signalement",
            message=status_messages[data.status],
            link="",
            data={"report_id": report_id, "status": data.status}
        )
    
    updated = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    return updated

@api_router.get("/my-reports")
async def get_my_reports(user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    """Get reports submitted by the current user"""
    skip = (page - 1) * limit
    reports = await db.reports.find(
        {"reporter_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.reports.count_documents({"reporter_id": user["user_id"]})
    
    return {"reports": reports, "total": total, "page": page}

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
        {"$set": {
            "status": body.get("status", "handled"),
            "handled_by": user["user_id"],
            "handled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Alert updated"}

# ============ ADMIN ROUTES ============
@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_role(["admin"]))):
    users_count = await db.users.count_documents({})
    topics_count = await db.topics.count_documents({})
    posts_count = await db.posts.count_documents({})
    reports_pending = await db.reports.count_documents({"status": "pending"})
    reports_in_review = await db.reports.count_documents({"status": "in_review"})
    alerts_pending = await db.alerts.count_documents({"status": "pending"})
    banned_users = await db.users.count_documents({"is_banned": True})
    
    # Recent activity
    recent_users = await db.users.find({}, {"_id": 0, "email": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_topics = await db.topics.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "users_count": users_count,
        "topics_count": topics_count,
        "posts_count": posts_count,
        "reports_pending": reports_pending,
        "reports_in_review": reports_in_review,
        "alerts_pending": alerts_pending,
        "banned_users": banned_users,
        "recent_users": recent_users,
        "recent_topics": recent_topics,
        "recent_reports": recent_reports
    }

@api_router.get("/admin/users")
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    role: Optional[str] = None,
    banned: Optional[bool] = None,
    search: Optional[str] = None,
    user: dict = Depends(require_role(["admin"]))
):
    query = {}
    if role:
        query["role"] = role
    if banned is not None:
        query["is_banned"] = banned
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    return {"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, request: Request, admin: dict = Depends(require_role(["admin"]))):
    body = await request.json()
    allowed = ["role", "is_banned", "ban_reason", "ban_expires_at", "verification_badge", "account_status", "suspension_reason"]
    updates = {k: v for k, v in body.items() if k in allowed}
    
    # Sync is_banned with account_status
    if "account_status" in updates:
        if updates["account_status"] == "banned":
            updates["is_banned"] = True
        elif updates["account_status"] == "active":
            updates["is_banned"] = False
            updates["ban_reason"] = None
            updates["suspension_reason"] = None
    
    if updates:
        await db.users.update_one({"user_id": user_id}, {"$set": updates})
        
        # Log action
        await db.admin_logs.insert_one({
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "admin_id": admin["user_id"],
            "admin_name": admin["name"],
            "action": "update_user",
            "target_type": "user",
            "target_id": user_id,
            "details": updates,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Notify user based on status change
        status = updates.get("account_status")
        if status == "banned" or updates.get("is_banned"):
            await create_notification(
                user_id=user_id,
                notif_type="system",
                title="Compte banni",
                message=f"Votre compte a été banni. Raison: {updates.get('ban_reason', 'Violation des règles')}",
                link=""
            )
        elif status == "suspended":
            await create_notification(
                user_id=user_id,
                notif_type="system",
                title="Compte suspendu",
                message=f"Votre compte a été suspendu temporairement. Raison: {updates.get('suspension_reason', 'Non spécifiée')}",
                link=""
            )
        elif status == "active" or ("is_banned" in updates and not updates["is_banned"]):
            await create_notification(
                user_id=user_id,
                notif_type="system",
                title="Compte réactivé",
                message="Votre compte a été réactivé. Bienvenue de retour !",
                link=""
            )
    
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_role(["admin"]))):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": admin["user_id"],
        "admin_name": admin["name"],
        "action": "delete_user",
        "target_type": "user",
        "target_id": user_id,
        "details": {"name": user.get("name"), "email": user.get("email")},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "User deleted"}

@api_router.get("/admin/logs")
async def get_admin_logs(
    page: int = 1,
    limit: int = 50,
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    user: dict = Depends(require_role(["admin"]))
):
    query = {}
    if action:
        query["action"] = action
    if admin_id:
        query["admin_id"] = admin_id
    
    skip = (page - 1) * limit
    logs = await db.admin_logs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.admin_logs.count_documents(query)
    
    return {"logs": logs, "total": total, "page": page}

# ============ MODERATION ROUTES ============
@api_router.post("/modo/warn/{user_id}")
async def warn_user(user_id: str, request: Request, modo: dict = Depends(require_role(["admin", "modo"]))):
    body = await request.json()
    reason = body.get("reason", "Comportement inapproprié")
    
    # Increment warning count
    await db.users.update_one({"user_id": user_id}, {"$inc": {"warnings_count": 1}})
    
    # Create warning notification
    await create_notification(
        user_id=user_id,
        notif_type="warning",
        title="Avertissement",
        message=f"Vous avez reçu un avertissement: {reason}",
        link="",
        data={"reason": reason, "from": modo["name"]}
    )
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": modo["user_id"],
        "admin_name": modo["name"],
        "action": "warn_user",
        "target_type": "user",
        "target_id": user_id,
        "details": {"reason": reason},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "User warned"}

@api_router.post("/modo/mute/{user_id}")
async def mute_user(user_id: str, request: Request, modo: dict = Depends(require_role(["admin", "modo"]))):
    """Temporarily mute a user (ban for X hours)"""
    body = await request.json()
    duration_hours = body.get("duration", 24)
    reason = body.get("reason", "Mute temporaire")
    
    mute_until = (datetime.now(timezone.utc) + timedelta(hours=duration_hours)).isoformat()
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_banned": True, "ban_reason": f"Mute jusqu'à {mute_until}: {reason}"}}
    )
    
    await create_notification(
        user_id=user_id,
        notif_type="warning",
        title="Mute temporaire",
        message=f"Vous êtes mute pour {duration_hours} heures. Raison: {reason}",
        link="",
        data={"duration": duration_hours, "reason": reason}
    )
    
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": modo["user_id"],
        "admin_name": modo["name"],
        "action": "mute_user",
        "target_type": "user",
        "target_id": user_id,
        "details": {"duration": duration_hours, "reason": reason},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"User muted for {duration_hours} hours"}

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

# ============ SITE SETTINGS ============
class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    maintenance_mode: bool = False
    maintenance_title: str = "Maintenance en cours"
    maintenance_message: str = "Le site est temporairement indisponible pour maintenance. Nous serons bientôt de retour !"
    maintenance_eta: Optional[str] = None  # ISO datetime

class AnnouncementBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    announcement_id: str
    type: str = "banner"  # banner, popup, toast
    title: str
    message: str
    link: Optional[str] = None
    link_text: Optional[str] = None
    style: str = "info"  # info, warning, success, error
    is_active: bool = True
    is_dismissible: bool = True
    show_once: bool = False  # If true, only show once per session
    priority: int = 0  # Higher = shown first
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    target_roles: List[str] = []  # Empty = all users, else specific roles
    created_at: str
    updated_at: Optional[str] = None

class AnnouncementCreate(BaseModel):
    type: str = "banner"
    title: str
    message: str
    link: Optional[str] = None
    link_text: Optional[str] = None
    style: str = "info"
    is_dismissible: bool = True
    show_once: bool = False
    priority: int = 0
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    target_roles: List[str] = []

# ============ MAINTENANCE MODE ============
@api_router.get("/settings/maintenance")
async def get_maintenance_status():
    """Get current maintenance mode status (public endpoint)"""
    settings = await db.site_settings.find_one({"key": "maintenance"}, {"_id": 0})
    if not settings:
        return {"maintenance_mode": False, "title": "", "message": "", "eta": None}
    return {
        "maintenance_mode": settings.get("enabled", False),
        "title": settings.get("title", "Maintenance en cours"),
        "message": settings.get("message", "Le site est temporairement indisponible."),
        "eta": settings.get("eta")
    }

@api_router.put("/admin/settings/maintenance")
async def set_maintenance_mode(request: Request, admin: dict = Depends(require_role(["admin"]))):
    """Toggle maintenance mode"""
    body = await request.json()
    
    await db.site_settings.update_one(
        {"key": "maintenance"},
        {"$set": {
            "key": "maintenance",
            "enabled": body.get("enabled", False),
            "title": body.get("title", "Maintenance en cours"),
            "message": body.get("message", "Le site est temporairement indisponible pour maintenance."),
            "eta": body.get("eta"),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin["user_id"]
        }},
        upsert=True
    )
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": admin["user_id"],
        "admin_name": admin["name"],
        "action": "toggle_maintenance",
        "target_type": "settings",
        "target_id": "maintenance",
        "details": {"enabled": body.get("enabled", False)},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Maintenance mode updated", "enabled": body.get("enabled", False)}

# ============ ANNOUNCEMENTS ============
@api_router.get("/announcements")
async def get_active_announcements(user: dict = Depends(get_optional_user)):
    """Get active announcements for the current user"""
    now = datetime.now(timezone.utc).isoformat()
    
    query = {
        "is_active": True,
        "$or": [
            {"starts_at": None},
            {"starts_at": {"$lte": now}}
        ]
    }
    
    announcements = await db.announcements.find(query, {"_id": 0}).sort("priority", -1).to_list(20)
    
    # Filter by end date and target roles
    filtered = []
    user_role = user.get("role", "user") if user else "guest"
    
    for ann in announcements:
        # Check end date
        if ann.get("ends_at") and ann["ends_at"] < now:
            continue
        
        # Check target roles
        target_roles = ann.get("target_roles", [])
        if target_roles and user_role not in target_roles and "all" not in target_roles:
            continue
        
        filtered.append(ann)
    
    return {"announcements": filtered}

@api_router.get("/admin/announcements")
async def get_all_announcements(
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(require_role(["admin"]))
):
    """Get all announcements (admin only)"""
    skip = (page - 1) * limit
    announcements = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.announcements.count_documents({})
    return {"announcements": announcements, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.post("/admin/announcements")
async def create_announcement(data: AnnouncementCreate, admin: dict = Depends(require_role(["admin"]))):
    """Create a new announcement"""
    announcement = AnnouncementBase(
        announcement_id=f"ann_{uuid.uuid4().hex[:8]}",
        type=data.type,
        title=data.title,
        message=data.message,
        link=data.link,
        link_text=data.link_text,
        style=data.style,
        is_dismissible=data.is_dismissible,
        show_once=data.show_once,
        priority=data.priority,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
        target_roles=data.target_roles,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.announcements.insert_one(announcement.model_dump())
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": admin["user_id"],
        "admin_name": admin["name"],
        "action": "create_announcement",
        "target_type": "announcement",
        "target_id": announcement.announcement_id,
        "details": {"title": data.title, "type": data.type},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return announcement

@api_router.put("/admin/announcements/{announcement_id}")
async def update_announcement(announcement_id: str, request: Request, admin: dict = Depends(require_role(["admin"]))):
    """Update an announcement"""
    body = await request.json()
    allowed = ["type", "title", "message", "link", "link_text", "style", "is_active", 
               "is_dismissible", "show_once", "priority", "starts_at", "ends_at", "target_roles"]
    updates = {k: v for k, v in body.items() if k in allowed}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.announcements.update_one(
        {"announcement_id": announcement_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": admin["user_id"],
        "admin_name": admin["name"],
        "action": "update_announcement",
        "target_type": "announcement",
        "target_id": announcement_id,
        "details": updates,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    updated = await db.announcements.find_one({"announcement_id": announcement_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, admin: dict = Depends(require_role(["admin"]))):
    """Delete an announcement"""
    result = await db.announcements.delete_one({"announcement_id": announcement_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Log action
    await db.admin_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "admin_id": admin["user_id"],
        "admin_name": admin["name"],
        "action": "delete_announcement",
        "target_type": "announcement",
        "target_id": announcement_id,
        "details": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Announcement deleted"}

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
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.reports.create_index([("status", 1), ("created_at", -1)])
    
    # Create default categories if none exist
    count = await db.categories.count_documents({})
    if count == 0:
        default_cats = [
            {"category_id": "cat_general", "name": "Général", "description": "Discussions générales sur le streaming", "icon": "MessageSquare", "color": "#7C3AED", "order": 0, "is_visible": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_tiktok", "name": "TikTok", "description": "Tout sur TikTok et les créateurs TikTok", "icon": "Video", "color": "#06B6D4", "order": 1, "is_visible": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_twitch", "name": "Twitch", "description": "Discussions sur Twitch et les streamers", "icon": "Tv", "color": "#9333EA", "order": 2, "is_visible": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_youtube", "name": "YouTube", "description": "YouTube Gaming et créateurs de contenu", "icon": "Youtube", "color": "#EF4444", "order": 3, "is_visible": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_setup", "name": "Setup & Matos", "description": "Partagez vos setups et équipements", "icon": "Monitor", "color": "#10B981", "order": 4, "is_visible": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"category_id": "cat_events", "name": "Events & IRL", "description": "Événements, meet-ups et rencontres", "icon": "Calendar", "color": "#F59E0B", "order": 5, "is_visible": True, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.categories.insert_many(default_cats)
        logger.info("Default categories created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
