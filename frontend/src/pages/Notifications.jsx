import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, Heart, MessageCircle, AlertTriangle, Check, CheckCheck, 
  Flag, Shield, Trash2, Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useForumStore } from '../store/forumStore';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const notifConfig = {
  reply: { icon: MessageCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  like: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
  mention: { icon: Bell, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  report_update: { icon: Flag, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  system: { icon: Info, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
};

export default function Notifications() {
  const { user, isAuthenticated, login } = useAuthStore();
  const { notifications, fetchNotifications, markAllRead } = useForumStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);
  
  const handleDelete = async (notifId) => {
    try {
      await axios.delete(`${API}/notifications/${notifId}`, { withCredentials: true });
      fetchNotifications();
      toast.success('Notification supprimée');
    } catch {
      toast.error('Erreur');
    }
  };
  
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
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  
  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notif) => {
    const date = new Date(notif.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let group;
    if (date.toDateString() === today.toDateString()) {
      group = "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = "Hier";
    } else {
      group = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(notif);
    return groups;
  }, {});
  
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
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, notifs]) => (
              <div key={group}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-2">{group}</h2>
                <div className="space-y-2">
                  {notifs.map((notif, index) => {
                    const config = notifConfig[notif.type] || notifConfig.system;
                    const Icon = config.icon;
                    
                    return (
                      <motion.div
                        key={notif.notification_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`glass-card p-4 flex items-start gap-4 group ${
                          !notif.is_read ? 'border-l-4 border-violet-500' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0 ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {notif.link ? (
                            <Link to={notif.link} className="block hover:opacity-80">
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className={`text-sm ${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {notif.message}
                              </p>
                            </Link>
                          ) : (
                            <>
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className={`text-sm ${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {notif.message}
                              </p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notif.created_at)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(notif.notification_id)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
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
        
        {/* Link to My Reports */}
        {isAuthenticated && (
          <div className="mt-8">
            <Link to="/my-reports" className="glass-card p-4 flex items-center gap-4 card-hover block">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Flag className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Mes signalements</p>
                <p className="text-sm text-muted-foreground">Suivez l'état de vos signalements</p>
              </div>
              <Shield className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
