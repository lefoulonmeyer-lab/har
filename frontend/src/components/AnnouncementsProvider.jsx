import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Info, AlertTriangle, CheckCircle, XCircle, Megaphone } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from './ui/dialog';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const styleConfig = {
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    buttonBg: 'bg-blue-600 hover:bg-blue-700'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    buttonBg: 'bg-amber-600 hover:bg-amber-700'
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    buttonBg: 'bg-green-600 hover:bg-green-700'
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    buttonBg: 'bg-red-600 hover:bg-red-700'
  }
};

// Banner Component
const AnnouncementBanner = ({ announcement, onDismiss }) => {
  const config = styleConfig[announcement.style] || styleConfig.info;
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${config.bg} ${config.border} border-b px-4 py-3`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={`w-5 h-5 ${config.text} shrink-0`} />
          <div className="min-w-0">
            <span className="font-medium">{announcement.title}</span>
            {announcement.message && (
              <span className="text-muted-foreground ml-2 hidden sm:inline">— {announcement.message}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm ${config.text} hover:underline flex items-center gap-1`}
            >
              {announcement.link_text || 'En savoir plus'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {announcement.is_dismissible && (
            <button
              onClick={() => onDismiss(announcement.announcement_id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Popup Component
const AnnouncementPopup = ({ announcement, onDismiss }) => {
  const config = styleConfig[announcement.style] || styleConfig.info;
  const Icon = config.icon;
  
  return (
    <Dialog open={true} onOpenChange={() => announcement.is_dismissible && onDismiss(announcement.announcement_id)}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.text}`} />
            {announcement.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">{announcement.message}</p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`${config.buttonBg} text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors`}
            >
              {announcement.link_text || 'En savoir plus'}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {announcement.is_dismissible && (
            <Button variant="ghost" onClick={() => onDismiss(announcement.announcement_id)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Toast Component
const AnnouncementToast = ({ announcement, onDismiss }) => {
  const config = styleConfig[announcement.style] || styleConfig.info;
  const Icon = config.icon;
  
  useEffect(() => {
    if (announcement.is_dismissible) {
      const timer = setTimeout(() => {
        onDismiss(announcement.announcement_id);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [announcement, onDismiss]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${config.bg} ${config.border} border rounded-lg p-4 shadow-lg max-w-sm`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.text} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{announcement.title}</p>
          {announcement.message && (
            <p className="text-sm text-muted-foreground mt-1">{announcement.message}</p>
          )}
          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm ${config.text} hover:underline flex items-center gap-1 mt-2`}
            >
              {announcement.link_text || 'En savoir plus'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {announcement.is_dismissible && (
          <button
            onClick={() => onDismiss(announcement.announcement_id)}
            className="p-1 hover:bg-white/10 rounded transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Main Announcements Provider Component
export const AnnouncementsProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    const stored = sessionStorage.getItem('dismissed_announcements');
    return stored ? JSON.parse(stored) : [];
  });
  
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get(`${API}/announcements`, { withCredentials: true });
        setAnnouncements(res.data.announcements || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    
    fetchAnnouncements();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    sessionStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };
  
  // Filter out dismissed announcements
  const activeAnnouncements = announcements.filter(ann => {
    if (dismissedIds.includes(ann.announcement_id)) return false;
    if (ann.show_once && dismissedIds.includes(`shown_${ann.announcement_id}`)) return false;
    return true;
  });
  
  // Mark show_once announcements as shown
  useEffect(() => {
    activeAnnouncements.forEach(ann => {
      if (ann.show_once && !dismissedIds.includes(`shown_${ann.announcement_id}`)) {
        const newDismissed = [...dismissedIds, `shown_${ann.announcement_id}`];
        setDismissedIds(newDismissed);
        sessionStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
      }
    });
  }, [activeAnnouncements]);
  
  const banners = activeAnnouncements.filter(a => a.type === 'banner');
  const popups = activeAnnouncements.filter(a => a.type === 'popup');
  const toasts = activeAnnouncements.filter(a => a.type === 'toast');
  
  return (
    <>
      {/* Banners at top */}
      <AnimatePresence>
        {banners.map(ann => (
          <AnnouncementBanner key={ann.announcement_id} announcement={ann} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
      
      {children}
      
      {/* Popups */}
      {popups.length > 0 && (
        <AnnouncementPopup announcement={popups[0]} onDismiss={handleDismiss} />
      )}
      
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(ann => (
            <AnnouncementToast key={ann.announcement_id} announcement={ann} onDismiss={handleDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AnnouncementsProvider;
