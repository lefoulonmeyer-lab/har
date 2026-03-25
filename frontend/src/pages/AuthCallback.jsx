import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exchangeSession } = useAuthStore();
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');
        
        if (!sessionId) {
          console.error('No session_id found');
          navigate('/');
          return;
        }
        
        // Exchange session_id for session_token
        const user = await exchangeSession(sessionId);
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Navigate to forum with user data
        navigate('/forum', { state: { user }, replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };
    
    processAuth();
  }, [exchangeSession, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}
