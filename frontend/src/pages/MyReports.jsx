import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, ChevronLeft, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  in_review: { label: 'En cours d\'examen', color: 'bg-blue-500/20 text-blue-400', icon: Eye },
  resolved: { label: 'Résolu', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  dismissed: { label: 'Classé sans suite', color: 'bg-gray-500/20 text-gray-400', icon: XCircle }
};

export default function MyReports() {
  const { user, isAuthenticated, login } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`${API}/my-reports`, { withCredentials: true });
        setReports(res.data.reports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchReports();
    }
  }, [isAuthenticated]);
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Flag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Connexion requise</h1>
          <p className="text-muted-foreground mb-4">Connectez-vous pour voir vos signalements</p>
          <Button onClick={login} className="btn-primary">Se connecter</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8" data-testid="my-reports-page">
      <div className="max-w-3xl mx-auto px-4">
        <Link to="/notifications">
          <Button variant="ghost" className="mb-6 gap-2">
            <ChevronLeft className="w-4 h-4" />
            Retour aux notifications
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <Flag className="w-8 h-8 text-amber-500" />
          <h1 className="font-heading text-3xl font-bold">Mes signalements</h1>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report, index) => {
              const status = statusConfig[report.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={report.report_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {report.target_type === 'post' && 'Message'}
                        {report.target_type === 'topic' && 'Discussion'}
                        {report.target_type === 'user' && 'Utilisateur'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Raison du signalement</p>
                      <p className="font-medium">{report.reason}</p>
                    </div>
                    
                    {report.details && (
                      <div>
                        <p className="text-sm text-muted-foreground">Détails</p>
                        <p className="text-sm">{report.details}</p>
                      </div>
                    )}
                    
                    {report.resolution_note && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-muted-foreground mb-1">Réponse de la modération</p>
                        <p className="text-sm">{report.resolution_note}</p>
                        {report.action_taken && report.action_taken !== 'none' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Action: {report.action_taken === 'warning' && 'Avertissement envoyé'}
                            {report.action_taken === 'delete' && 'Contenu supprimé'}
                            {report.action_taken === 'ban' && 'Utilisateur banni'}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {report.status === 'pending' && (
                      <p className="text-sm text-muted-foreground italic">
                        Votre signalement sera examiné par notre équipe de modération dans les plus brefs délais.
                      </p>
                    )}
                    
                    {report.status === 'in_review' && (
                      <p className="text-sm text-blue-400">
                        Un modérateur examine actuellement votre signalement.
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Flag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">Aucun signalement</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas encore effectué de signalement
            </p>
          </div>
        )}
        
        {/* Info box */}
        <div className="mt-8 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-violet-400 mb-1">Comment fonctionne le système de signalement ?</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• <strong>En attente</strong> : Votre signalement a été reçu</li>
                <li>• <strong>En cours d'examen</strong> : Un modérateur examine le contenu</li>
                <li>• <strong>Résolu</strong> : Une action a été prise suite à votre signalement</li>
                <li>• <strong>Classé sans suite</strong> : Le contenu ne viole pas nos règles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
