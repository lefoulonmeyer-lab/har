import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Eye, MessageCircle, Clock, Heart, Reply, Flag,
  MoreVertical, Pin, Lock, Trash2, Edit, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { useAuthStore } from '../store/authStore';
import { useForumStore } from '../store/forumStore';
import { RoleBadge } from '../components/Layout';
import { toast } from 'sonner';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const PostCard = ({ post, isAuthor, onReply, onLike, onReport }) => {
  const { user, isAuthenticated, login } = useAuthStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReply(replyContent, post.post_id);
      setReplyContent('');
      setShowReplyForm(false);
      toast.success('Réponse publiée !');
    } catch {
      toast.error('Erreur lors de la publication');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLiked = user && post.likes?.includes(user.user_id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 ${post.parent_id ? 'ml-8 border-l-2 border-violet-500/30' : ''}`}
      data-testid={`post-${post.post_id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <Link 
          to={`/profile/${post.author_id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author_picture} alt={post.author_name} />
            <AvatarFallback>{post.author_name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{post.author_name}</span>
              <RoleBadge role={post.author_role} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDate(post.created_at)}</span>
              {post.is_edited && <span className="italic">(modifié)</span>}
            </div>
          </div>
        </Link>
        
        {isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-white/10">
              <DropdownMenuItem onClick={() => onReport(post.post_id, 'post')} className="text-amber-400">
                <Flag className="w-4 h-4 mr-2" />
                Signaler
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Content */}
      <div className="prose prose-invert max-w-none mb-4">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => isAuthenticated ? onLike(post.post_id) : login()}
          className={`gap-2 ${isLiked ? 'text-red-400' : 'text-muted-foreground'}`}
          data-testid={`like-btn-${post.post_id}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{post.like_count || 0}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => isAuthenticated ? setShowReplyForm(!showReplyForm) : login()}
          className="gap-2 text-muted-foreground"
          data-testid={`reply-btn-${post.post_id}`}
        >
          <Reply className="w-4 h-4" />
          <span>Répondre</span>
        </Button>
      </div>
      
      {/* Reply form */}
      <AnimatePresence>
        {showReplyForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitReply}
            className="mt-4 pt-4 border-t border-white/5"
          >
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Répondre à ${post.author_name}...`}
              className="input-dark mb-3"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowReplyForm(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="btn-primary"
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? 'Envoi...' : 'Répondre'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuthStore();
  const { 
    currentTopic, posts, isLoading, 
    fetchTopic, fetchPosts, createPost, likePost, createReport, clearCurrentTopic 
  } = useForumStore();
  
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  
  useEffect(() => {
    fetchTopic(topicId);
    fetchPosts(topicId);
    
    return () => clearCurrentTopic();
  }, [topicId, fetchTopic, fetchPosts, clearCurrentTopic]);
  
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createPost({
        topic_id: topicId,
        content: newPostContent.trim()
      });
      setNewPostContent('');
      toast.success('Message publié !');
    } catch {
      toast.error('Erreur lors de la publication');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReply = async (content, parentId) => {
    await createPost({
      topic_id: topicId,
      content: content.trim(),
      parent_id: parentId
    });
  };
  
  const handleReport = (targetId, targetType) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setReportTarget({ id: targetId, type: targetType });
    setReportDialogOpen(true);
  };
  
  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    
    try {
      await createReport({
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason.trim()
      });
      toast.success('Signalement envoyé');
      setReportDialogOpen(false);
      setReportReason('');
    } catch {
      toast.error('Erreur lors du signalement');
    }
  };
  
  if (isLoading || !currentTopic) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 mb-6" />
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
          data-testid="back-btn"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Button>
        
        {/* Topic header */}
        <div className="glass-card p-6 mb-6" data-testid="topic-header">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {currentTopic.is_pinned && (
                  <Pin className="w-5 h-5 text-amber-500" />
                )}
                {currentTopic.is_locked && (
                  <Lock className="w-5 h-5 text-red-500" />
                )}
                <h1 className="font-heading text-2xl md:text-3xl font-bold">
                  {currentTopic.title}
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <Link 
                  to={`/profile/${currentTopic.author_id}`}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={currentTopic.author_picture} />
                    <AvatarFallback>{currentTopic.author_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span>{currentTopic.author_name}</span>
                  <RoleBadge role={currentTopic.author_role} />
                </Link>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(currentTopic.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {currentTopic.views} vues
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {currentTopic.reply_count} réponses
                </span>
              </div>
            </div>
            
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10">
                  <DropdownMenuItem 
                    onClick={() => handleReport(currentTopic.topic_id, 'topic')}
                    className="text-amber-400"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Signaler
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Topic content */}
          <div className="prose prose-invert max-w-none pt-4 border-t border-white/5">
            <p className="text-foreground whitespace-pre-wrap">{currentTopic.content}</p>
          </div>
        </div>
        
        {/* Posts */}
        <div className="space-y-4 mb-8">
          <h2 className="font-heading text-xl font-semibold">
            {posts.length} {posts.length === 1 ? 'réponse' : 'réponses'}
          </h2>
          
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.post_id}
                post={post}
                isAuthor={user?.user_id === post.author_id}
                onReply={handleReply}
                onLike={likePost}
                onReport={handleReport}
              />
            ))
          ) : (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucune réponse pour le moment. Soyez le premier à répondre !</p>
            </div>
          )}
        </div>
        
        {/* New post form */}
        {!currentTopic.is_locked ? (
          <div className="glass-card p-6" data-testid="new-post-form">
            <h3 className="font-heading font-semibold mb-4">Répondre</h3>
            {isAuthenticated ? (
              <form onSubmit={handleSubmitPost}>
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Écrivez votre réponse... (Utilisez @admin ou @modo pour signaler quelque chose)"
                  className="input-dark mb-4"
                  rows={4}
                  data-testid="new-post-textarea"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting || !newPostContent.trim()}
                    data-testid="submit-post-btn"
                  >
                    {isSubmitting ? 'Envoi...' : 'Publier'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Connectez-vous pour participer à la discussion
                </p>
                <Button onClick={login} className="btn-primary">
                  Se connecter
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-6 text-center border-red-500/30">
            <Lock className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-muted-foreground">Cette discussion est verrouillée</p>
          </div>
        )}
        
        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Signaler
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Décrivez la raison de votre signalement..."
                className="input-dark"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setReportDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={submitReport}
                disabled={!reportReason.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
