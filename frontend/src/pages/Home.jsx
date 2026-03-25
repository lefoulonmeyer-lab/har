import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Users, TrendingUp, ArrowRight, ExternalLink, 
  Tv, Video, Youtube, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useForumStore } from '../store/forumStore';

const StatCard = ({ icon: Icon, value, label, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 text-center card-hover"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-3xl font-heading font-bold">{value}</p>
    <p className="text-muted-foreground text-sm mt-1">{label}</p>
  </motion.div>
);

const CategoryCard = ({ category, index }) => {
  const icons = {
    MessageSquare,
    Video,
    Tv,
    Youtube,
    Monitor: Tv,
    Calendar: Sparkles
  };
  const Icon = icons[category.icon] || MessageSquare;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/forum?category=${category.category_id}`}
        className="glass-card p-6 flex items-start gap-4 card-hover block group"
        data-testid={`category-card-${category.category_id}`}
      >
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${category.color}20`, color: category.color }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-lg group-hover:text-violet-400 transition-colors">
            {category.name}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
            {category.description}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors shrink-0" />
      </Link>
    </motion.div>
  );
};

const DiscordBanner = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8"
  >
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwSDI4VjBoNHYzNHptLTYgMGgtNFYwaDR2MzR6bS02IDBoLTRWMGg0djM0em0tNiAwSDEwVjBoNHYzNHptLTYgMEg0VjBoNHYzNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-heading font-bold text-xl text-white">Rejoins le Discord !</h3>
          <p className="text-white/80 text-sm">Discute en temps réel avec la communauté</p>
        </div>
      </div>
      <a
        href="https://discord.gg/5VFqZzWDTT"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        data-testid="discord-cta"
      >
        <Button className="bg-white text-indigo-600 hover:bg-white/90 font-semibold px-6">
          Rejoindre
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </a>
    </div>
  </motion.div>
);

const TikTokBanner = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.1 }}
    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 p-8"
  >
    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-heading font-bold text-xl text-white">Suis-nous sur TikTok</h3>
          <p className="text-white/80 text-sm">@astuceson_off - Du contenu exclusif !</p>
        </div>
      </div>
      <a
        href="https://tiktok.com/@astuceson_off"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        data-testid="tiktok-cta"
      >
        <Button className="bg-white text-pink-600 hover:bg-white/90 font-semibold px-6">
          Voir les lives
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </a>
    </div>
  </motion.div>
);

export default function Home() {
  const { isAuthenticated, login } = useAuthStore();
  const { categories, fetchCategories, fetchStats } = useForumStore();
  const [stats, setStats] = useState({ users_count: 0, topics_count: 0, posts_count: 0 });
  
  useEffect(() => {
    fetchCategories();
    fetchStats().then(data => {
      if (data) setStats(data);
    });
  }, [fetchCategories, fetchStats]);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative hero-gradient pattern-grid py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#09090B]" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-400 font-medium">La communauté des streamers</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">Bienvenue sur</span>
              <br />
              <span className="gradient-text-violet">Astuceson</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Le forum de la communauté francophone des streamers et créateurs de contenu. 
              Partage, discute et échange avec d'autres passionnés.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/forum">
                  <Button className="btn-primary text-lg px-8 py-6" data-testid="explore-forum-btn">
                    Explorer le forum
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={login} className="btn-primary text-lg px-8 py-6" data-testid="join-btn">
                  Rejoindre la communauté
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              <a href="https://discord.gg/5VFqZzWDTT" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="text-lg px-8 py-6 border-white/10 hover:bg-white/5">
                  Discord
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={Users} value={stats.users_count} label="Membres" color="bg-violet-600" />
            <StatCard icon={MessageSquare} value={stats.topics_count} label="Discussions" color="bg-cyan-600" />
            <StatCard icon={TrendingUp} value={stats.posts_count} label="Messages" color="bg-emerald-600" />
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-bold">Catégories</h2>
              <p className="text-muted-foreground mt-1">Explore les différentes sections du forum</p>
            </div>
            <Link to="/forum">
              <Button variant="ghost" className="hidden sm:flex items-center gap-2" data-testid="see-all-categories">
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.slice(0, 6).map((category, index) => (
              <CategoryCard key={category.category_id} category={category} index={index} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Community Banners */}
      <section className="py-16 bg-gradient-to-b from-transparent to-[#0f0f12]">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <DiscordBanner />
          <TikTokBanner />
        </div>
      </section>
    </div>
  );
}
