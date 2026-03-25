import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MessageSquare, FileText, AlertTriangle, Shield, 
  Clock, Ban, Trash2, Edit, Plus, Eye, EyeOff, Search, Filter, 
  BadgeCheck, Building, Star, Handshake, Newspaper, X, Check, 
  ChevronDown, ChevronRight, UserX, UserCheck, AlertCircle, Pause,
  Wrench, Megaphone, Bell, Link, ExternalLink, Calendar, ToggleLeft, ToggleRight,
  Info, AlertOctagon, CheckCircle, XCircle
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

// Badge configurations
const VERIFICATION_BADGES = {
  verified: { label: "Vérifié", color: "#3B82F6", icon: BadgeCheck },
  official: { label: "Officiel", color: "#F59E0B", icon: Shield },
  governmental: { label: "Gouvernemental", color: "#10B981", icon: Building },
  partner: { label: "Partenaire", color: "#8B5CF6", icon: Handshake },
  creator: { label: "Créateur", color: "#EC4899", icon: Star },
  press: { label: "Presse", color: "#6366F1", icon: Newspaper },
};

// Account status configurations
const ACCOUNT_STATUSES = {
  active: { label: "Actif", color: "bg-green-500/20 text-green-400", icon: UserCheck },
  pending_verification: { label: "En vérification", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  suspended: { label: "Suspendu", color: "bg-orange-500/20 text-orange-400", icon: Pause },
  banned: { label: "Banni", color: "bg-red-500/20 text-red-400", icon: Ban },
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color, subValue }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-4 sm:p-6"
  >
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs sm:text-sm mb-1 truncate">{label}</p>
        <p className="text-2xl sm:text-3xl font-heading font-bold">{value}</p>
        {subValue && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subValue}</p>}
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

// User Card Component for Mobile
const UserCard = ({ user, onEdit, onStatusChange, onBadgeChange, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = ACCOUNT_STATUSES[user.account_status] || ACCOUNT_STATUSES.active;
  const StatusIcon = statusConfig.icon;
  
  return (
    <div className="glass-card overflow-hidden">
      {/* Header - Always visible */}
      <div 
        className="p-4 flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={user.picture} />
          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{user.name}</p>
            {user.verification_badge && (
              <VerificationBadge badge={user.verification_badge} />
            )}
            <RoleBadge role={user.role} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          
          {/* Status selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Statut du compte</label>
            <Select 
              value={user.account_status || 'active'} 
              onValueChange={(v) => onStatusChange(user.user_id, v)}
            >
              <SelectTrigger className="input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_STATUSES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Badge selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Badge de vérification</label>
            <Select 
              value={user.verification_badge || 'none'} 
              onValueChange={(v) => onBadgeChange(user.user_id, v === 'none' ? null : v)}
            >
              <SelectTrigger className="input-dark">
                <SelectValue />
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
          </div>
          
          {/* Role selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Rôle</label>
            <Select 
              value={user.role} 
              onValueChange={(v) => onEdit(user.user_id, { role: v })}
            >
              <SelectTrigger className="input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="streamer">Streamer</SelectItem>
                <SelectItem value="modo">Modérateur</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-400 border-red-500/30"
              onClick={() => onDelete(user.user_id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusDialog, setStatusDialog] = useState({ open: false, user: null, status: '', reason: '' });
  
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
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleStatusChange = (userId, status) => {
    const user = users.find(u => u.user_id === userId);
    if (status === 'banned' || status === 'suspended') {
      setStatusDialog({ 
        open: true, 
        user, 
        status, 
        reason: '' 
      });
    } else {
      handleUpdateUser(userId, { account_status: status });
    }
  };
  
  const confirmStatusChange = async () => {
    const { user, status, reason } = statusDialog;
    const updates = { account_status: status };
    if (status === 'banned') {
      updates.ban_reason = reason || 'Violation des règles';
      updates.is_banned = true;
    } else if (status === 'suspended') {
      updates.suspension_reason = reason || 'Suspension temporaire';
    }
    await handleUpdateUser(user.user_id, updates);
    setStatusDialog({ open: false, user: null, status: '', reason: '' });
  };
  
  const handleBadgeChange = async (userId, badge) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/badge`, { badge }, { withCredentials: true });
      toast.success(badge ? 'Badge attribué' : 'Badge retiré');
      fetchUsers();
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
  
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="input-dark pl-10"
            />
          </div>
          <Button type="submit" size="icon" className="shrink-0">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="input-dark">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="streamer">Streamer</SelectItem>
            <SelectItem value="modo">Modérateur</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Users list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <UserCard
              key={user.user_id}
              user={user}
              onEdit={handleUpdateUser}
              onStatusChange={handleStatusChange}
              onBadgeChange={handleBadgeChange}
              onDelete={handleDeleteUser}
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Préc.
          </Button>
          <span className="flex items-center px-3 text-sm">{page}/{totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Suiv.
          </Button>
        </div>
      )}
      
      {/* Status change dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}>
        <DialogContent className="glass-card border-white/10 mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusDialog.status === 'banned' ? (
                <>
                  <Ban className="w-5 h-5 text-red-500" />
                  Bannir {statusDialog.user?.name}
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 text-orange-500" />
                  Suspendre {statusDialog.user?.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Raison</label>
            <Textarea
              value={statusDialog.reason}
              onChange={(e) => setStatusDialog({ ...statusDialog, reason: e.target.value })}
              placeholder={statusDialog.status === 'banned' ? 'Raison du bannissement...' : 'Raison de la suspension...'}
              className="input-dark"
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setStatusDialog({ open: false, user: null, status: '', reason: '' })}>
              Annuler
            </Button>
            <Button 
              onClick={confirmStatusChange}
              className={statusDialog.status === 'banned' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        <h3 className="font-heading font-semibold">Catégories</h3>
        <Button onClick={() => openEditDialog()} size="sm" className="btn-primary">
          <Plus className="w-4 h-4 mr-1" />
          Nouvelle
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.category_id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${cat.is_visible !== false ? 'bg-white/5' : 'bg-white/2 opacity-50'}`}>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleVisibility(cat)}>
                  {cat.is_visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(cat)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(cat.category_id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit/Create Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="glass-card border-white/10 mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialog.category ? 'Modifier' : 'Nouvelle catégorie'}</DialogTitle>
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
                rows={2}
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
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
      setResolution({ note: '', action: 'none' });
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
      toast.success('Signalement traité');
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
      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'pending', label: 'Attente' },
          { value: 'in_review', label: 'En cours' },
          { value: 'resolved', label: 'Résolus' },
          { value: 'dismissed', label: 'Classés' }
        ].map(({ value, label }) => (
          <Button
            key={value}
            variant={statusFilter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(value)}
            className={`shrink-0 ${statusFilter === value ? 'btn-primary' : ''}`}
          >
            {label}
          </Button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map(report => (
            <div 
              key={report.report_id} 
              className="p-4 rounded-lg bg-white/5 cursor-pointer active:bg-white/10"
              onClick={() => openDetail(report)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {report.target_type}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate">{report.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    par {report.reporter_name}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucun signalement
        </div>
      )}
      
      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="glass-card border-white/10 mx-4 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Signalement</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Par</p>
                  <p className="font-medium">{selectedReport.report.reporter_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Type</p>
                  <p className="font-medium">{selectedReport.report.target_type}</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-xs mb-1">Raison</p>
                <p className="text-sm p-2 rounded bg-white/5">{selectedReport.report.reason}</p>
              </div>
              
              {selectedReport.target && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Contenu</p>
                  <div className="p-3 rounded bg-white/5 border border-white/10 text-sm">
                    {selectedReport.report.target_type === 'post' && (
                      <p>{selectedReport.target.content?.substring(0, 200)}...</p>
                    )}
                    {selectedReport.report.target_type === 'topic' && (
                      <p className="font-medium">{selectedReport.target.title}</p>
                    )}
                    {selectedReport.report.target_type === 'user' && (
                      <p>{selectedReport.target.name}</p>
                    )}
                  </div>
                </div>
              )}
              
              {(selectedReport.report.status === 'pending' || selectedReport.report.status === 'in_review') && (
                <>
                  <div>
                    <p className="text-xs font-medium mb-1">Action</p>
                    <Select value={resolution.action} onValueChange={(v) => setResolution({ ...resolution, action: v })}>
                      <SelectTrigger className="input-dark">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune</SelectItem>
                        <SelectItem value="warning">Avertir</SelectItem>
                        <SelectItem value="delete">Supprimer</SelectItem>
                        <SelectItem value="ban">Bannir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Note</p>
                    <Textarea
                      value={resolution.note}
                      onChange={(e) => setResolution({ ...resolution, note: e.target.value })}
                      placeholder="Note de résolution..."
                      className="input-dark"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setDetailDialog(false)}>Fermer</Button>
            {selectedReport && (selectedReport.report.status === 'pending' || selectedReport.report.status === 'in_review') && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleUpdateReport('dismissed')}>
                  Classer
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateReport('resolved')}>
                  <Check className="w-4 h-4 mr-1" />
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

// Admin Logs Component
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
    update_user: 'Modif. user',
    delete_user: 'Suppr. user',
    warn_user: 'Avertissement',
    mute_user: 'Mute',
    set_badge: 'Badge',
    create_category: 'Créa. catégorie',
    update_category: 'Modif. catégorie',
    delete_category: 'Suppr. catégorie',
    delete_topic: 'Suppr. topic',
    delete_post: 'Suppr. post',
    update_report: 'Signalement',
    toggle_maintenance: 'Maintenance',
    create_announcement: 'Créa. annonce',
    update_announcement: 'Modif. annonce',
    delete_announcement: 'Suppr. annonce'
  };
  
  return (
    <div className="space-y-3">
      {isLoading ? (
        [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)
      ) : logs.length > 0 ? (
        logs.map(log => (
          <div key={log.log_id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-violet-400">{log.admin_name}</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-xs">
                  {actionLabels[log.action] || log.action}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {new Date(log.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8 text-sm">Aucun log</p>
      )}
    </div>
  );
};

// Maintenance Management Component
const MaintenanceManagement = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    title: 'Maintenance en cours',
    message: 'Le site est temporairement indisponible pour maintenance. Nous serons bientôt de retour !',
    eta: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings/maintenance`, { withCredentials: true });
        setSettings({
          enabled: res.data.maintenance_mode,
          title: res.data.title || 'Maintenance en cours',
          message: res.data.message || 'Le site est temporairement indisponible pour maintenance.',
          eta: res.data.eta || ''
        });
      } catch (error) {
        console.error('Error fetching maintenance settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API}/admin/settings/maintenance`, settings, { withCredentials: true });
      toast.success(settings.enabled ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleMaintenance = async () => {
    const newEnabled = !settings.enabled;
    setSettings({ ...settings, enabled: newEnabled });
    setIsSaving(true);
    try {
      await axios.put(`${API}/admin/settings/maintenance`, { ...settings, enabled: newEnabled }, { withCredentials: true });
      toast.success(newEnabled ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
    } catch {
      toast.error('Erreur');
      setSettings({ ...settings, enabled: !newEnabled });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-32" /></div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Toggle Card */}
      <div className={`p-6 rounded-xl border-2 transition-colors ${settings.enabled ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.enabled ? 'bg-amber-500/20' : 'bg-white/10'}`}>
              <Wrench className={`w-6 h-6 ${settings.enabled ? 'text-amber-400' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg">Mode Maintenance</h3>
              <p className="text-sm text-muted-foreground">
                {settings.enabled ? 'Le site est actuellement en maintenance' : 'Le site est accessible normalement'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={isSaving}
            className={`relative w-14 h-8 rounded-full transition-colors ${settings.enabled ? 'bg-amber-500' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${settings.enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>
      
      {/* Settings */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Titre de la page</label>
          <Input
            value={settings.title}
            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            placeholder="Maintenance en cours"
            className="input-dark"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Message</label>
          <Textarea
            value={settings.message}
            onChange={(e) => setSettings({ ...settings, message: e.target.value })}
            placeholder="Le site est temporairement indisponible..."
            className="input-dark"
            rows={4}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Heure de fin estimée (optionnel)</label>
          <Input
            type="datetime-local"
            value={settings.eta ? settings.eta.slice(0, 16) : ''}
            onChange={(e) => setSettings({ ...settings, eta: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="input-dark"
          />
        </div>
        
        <Button onClick={handleSave} disabled={isSaving} className="btn-primary w-full sm:w-auto">
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
      
      {/* Preview */}
      {settings.enabled && (
        <div className="mt-6 p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <h4 className="text-sm font-medium text-amber-400 mb-2">Aperçu de la page maintenance</h4>
          <div className="bg-[#09090B] rounded-lg p-6 text-center">
            <Wrench className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold mb-2">{settings.title}</h3>
            <p className="text-muted-foreground text-sm">{settings.message}</p>
            {settings.eta && (
              <p className="text-sm text-amber-400 mt-4">
                Retour estimé : {new Date(settings.eta).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Announcements Management Component
const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, announcement: null });
  const [formData, setFormData] = useState({
    type: 'banner',
    title: '',
    message: '',
    link: '',
    link_text: '',
    style: 'info',
    is_dismissible: true,
    show_once: false,
    priority: 0,
    starts_at: '',
    ends_at: '',
    target_roles: []
  });
  
  const styleOptions = [
    { value: 'info', label: 'Information', icon: Info, color: 'text-blue-400' },
    { value: 'warning', label: 'Avertissement', icon: AlertTriangle, color: 'text-amber-400' },
    { value: 'success', label: 'Succès', icon: CheckCircle, color: 'text-green-400' },
    { value: 'error', label: 'Erreur', icon: XCircle, color: 'text-red-400' }
  ];
  
  const typeOptions = [
    { value: 'banner', label: 'Bannière' },
    { value: 'popup', label: 'Popup' },
    { value: 'toast', label: 'Toast' }
  ];
  
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/admin/announcements`, { withCredentials: true });
      setAnnouncements(res.data.announcements);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnnouncements();
  }, []);
  
  const openEditDialog = (ann = null) => {
    if (ann) {
      setFormData({
        type: ann.type || 'banner',
        title: ann.title || '',
        message: ann.message || '',
        link: ann.link || '',
        link_text: ann.link_text || '',
        style: ann.style || 'info',
        is_dismissible: ann.is_dismissible !== false,
        show_once: ann.show_once || false,
        priority: ann.priority || 0,
        starts_at: ann.starts_at ? ann.starts_at.slice(0, 16) : '',
        ends_at: ann.ends_at ? ann.ends_at.slice(0, 16) : '',
        target_roles: ann.target_roles || []
      });
    } else {
      setFormData({
        type: 'banner',
        title: '',
        message: '',
        link: '',
        link_text: '',
        style: 'info',
        is_dismissible: true,
        show_once: false,
        priority: 0,
        starts_at: '',
        ends_at: '',
        target_roles: []
      });
    }
    setEditDialog({ open: true, announcement: ann });
  };
  
  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null
      };
      
      if (editDialog.announcement) {
        await axios.put(`${API}/admin/announcements/${editDialog.announcement.announcement_id}`, payload, { withCredentials: true });
        toast.success('Annonce mise à jour');
      } else {
        await axios.post(`${API}/admin/announcements`, payload, { withCredentials: true });
        toast.success('Annonce créée');
      }
      fetchAnnouncements();
      setEditDialog({ open: false, announcement: null });
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleToggleActive = async (ann) => {
    try {
      await axios.put(`${API}/admin/announcements/${ann.announcement_id}`, { is_active: !ann.is_active }, { withCredentials: true });
      fetchAnnouncements();
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await axios.delete(`${API}/admin/announcements/${id}`, { withCredentials: true });
      toast.success('Annonce supprimée');
      fetchAnnouncements();
    } catch {
      toast.error('Erreur');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold">Annonces & Popups</h3>
        <Button onClick={() => openEditDialog()} size="sm" className="btn-primary">
          <Plus className="w-4 h-4 mr-1" />
          Nouvelle
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map(ann => {
            const styleConfig = styleOptions.find(s => s.value === ann.style) || styleOptions[0];
            const StyleIcon = styleConfig.icon;
            
            return (
              <div key={ann.announcement_id} className={`p-4 rounded-lg border transition-colors ${ann.is_active ? 'bg-white/5 border-white/10' : 'bg-white/2 border-white/5 opacity-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ann.is_active ? 'bg-white/10' : 'bg-white/5'}`}>
                    <StyleIcon className={`w-5 h-5 ${styleConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium truncate">{ann.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-white/10">
                        {typeOptions.find(t => t.value === ann.type)?.label || ann.type}
                      </span>
                      {!ann.is_active && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Inactif</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{ann.message}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(ann)}>
                      {ann.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(ann)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(ann.announcement_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune annonce</p>
        </div>
      )}
      
      {/* Edit/Create Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="glass-card border-white/10 mx-4 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.announcement ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="input-dark">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Style</label>
                <Select value={formData.style} onValueChange={(v) => setFormData({ ...formData, style: v })}>
                  <SelectTrigger className="input-dark">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className={`w-4 h-4 ${opt.color}`} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Titre</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de l'annonce"
                className="input-dark"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Contenu de l'annonce..."
                className="input-dark"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Lien (optionnel)</label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Texte du lien</label>
                <Input
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  placeholder="En savoir plus"
                  className="input-dark"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Début (optionnel)</label>
                <Input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fin (optionnel)</label>
                <Input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  className="input-dark"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Priorité</label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="input-dark"
              />
              <p className="text-xs text-muted-foreground mt-1">Plus la valeur est élevée, plus l'annonce sera affichée en premier</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_dismissible}
                  onChange={(e) => setFormData({ ...formData, is_dismissible: e.target.checked })}
                  className="rounded border-white/20 bg-white/10"
                />
                <span className="text-sm">Peut être fermée</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_once}
                  onChange={(e) => setFormData({ ...formData, show_once: e.target.checked })}
                  className="rounded border-white/20 bg-white/10"
                />
                <span className="text-sm">Afficher une seule fois</span>
              </label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditDialog({ open: false, announcement: null })}>Annuler</Button>
            <Button onClick={handleSave} className="btn-primary">Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main Admin Dashboard
export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground text-sm">Permissions insuffisantes</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-4 sm:py-8" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Admin</h1>
        </div>
        
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
              label="Signalements" 
              color="bg-amber-600"
            />
          </div>
        )}
        
        {/* Tab Navigation - Mobile optimized */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
          {[
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'categories', icon: MessageSquare, label: 'Catégories' },
            { id: 'reports', icon: AlertTriangle, label: 'Signalements' },
            { id: 'announcements', icon: Megaphone, label: 'Annonces' },
            { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
            { id: 'logs', icon: Clock, label: 'Logs' },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 gap-2 ${activeTab === tab.id ? 'bg-violet-600' : ''}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="glass-card p-4 sm:p-6">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'reports' && <ReportsManagement />}
          {activeTab === 'announcements' && <AnnouncementsManagement />}
          {activeTab === 'maintenance' && <MaintenanceManagement />}
          {activeTab === 'logs' && <AdminLogs />}
        </div>
      </div>
    </div>
  );
}
