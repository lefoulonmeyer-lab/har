import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, Flag, MessageSquare, User, 
  Check, X, ExternalLink, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ModerationPanel() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warnDialog, setWarnDialog] = useState({ open: false, userId: null, userName: '' });
  const [warnReason, setWarnReason] = useState('');
  
  const canAccess = user?.role === 'admin' || user?.role === 'modo';
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, alertsRes] = await Promise.all([
          axios.get(`${API}/reports?status=pending`, { withCredentials: true }),
          axios.get(`${API}/alerts?status=pending`, { withCredentials: true })
        ]);
        setReports(reportsRes.data);
        setAlerts(alertsRes.data);
      } catch (error) {
        console.error('Error fetching moderation data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (canAccess) {
      fetchData();
    }
  }, [canAccess]);
  
  const handleReportAction = async (reportId, status) => {
    try {
      await axios.put(`${API}/reports/${reportId}`, { status }, { withCredentials: true });
      setReports(reports.filter(r => r.report_id !== reportId));
      toast.success(status === 'reviewed' ? 'Signalement traité' : 'Signalement rejeté');
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleAlertAction = async (alertId, status) => {
    try {
      await axios.put(`${API}/alerts/${alertId}`, { status }, { withCredentials: true });
      setAlerts(alerts.filter(a => a.alert_id !== alertId));
      toast.success('Alerte traitée');
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleWarnUser = async () => {
    if (!warnDialog.userId || !warnReason.trim()) return;
    
    try {
      await axios.post(`${API}/modo/warn/${warnDialog.userId}`, 
        { reason: warnReason },
        { withCredentials: true }
      );
      toast.success('Avertissement envoyé');
      setWarnDialog({ open: false, userId: null, userName: '' });
      setWarnReason('');
    } catch {
      toast.error('Erreur');
    }
  };
  
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Réservé aux modérateurs</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8" data-testid="moderation-panel">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-emerald-500" />
          <h1 className="font-heading text-3xl font-bold">Modération</h1>
        </div>
        
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="reports" className="data-[state=active]:bg-emerald-500/20">
              <Flag className="w-4 h-4 mr-2" />
              Signalements ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-emerald-500/20">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mentions @modo ({alerts.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="space-y-4">
            {reports.length > 0 ? (
              reports.map(report => (
                <motion.div
                  key={report.report_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
                          {report.target_type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          signalé par {report.reporter_name}
                        </span>
                      </div>
                      <p className="text-sm mb-3">{report.reason}</p>
                      <Link 
                        to={report.target_type === 'topic' ? `/topic/${report.target_id}` : '#'}
                        className="text-sm text-violet-400 hover:underline flex items-center gap-1"
                      >
                        Voir le contenu
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReportAction(report.report_id, 'dismissed')}
                        className="text-muted-foreground"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReportAction(report.report_id, 'reviewed')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Traiter
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-12 text-center">
                <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun signalement en attente</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <motion.div
                  key={alert.alert_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 border-l-4 border-emerald-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-emerald-400" />
                        <span className="font-medium">{alert.from_user_name}</span>
                        <span className="text-sm text-muted-foreground">
                          a mentionné @{alert.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                      <div className="flex items-center gap-4">
                        <Link 
                          to={`/topic/${alert.topic_id}`}
                          className="text-sm text-violet-400 hover:underline flex items-center gap-1"
                        >
                          Voir la discussion
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => setWarnDialog({ 
                            open: true, 
                            userId: alert.from_user_id, 
                            userName: alert.from_user_name 
                          })}
                          className="text-sm text-amber-400 hover:underline"
                        >
                          Avertir l'utilisateur
                        </button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAlertAction(alert.alert_id, 'handled')}
                      className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Traité
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune mention en attente</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Warn Dialog */}
        <Dialog open={warnDialog.open} onOpenChange={(open) => setWarnDialog({ ...warnDialog, open })}>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Avertir {warnDialog.userName}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="Raison de l'avertissement..."
                className="input-dark"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setWarnDialog({ open: false, userId: null, userName: '' })}>
                Annuler
              </Button>
              <Button 
                onClick={handleWarnUser}
                disabled={!warnReason.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Envoyer l'avertissement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
