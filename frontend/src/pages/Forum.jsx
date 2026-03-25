import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Plus, Eye, MessageCircle, Clock, Pin, Lock,
  ChevronLeft, Filter, Video, Tv, Youtube, Sparkles, Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { useAuthStore } from '../store/authStore';
import { useForumStore } from '../store/forumStore';
import { RoleBadge } from '../components/Layout';
import { toast } from 'sonner';

const icons = {
  MessageSquare,
  Video,
  Tv,
  Youtube,
  Monitor: Tv,
  Calendar: Sparkles
};

const CategorySidebar = ({ categories, selectedCategory, onSelect }) => {
  return (
    <div className="glass-card p-4 sticky top-20">
      <h3 className="font-heading font-semibold mb-4 px-2">Catégories</h3>
      <nav className="space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
            !selectedCategory 
              ? 'bg-violet-500/20 text-violet-400' 
              : 'hover:bg-white/5 text-muted-foreground hover:text-white'
          }`}
          data-testid="category-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Toutes les discussions</span>
        </button>
        {categories.map((cat) => {
          const Icon = icons[cat.icon] || MessageSquare;
          return (
            <button
              key={cat.category_id}
              onClick={() => onSelect(cat.category_id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedCategory === cat.category_id
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'hover:bg-white/5 text-muted-foreground hover:text-white'
              }`}
              data-testid={`category-${cat.category_id}`}
            >
              <Icon className="w-4 h-4" style={{ color: cat.color }} />
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const TopicCard = ({ topic, index }) => {
  const category = useForumStore(state => 
    state.categories.find(c => c.category_id === topic.category_id)
  );
  
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/topic/${topic.topic_id}`}
        className="glass-card p-4 flex items-start gap-4 card-hover block group"
        data-testid={`topic-${topic.topic_id}`}
      >
        {/* Author avatar */}
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 overflow-hidden">
            {topic.author_picture ? (
              <img src={topic.author_picture} alt={topic.author_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                {topic.author_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {topic.is_pinned && (
              <Pin className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            {topic.is_locked && (
              <Lock className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <h3 className="font-heading font-semibold truncate group-hover:text-violet-400 transition-colors">
              {topic.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground">{topic.author_name}</span>
              <RoleBadge role={topic.author_role} />
            </span>
            {category && (
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: `${category.color}20`, 
                  color: category.color 
                }}
              >
                {category.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{topic.views}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>{topic.reply_count}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-[80px]">
            <Clock className="w-4 h-4" />
            <span>{formatDate(topic.created_at)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const TopicSkeleton = () => (
  <div className="glass-card p-4 flex items-start gap-4">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

const NewTopicDialog = ({ categories, selectedCategory, onCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(selectedCategory || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTopic } = useForumStore();
  const { isAuthenticated, login } = useAuthStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;
    
    setIsSubmitting(true);
    try {
      await createTopic({
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId
      });
      toast.success('Discussion créée !');
      setTitle('');
      setContent('');
      setOpen(false);
      onCreated?.();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <Button onClick={login} className="btn-primary" data-testid="new-topic-login">
        <Plus className="w-4 h-4 mr-2" />
        Nouvelle discussion
      </Button>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary" data-testid="new-topic-btn">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-white/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Nouvelle discussion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Catégorie</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="input-dark" data-testid="category-select">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Titre</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de votre discussion..."
              className="input-dark"
              data-testid="topic-title-input"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez votre message... (Utilisez @admin ou @modo pour signaler quelque chose)"
              className="input-dark min-h-[150px]"
              data-testid="topic-content-input"
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting || !title.trim() || !content.trim() || !categoryId}
              data-testid="submit-topic-btn"
            >
              {isSubmitting ? 'Création...' : 'Publier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function Forum() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const navigate = useNavigate();
  
  const { categories, topics, isLoading, fetchCategories, fetchTopics } = useForumStore();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  useEffect(() => {
    fetchTopics(selectedCategory, page).then(data => {
      if (data) setTotalPages(data.pages);
    });
  }, [selectedCategory, page, fetchTopics]);
  
  const handleCategorySelect = (catId) => {
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };
  
  const currentCategory = categories.find(c => c.category_id === selectedCategory);
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCategorySelect(null)}
                  className="shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <h1 className="font-heading text-3xl font-bold">
                {currentCategory ? currentCategory.name : 'Forum'}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {currentCategory 
                ? currentCategory.description 
                : 'Rejoins les discussions de la communauté'}
            </p>
          </div>
          <NewTopicDialog 
            categories={categories} 
            selectedCategory={selectedCategory}
            onCreated={() => fetchTopics(selectedCategory, 1)}
          />
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <CategorySidebar 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </div>
          
          {/* Topics list */}
          <div className="lg:col-span-3 space-y-3">
            {/* Mobile category filter */}
            <div className="lg:hidden mb-4">
              <Select 
                value={selectedCategory || 'all'} 
                onValueChange={(v) => handleCategorySelect(v === 'all' ? null : v)}
              >
                <SelectTrigger className="input-dark">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <TopicSkeleton key={i} />)}
              </div>
            ) : topics.length > 0 ? (
              <>
                <AnimatePresence mode="popLayout">
                  {topics.map((topic, index) => (
                    <TopicCard key={topic.topic_id} topic={topic} index={index} />
                  ))}
                </AnimatePresence>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Page {page} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">
                  Aucune discussion
                </h3>
                <p className="text-muted-foreground mb-4">
                  Soyez le premier à créer une discussion dans cette catégorie !
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
