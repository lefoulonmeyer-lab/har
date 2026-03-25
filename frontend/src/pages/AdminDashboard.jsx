import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MessageSquare, FileText, AlertTriangle, Shield, 
  TrendingUp, Clock, Ban, Trash2, Edit, ChevronRight, Plus,
  Eye, EyeOff, Search, Filter, BadgeCheck, Building, Star,
  Handshake, Newspaper, X, Check, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { useAuthStore } from '../store/authStore';
import { RoleBadge, VerificationBadge } from '../components/Layout';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Badge options for verification
const VERIFICATION_BADGES = {
  verified: { label: "Vérifié", color: "#3B82F6", icon: BadgeCheck },
  official: { label: "Officiel", color: "#F59E0B", icon: Shield },
  governmental: { label: "Gouvernemental", color: "#10B981", icon: Building },
  partner: { label: "Partenaire", color: "#8B5CF6", icon: Handshake },
  creator: { label: "Créateur", color: "#EC4899", icon: Star },
  press: { label: "Presse", color: "#6366F1", icon: Newspaper },
};

const StatCard = ({ icon: Icon, value, label, color, subValue }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-sm mb-1">{label}</p>
        <p className="text-3xl font-heading font-bold">{value}</p>
        {subValue && <p className="text-sm text-muted-foreground mt-1">{subValue}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      
      const res = await axios.get(`${API}/admin/users?${params}`, { withCredentials: true });
      setUsers(res.data.users);
      setTotalPages(res.data.pages);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };
  
  const handleUpdateUser = async (userId, updates) => {
    try {
      await axios.put(`${API}/admin/users/${userId}`, updates, { withCredentials: true });
      toast.success('Utilisateur mis à jour');
      fetchUsers();
      setEditDialogOpen(false);
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { withCredentials: true });
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleSetBadge = async (userId, badge) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/badge`, { badge }, { withCredentials: true });
      toast.success(badge ? 'Badge attribué' : 'Badge retiré');
      fetchUsers();
    } catch {
      toast.error('Erreur');
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="input-dark pl-10"
            />
          </div>
          <Button type="submit">Rechercher</Button>
        </form>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 input-dark">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="streamer">Streamer</SelectItem>
            <SelectItem value="modo">Modo</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Users list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.user_id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.picture} />
                <AvatarFallback>{user.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{user.name}</p>
                  <RoleBadge role={user.role} />
                  {user.verification_badge && (
                    <VerificationBadge badge={user.verification_badge} />
                  )}
                  {user.is_banned && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">Banni</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              
              {/* Badge selector */}
              <Select 
                value={user.verification_badge || 'none'} 
                onValueChange={(v) => handleSetBadge(user.user_id, v === 'none' ? null : v)}
              >
                <SelectTrigger className="w-36 input-dark">
                  <SelectValue placeholder="Badge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun badge</SelectItem>
                  {Object.entries(VERIFICATION_BADGES).map(([key, badge]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <badge.icon className="w-4 h-4" style={{ color: badge.color }} />
                        {badge.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Role selector */}
              <Select 
                value={user.role} 
                onValueChange={(v) => handleUpdateUser(user.user_id, { role: v })}
              >
                <SelectTrigger className="w-28 input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="streamer">Streamer</SelectItem>
                  <SelectItem value="modo">Modo</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Actions */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdateUser(user.user_id, { is_banned: !user.is_banned })}
                className={user.is_banned ? 'text-green-500 hover:text-green-400' : 'text-amber-500 hover:text-amber-400'}
                title={user.is_banned ? 'Débannir' : 'Bannir'}
              >
                <Ban className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteUser(user.user_id)}
                className="text-red-500 hover:text-red-400"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Précédent
          </Button>
          <span className="flex items-center px-4 text-sm">Page {page} / {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};

// Category Management Component
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, category: null });
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'MessageSquare', color: '#7C3AED' });
  
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/admin/categories`, { withCredentials: true });
      setCategories(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const handleSave = async () => {
    try {
      if (editDialog.category) {
        await axios.put(`${API}/categories/${editDialog.category.category_id}`, formData, { withCredentials: true });
        toast.success('Catégorie mise à jour');
      } else {
        await axios.post(`${API}/categories`, formData, { withCredentials: true });
        toast.success('Catégorie créée');
      }
      fetchCategories();
      setEditDialog({ open: false, category: null });
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleDelete = async (catId) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await axios.delete(`${API}/categories/${catId}`, { withCredentials: true });
      toast.success('Catégorie supprimée');
      fetchCategories();
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleToggleVisibility = async (cat) => {
    try {
      await axios.put(`${API}/categories/${cat.category_id}`, { is_visible: !cat.is_visible }, { withCredentials: true });
      fetchCategories();
    } catch {
      toast.error('Erreur');
    }
  };
  
  const openEditDialog = (cat = null) => {
    if (cat) {
      setFormData({ name: cat.name, description: cat.description, icon: cat.icon, color: cat.color });
    } else {
      setFormData({ name: '', description: '', icon: 'MessageSquare', color: '#7C3AED' });
    }
    setEditDialog({ open: true, category: cat });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Catégories du forum</h3>
        <Button onClick={() => openEditDialog()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.category_id} className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${cat.is_visible !== false ? 'bg-white/5 hover:bg-white/10' : 'bg-white/2 opacity-50'}`}>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{cat.name}</p>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(cat)} title={cat.is_visible !== false ? 'Masquer' : 'Afficher'}>
                {cat.is_visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(cat)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(cat.category_id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit/Create Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>{editDialog.category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-dark"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-dark"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Couleur</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="input-dark flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialog({ open: false, category: null })}>Annuler</Button>
            <Button onClick={handleSave} className="btn-primary">Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reports Management Component
const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [resolution, setResolution] = useState({ note: '', action: 'none' });
  
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/reports?status=${statusFilter}`, { withCredentials: true });
      setReports(res.data.reports);
    } catch {
      toast.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReports();
  }, [statusFilter]);
  
  const openDetail = async (report) => {
    try {
      const res = await axios.get(`${API}/reports/${report.report_id}`, { withCredentials: true });
      setSelectedReport(res.data);
      setDetailDialog(true);
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleUpdateReport = async (status) => {
    if (!selectedReport) return;
    try {
      await axios.put(`${API}/reports/${selectedReport.report.report_id}`, {
        status,
        resolution_note: resolution.note,
        action_taken: resolution.action
      }, { withCredentials: true });
      toast.success('Signalement mis à jour');
      setDetailDialog(false);
      fetchReports();
    } catch {
      toast.error('Erreur');
    }
  };
  
  const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400',
    in_review: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    dismissed: 'bg-gray-500/20 text-gray-400'
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">Signalements</h3>
        <div className="flex gap-2">
          {['pending', 'in_review', 'resolved', 'dismissed'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'btn-primary' : ''}
            >
              {status === 'pending' && 'En attente'}
              {status === 'in_review' && 'En cours'}
              {status === 'resolved' && 'Résolus'}
              {status === 'dismissed' && 'Classés'}
            </Button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-2">
          {reports.map(report => (
            <div 
              key={report.report_id} 
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => openDetail(report)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {report.target_type} • {report.reporter_name}
                    </span>
                  </div>
                  <p className="font-medium">{report.reason}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(report.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Aucun signalement
        </div>
      )}
      
      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="glass-card border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail du signalement</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Signalé par</p>
                  <p className="font-medium">{selectedReport.report.reporter_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedReport.report.target_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Raison</p>
                  <p className="font-medium">{selectedReport.report.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedReport.report.created_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
              
              {selectedReport.report.details && (
                <div>
                  <p className="text-sm text-muted-foreground">Détails</p>
                  <p className="mt-1 p-3 rounded bg-white/5">{selectedReport.report.details}</p>
                </div>
              )}
              
              {selectedReport.target && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Contenu signalé</p>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    {selectedReport.report.target_type === 'post' && (
                      <>
                        <p className="text-sm text-muted-foreground mb-1">Par {selectedReport.target.author_name}</p>
                        <p>{selectedReport.target.content}</p>
                      </>
                    )}
                    {selectedReport.report.target_type === 'topic' && (
                      <>
                        <p className="font-medium">{selectedReport.target.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">Par {selectedReport.target.author_name}</p>
                      </>
                    )}
                    {selectedReport.report.target_type === 'user' && (
                      <>
                        <p className="font-medium">{selectedReport.target.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedReport.target.bio || 'Pas de bio'}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {selectedReport.report.status === 'pending' || selectedReport.report.status === 'in_review' ? (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">Action à prendre</p>
                    <Select value={resolution.action} onValueChange={(v) => setResolution({ ...resolution, action: v })}>
                      <SelectTrigger className="input-dark">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune action</SelectItem>
                        <SelectItem value="warning">Avertissement</SelectItem>
                        <SelectItem value="delete">Supprimer le contenu</SelectItem>
                        <SelectItem value="ban">Bannir l'utilisateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Note de résolution</p>
                    <Textarea
                      value={resolution.note}
                      onChange={(e) => setResolution({ ...resolution, note: e.target.value })}
                      placeholder="Expliquer la décision..."
                      className="input-dark"
                    />
                  </div>
                </>
              ) : (
                selectedReport.report.resolution_note && (
                  <div>
                    <p className="text-sm text-muted-foreground">Résolution</p>
                    <p className="mt-1 p-3 rounded bg-white/5">{selectedReport.report.resolution_note}</p>
                  </div>
                )
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailDialog(false)}>Fermer</Button>
            {selectedReport && (selectedReport.report.status === 'pending' || selectedReport.report.status === 'in_review') && (
              <>
                <Button variant="outline" onClick={() => handleUpdateReport('in_review')}>
                  En cours d'examen
                </Button>
                <Button variant="outline" className="text-gray-400" onClick={() => handleUpdateReport('dismissed')}>
                  Classer
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateReport('resolved')}>
                  <Check className="w-4 h-4 mr-2" />
                  Résoudre
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Logs Component
const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API}/admin/logs`, { withCredentials: true });
        setLogs(res.data.logs);
      } catch {
        toast.error('Erreur');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);
  
  const actionLabels = {
    update_user: 'Modification utilisateur',
    delete_user: 'Suppression utilisateur',
    warn_user: 'Avertissement',
    mute_user: 'Mute',
    set_badge: 'Attribution badge',
    create_category: 'Création catégorie',
    update_category: 'Modification catégorie',
    delete_category: 'Suppression catégorie',
    delete_topic: 'Suppression discussion',
    delete_post: 'Suppression message',
    update_report: 'Traitement signalement'
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-lg">Historique des actions</h3>
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.log_id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-40 shrink-0">
                {new Date(log.created_at).toLocaleString('fr-FR')}
              </span>
              <span className="font-medium text-violet-400">{log.admin_name}</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-xs">
                {actionLabels[log.action] || log.action}
              </span>
              <span className="text-muted-foreground truncate flex-1">
                {log.target_id}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">Aucun log</p>
      )}
    </div>
  );
};

// Main Admin Dashboard
export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/admin/stats`, { withCredentials: true });
        setStats(res.data);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);
  
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-red-500" />
          <h1 className="font-heading text-3xl font-bold">Administration</h1>
        </div>
        
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={Users} 
              value={stats.users_count} 
              label="Utilisateurs" 
              color="bg-violet-600"
              subValue={stats.banned_users > 0 ? `${stats.banned_users} bannis` : null}
            />
            <StatCard icon={MessageSquare} value={stats.topics_count} label="Discussions" color="bg-cyan-600" />
            <StatCard icon={FileText} value={stats.posts_count} label="Messages" color="bg-emerald-600" />
            <StatCard 
              icon={AlertTriangle} 
              value={stats.reports_pending + stats.reports_in_review} 
              label="Signalements actifs" 
              color="bg-amber-600"
              subValue={`${stats.reports_pending} en attente`}
            />
          </div>
        )}
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="glass-card p-1 flex-wrap">
            <TabsTrigger value="users" className="data-[state=active]:bg-violet-500/20">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-violet-500/20">
              <MessageSquare className="w-4 h-4 mr-2" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-violet-500/20">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Signalements
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-violet-500/20">
              <Clock className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="glass-card p-6">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="categories" className="glass-card p-6">
            <CategoryManagement />
          </TabsContent>
          
          <TabsContent value="reports" className="glass-card p-6">
            <ReportsManagement />
          </TabsContent>
          
          <TabsContent value="logs" className="glass-card p-6">
            <AdminLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
