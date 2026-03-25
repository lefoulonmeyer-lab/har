# Astuceson Forum - Product Requirements Document

## Overview
Forum communautaire pour la communauté francophone des streamers et créateurs de contenu (TikTok, Twitch, YouTube).

## Core Requirements
- **Design**: Dark mode, inspiré Discord/Reddit, effets modernes (glow, neon, gradients)
- **Architecture**: React/Vite frontend + FastAPI backend + MongoDB
- **Authentication**: Google OAuth via Emergent Auth
- **Admin Email**: lefoulonmeyer0@gmail.com (auto-admin)

## What's Implemented

### Authentication
- [x] Google OAuth avec Emergent Auth
- [x] Sessions JWT stockées en cookies
- [x] Auto-admin pour email spécifique
- [x] Système de statuts utilisateur (active, banned, suspended)
- [x] Page /blocked pour utilisateurs bannis

### Forum
- [x] Catégories (6 par défaut: Général, TikTok, Twitch, YouTube, Setup & Matos, Events & IRL)
- [x] Topics avec auteur, vues, réponses
- [x] Posts avec likes et réponses imbriquées
- [x] Système de mentions @admin et @modo
- [x] Badges de rôle (admin, modo, streamer, vip)
- [x] Badges de vérification (verified, official, governmental, partner, creator, press)

### Admin Panel (/admin)
- [x] Gestion des utilisateurs (rôles, badges, statuts)
- [x] Gestion des catégories
- [x] Gestion des signalements
- [x] Logs d'administration
- [x] **NEW**: Onglet Maintenance (toggle mode maintenance, message personnalisé, ETA)
- [x] **NEW**: Onglet Annonces (création/modification/suppression, types: banner/popup/toast)

### Maintenance System (NEW - December 2025)
- [x] API GET /api/settings/maintenance (public)
- [x] API PUT /api/admin/settings/maintenance (admin only)
- [x] Page de maintenance animée avec liens sociaux
- [x] Admins peuvent accéder au site même en maintenance

### Announcements System (NEW - December 2025)
- [x] API GET /api/announcements (public)
- [x] API GET/POST/PUT/DELETE /api/admin/announcements (admin only)
- [x] Types: banner (top of page), popup (modal), toast (bottom right)
- [x] Styles: info, warning, success, error
- [x] Options: dismissible, show_once, dates début/fin, priorité

### Legal & UX
- [x] Cookie banner GDPR
- [x] Pages CGU, Privacy, Cookies
- [x] Désactivation clic droit et sélection texte

### Responsive Design
- [x] Admin panel optimisé mobile
- [x] Navigation horizontale scrollable sur mobile
- [x] Cards utilisateur extensibles

## Database Schema (MongoDB)

### Collections
- `users`: user_id, email, name, picture, role, verification_badge, account_status, is_banned, ban_reason
- `categories`: category_id, name, description, icon, color, order, is_visible
- `topics`: topic_id, category_id, title, content, author_*, is_pinned, is_locked, views, reply_count
- `posts`: post_id, topic_id, content, author_*, parent_id, likes, like_count
- `notifications`: notification_id, user_id, type, title, message, link, is_read
- `reports`: report_id, reporter_*, target_type, target_id, reason, status
- `alerts`: alert_id, type (admin/modo), message, post_id, topic_id, from_user_*
- `admin_logs`: log_id, admin_*, action, target_type, target_id, details
- `site_settings`: key (maintenance), enabled, title, message, eta
- `announcements`: announcement_id, type, title, message, style, is_active, priority, dates

## API Endpoints

### Public
- GET /api/ - Health check
- GET /api/categories - Liste catégories
- GET /api/topics - Liste topics
- GET /api/topics/{id} - Détail topic
- GET /api/posts?topic_id - Posts d'un topic
- GET /api/stats - Stats publiques
- GET /api/settings/maintenance - Statut maintenance
- GET /api/announcements - Annonces actives

### Authenticated
- POST /api/auth/session - Exchange OAuth session
- GET /api/auth/me - Current user
- POST /api/topics - Create topic
- POST /api/posts - Create post
- POST /api/posts/{id}/like - Like post
- POST /api/reports - Create report

### Admin Only
- GET/PUT /api/admin/settings/maintenance - Maintenance mode
- GET/POST/PUT/DELETE /api/admin/announcements - Announcements
- GET /api/admin/users - Liste utilisateurs
- PUT /api/admin/users/{id} - Update user
- DELETE /api/admin/users/{id} - Delete user
- POST /api/admin/users/{id}/badge - Set verification badge
- GET /api/admin/logs - Admin logs
- GET /api/admin/stats - Admin stats

## File Structure
```
/app/
├── backend/
│   ├── server.py (FastAPI monolith)
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx (Header, Footer, RoleBadge, VerificationBadge)
│   │   │   ├── AnnouncementsProvider.jsx (NEW)
│   │   │   └── ui/ (Shadcn components)
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx (includes Maintenance & Announcements)
│   │   │   ├── Maintenance.jsx (NEW)
│   │   │   ├── Forum.jsx
│   │   │   ├── TopicDetail.jsx
│   │   │   └── ... (other pages)
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   └── forumStore.js
│   │   └── App.js (includes AnnouncementsProvider)
│   └── tailwind.config.js
└── test_reports/
```

## Next Tasks (P1)
1. Panel modérateur (/moderation) - Fonctionnalités complètes
2. Notifications temps réel pour statuts signalements
3. Recherche full-text MongoDB

## Future Tasks (P2)
- Likes/réactions sur topics
- Réponses imbriquées (threads)
- Réinitialisation mot de passe
- Section streamers en direct
- Rate limiting et captcha

## Testing
- Test report: /app/test_reports/iteration_2.json
- Backend: 100% pass (12 tests)
- Frontend: 100% pass (all UI features)
