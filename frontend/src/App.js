import React, { useEffect, useState } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from './store/authStore';
import { useForumStore } from './store/forumStore';
import { Layout } from './components/Layout';

// Pages
import Home from './pages/Home';
import Forum from './pages/Forum';
import TopicDetail from './pages/TopicDetail';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import MyReports from './pages/MyReports';
import Search from './pages/Search';
import AdminDashboard from './pages/AdminDashboard';
import ModerationPanel from './pages/ModerationPanel';
import CGU from './pages/CGU';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';

// Cookie Banner Component
const CookieBanner = () => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);
  
  const accept = () => {
    localStorage.setItem('cookie_consent', 'true');
    localStorage.setItem('cookie_preferences', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: false
    }));
    setShow(false);
  };
  
  const decline = () => {
    localStorage.setItem('cookie_consent', 'true');
    localStorage.setItem('cookie_preferences', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false
    }));
    setShow(false);
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#121214]/95 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre{' '}
          <a href="/cookies" className="text-violet-400 hover:underline">politique des cookies</a>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
};

// Auth Provider wrapper
const AuthProvider = ({ children }) => {
  const { checkAuth, isLoading } = useAuthStore();
  const { fetchNotifications } = useForumStore();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setInitialized(true);
    };
    init();
  }, [checkAuth]);
  
  useEffect(() => {
    if (initialized && useAuthStore.getState().isAuthenticated) {
      fetchNotifications();
    }
  }, [initialized, fetchNotifications]);
  
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return children;
};

// App Router with session_id detection
const AppRouter = () => {
  const location = useLocation();
  
  // CRITICAL: Check URL fragment for session_id synchronously during render
  // This prevents race conditions by processing OAuth callback FIRST
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/topic/:topicId" element={<TopicDetail />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/search" element={<Search />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/moderation" element={<ModerationPanel />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/settings" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <CookieBanner />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
