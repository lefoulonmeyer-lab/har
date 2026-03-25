import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, AlertTriangle, Check, CheckCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useForumStore } from '../store/forumStore';

const notifIcons = {
  reply: MessageCircle,
  like: Heart,
  mention: Bell,
  warning: AlertTriangle
};

const notifColors = {
  reply: 'text-cyan-400',
  like: 'text-red-400',
  mention: 'text-violet-400',
  warning: 'text-amber-400'
};

export default function Notifications() {
  const { user, isAuthenticated, login } = useAuthStore();
  const { notifications, fetchNotifications, markAllRead } = useForumStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Connexion requise</h1>
          <p className="text-muted-foreground mb-4">Connectez-vous pour voir vos notifications</p>
          <Button onClick={login} className="btn-primary">Se connecter</Button>
        </div>
      </div>
    );
  }
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  
  return (
    <div className="min-h-screen py-8" data-testid="notifications-page">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-violet-500" />
            <h1 className="font-heading text-3xl font-bold">Notifications</h1>
          </div>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              onClick={markAllRead}
              className="gap-2"
              data-testid="mark-all-read-btn"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, index) => {
              const Icon = notifIcons[notif.type] || Bell;
              const colorClass = notifColors[notif.type] || 'text-muted-foreground';
              
              return (
                <motion.div
                  key={notif.notification_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={notif.link || '#'}
                    className={`glass-card p-4 flex items-start gap-4 card-hover block ${
                      !notif.is_read ? 'border-l-4 border-violet-500' : ''
                    }`}
                    data-testid={`notification-${notif.notification_id}`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notif.message}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-2" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">Aucune notification</h2>
            <p className="text-muted-foreground">
              Vous recevrez des notifications lorsque quelqu'un interagira avec vos contenus
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
