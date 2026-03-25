import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageSquare, User, Settings, LogOut, Menu, X, Bell, Search,
  Shield, Users, ChevronDown, ExternalLink, BadgeCheck, Building, Star,
  Handshake, Newspaper
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useForumStore } from '../store/forumStore';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Toaster } from './ui/sonner';

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/forum', icon: MessageSquare, label: 'Forum' },
];

// Verification badge configurations
const VERIFICATION_BADGES = {
  verified: { label: "Vérifié", color: "#3B82F6", icon: BadgeCheck },
  official: { label: "Officiel", color: "#F59E0B", icon: Shield },
  governmental: { label: "Gouvernemental", color: "#10B981", icon: Building },
  partner: { label: "Partenaire", color: "#8B5CF6", icon: Handshake },
  creator: { label: "Créateur", color: "#EC4899", icon: Star },
  press: { label: "Presse", color: "#6366F1", icon: Newspaper },
};

const VerificationBadge = ({ badge, showLabel = false }) => {
  if (!badge || !VERIFICATION_BADGES[badge]) return null;
  
  const config = VERIFICATION_BADGES[badge];
  const Icon = config.icon;
  
  return (
    <span 
      className="inline-flex items-center gap-1" 
      title={config.label}
      style={{ color: config.color }}
    >
      <Icon className="w-4 h-4" />
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const roleStyles = {
    admin: 'badge-admin',
    modo: 'badge-modo',
    streamer: 'badge-streamer',
    vip: 'badge-vip',
  };
  
  if (!role || role === 'user') return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${roleStyles[role] || ''}`}>
      {role}
    </span>
  );
};

const Header = ({ onMenuToggle, isMobileMenuOpen }) => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { unreadCount } = useForumStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <header className="glass-nav sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="logo-link">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-neon">
            <span className="text-white font-heading font-bold text-lg">A</span>
          </div>
          <span className="font-heading font-bold text-xl hidden sm:block gradient-text-violet">
            Astuceson
          </span>
        </Link>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-dark"
              data-testid="search-input"
            />
          </div>
        </form>
        
        {/* Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="btn-ghost flex items-center gap-2 text-sm text-muted-foreground hover:text-white"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        
        {/* Right section */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                data-testid="notifications-btn"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="user-menu-trigger">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.picture} alt={user?.name} />
                      <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card border-white/10">
                  <div className="px-3 py-2">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <RoleBadge role={user?.role} />
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user?.user_id}`} className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === 'admin' || user?.role === 'modo') && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      {user?.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-red-400">
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/moderation" className="flex items-center gap-2 cursor-pointer text-emerald-400">
                          <Users className="w-4 h-4" />
                          Modération
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-red-400">
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={login} className="btn-primary" data-testid="login-btn">
              Connexion
            </Button>
          )}
          
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};

const MobileMenu = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, login } = useAuthStore();
  const location = useLocation();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-72 glass-card z-50 md:hidden p-6"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-end mb-8">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      location.pathname === item.path
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'hover:bg-white/5 text-muted-foreground hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
              
              {/* Social links */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <a
                  href="https://discord.gg/5VFqZzWDTT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Discord</span>
                  <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                </a>
                <a
                  href="https://tiktok.com/@astuceson_off"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span>TikTok</span>
                  <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                </a>
              </div>
              
              {!isAuthenticated && (
                <div className="pt-6">
                  <Button onClick={login} className="btn-primary w-full">
                    Connexion avec Google
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Footer = () => {
  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg">A</span>
              </div>
              <span className="font-heading font-bold text-xl gradient-text-violet">Astuceson</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              La communauté francophone des streamers et créateurs de contenu. Rejoins-nous pour partager, discuter et grandir ensemble.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://discord.gg/5VFqZzWDTT"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@astuceson_off"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to="/forum" className="hover:text-white transition-colors">Forum</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Recherche</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Astuceson. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Disable right-click globally
  React.useEffect(() => {
    const handleContextMenu = (e) => {
      if (!e.target.closest('input, textarea, [contenteditable="true"]')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#09090B]">
      <Header 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  );
};

export { RoleBadge, VerificationBadge, VERIFICATION_BADGES };
