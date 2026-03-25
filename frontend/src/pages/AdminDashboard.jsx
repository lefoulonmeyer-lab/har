import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MessageSquare, FileText, AlertTriangle, Shield, 
  TrendingUp, Clock, Ban, Trash2, Edit, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { useAuthStore } from '../store/authStore';
import { RoleBadge } from '../components/Layout';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, value, label, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-sm mb-1">{label}</p>
        <p className="text-3xl font-heading font-bold">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const UserRow = ({ user, onUpdate, onDelete }) => {
  const [role, setRole] = useState(user.role);
  const [isBanned, setIsBanned] = useState(user.is_banned);
  
  const handleRoleChange = async (newRole) => {
    try {
      await axios.put(`${API}/admin/users/${user.user_id}`, { role: newRole }, {
        withCredentials: true
      });
      setRole(newRole);
      toast.success('Rôle mis à jour');
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleBanToggle = async () => {
    try {
      await axios.put(`${API}/admin/users/${user.user_id}`, { is_banned: !isBanned }, {
        withCredentials: true
      });
      setIsBanned(!isBanned);
      toast.success(isBanned ? 'Utilisateur débanni' : 'Utilisateur banni');
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`${API}/admin/users/${user.user_id}`, {
        withCredentials: true
      });
      onDelete(user.user_id);
      toast.success('Utilisateur supprimé');
    } catch {
      toast.error('Erreur');
    }
  };
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.picture} />
        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
      <Select value={role} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-32 input-dark">
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
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBanToggle}
        className={isBanned ? 'text-green-500' : 'text-red-500'}
      >
        <Ban className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="text-red-500"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, alertsRes, logsRes] = await Promise.all([
          axios.get(`${API}/admin/stats`, { withCredentials: true }),
          axios.get(`${API}/admin/users`, { withCredentials: true }),
          axios.get(`${API}/alerts`, { withCredentials: true }),
          axios.get(`${API}/admin/logs`, { withCredentials: true })
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data.users);
        setAlerts(alertsRes.data);
        setLogs(logsRes.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);
  
  const handleAlertStatus = async (alertId, status) => {
    try {
      await axios.put(`${API}/alerts/${alertId}`, { status }, { withCredentials: true });
      setAlerts(alerts.map(a => a.alert_id === alertId ? { ...a, status } : a));
      toast.success('Alerte mise à jour');
    } catch {
      toast.error('Erreur');
    }
  };
  
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} value={stats?.users_count || 0} label="Utilisateurs" color="bg-violet-600" />
          <StatCard icon={MessageSquare} value={stats?.topics_count || 0} label="Discussions" color="bg-cyan-600" />
          <StatCard icon={FileText} value={stats?.posts_count || 0} label="Messages" color="bg-emerald-600" />
          <StatCard icon={AlertTriangle} value={stats?.alerts_pending || 0} label="Alertes" color="bg-amber-600" />
        </div>
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-violet-500/20">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-violet-500/20">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alertes ({alerts.filter(a => a.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-violet-500/20">
              <Clock className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="glass-card p-6">
            <h2 className="font-heading font-semibold text-xl mb-4">Gestion des utilisateurs</h2>
            <div className="space-y-2">
              {users.map(u => (
                <UserRow 
                  key={u.user_id} 
                  user={u} 
                  onDelete={(id) => setUsers(users.filter(x => x.user_id !== id))}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="alerts" className="glass-card p-6">
            <h2 className="font-heading font-semibold text-xl mb-4">Alertes @admin / @modo</h2>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div 
                    key={alert.alert_id}
                    className={`p-4 rounded-lg border ${
                      alert.status === 'pending' 
                        ? 'border-amber-500/30 bg-amber-500/10' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            alert.type === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            @{alert.type}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            de {alert.from_user_name}
                          </span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      {alert.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleAlertStatus(alert.alert_id, 'handled')}
                          className="shrink-0"
                        >
                          Traiter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Aucune alerte</p>
            )}
          </TabsContent>
          
          <TabsContent value="logs" className="glass-card p-6">
            <h2 className="font-heading font-semibold text-xl mb-4">Historique des actions</h2>
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.log_id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </span>
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground">sur {log.target_id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Aucun log</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
