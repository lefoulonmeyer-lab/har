import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, MessageSquare, ExternalLink, Edit, Save, X,
  Twitter, Youtube, Twitch
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { useAuthStore } from '../store/authStore';
import { RoleBadge } from '../components/Layout';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SocialIcon = ({ platform }) => {
  switch (platform) {
    case 'twitter':
      return <Twitter className="w-4 h-4" />;
    case 'youtube':
      return <Youtube className="w-4 h-4" />;
    case 'twitch':
      return <Twitch className="w-4 h-4" />;
    case 'tiktok':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      );
    default:
      return <ExternalLink className="w-4 h-4" />;
  }
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', social_links: {} });
  const [isSaving, setIsSaving] = useState(false);
  
  const isOwnProfile = currentUser?.user_id === userId;
  
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API}/users/${userId}`);
        setProfile(response.data);
        setEditForm({
          name: response.data.name || '',
          bio: response.data.bio || '',
          social_links: response.data.social_links || {}
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Utilisateur non trouvé');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(`${API}/users/me`, editForm, {
        withCredentials: true
      });
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Profil mis à jour !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSocialLinkChange = (platform, value) => {
    setEditForm(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass-card p-8">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Utilisateur non trouvé</h1>
          <Link to="/forum">
            <Button>Retour au forum</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
          data-testid="profile-card"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-violet-500/30">
                <AvatarImage src={profile.picture} alt={profile.name} />
                <AvatarFallback className="text-3xl">{profile.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            
            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="input-dark text-2xl font-heading font-bold mb-2"
                    />
                  ) : (
                    <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-3">
                      {profile.name}
                      <RoleBadge role={profile.role} />
                    </h1>
                  )}
                </div>
                
                {isOwnProfile && !isEditing && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="shrink-0"
                    data-testid="edit-profile-btn"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}
                
                {isEditing && (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button 
                      className="btn-primary"
                      onClick={handleSave}
                      disabled={isSaving}
                      data-testid="save-profile-btn"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Bio */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
                {isEditing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Parle-nous de toi..."
                    className="input-dark"
                    rows={3}
                  />
                ) : (
                  <p className="text-foreground">
                    {profile.bio || 'Aucune bio pour le moment.'}
                  </p>
                )}
              </div>
              
              {/* Social links */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Réseaux sociaux</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['twitter', 'youtube', 'twitch', 'tiktok'].map(platform => (
                      <div key={platform} className="flex items-center gap-2">
                        <SocialIcon platform={platform} />
                        <Input
                          value={editForm.social_links[platform] || ''}
                          onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                          placeholder={`Lien ${platform}`}
                          className="input-dark flex-1"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.social_links || {}).map(([platform, url]) => 
                      url && (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                        >
                          <SocialIcon platform={platform} />
                          <span className="capitalize">{platform}</span>
                        </a>
                      )
                    )}
                    {Object.keys(profile.social_links || {}).length === 0 && (
                      <span className="text-muted-foreground text-sm">Aucun lien ajouté</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
