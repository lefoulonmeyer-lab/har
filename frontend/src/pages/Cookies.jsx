import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cookie, ChevronLeft, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';

export default function Cookies() {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  });
  
  useEffect(() => {
    const saved = localStorage.getItem('cookie_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);
  
  const savePreferences = () => {
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    localStorage.setItem('cookie_consent', 'true');
  };
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ChevronLeft className="w-4 h-4" />
            Retour
          </Button>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <Cookie className="w-8 h-8 text-violet-500" />
            <h1 className="font-heading text-3xl font-bold">Politique des Cookies</h1>
          </div>
          
          <div className="prose prose-invert max-w-none space-y-6 mb-8">
            <p className="text-muted-foreground">Dernière mise à jour : Janvier 2026</p>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">Qu'est-ce qu'un cookie ?</h2>
              <p>Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos préférences et d'améliorer votre expérience.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">Cookies utilisés par Astuceson</h2>
              
              <h3 className="font-heading text-lg font-medium mt-4">Cookies essentiels</h3>
              <p>Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>session_token :</strong> Maintient votre session de connexion</li>
                <li><strong>cookie_consent :</strong> Enregistre vos préférences de cookies</li>
              </ul>
              
              <h3 className="font-heading text-lg font-medium mt-4">Cookies analytiques</h3>
              <p>Ces cookies nous aident à comprendre comment les visiteurs utilisent le site.</p>
              
              <h3 className="font-heading text-lg font-medium mt-4">Cookies marketing</h3>
              <p>Ces cookies sont utilisés pour personnaliser les publicités. Astuceson n'utilise actuellement pas de cookies marketing.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">Gestion des cookies</h2>
              <p>Vous pouvez gérer vos préférences de cookies à tout moment. Notez que la désactivation de certains cookies peut affecter votre expérience sur le site.</p>
            </section>
          </div>
          
          {/* Cookie Preferences */}
          <div className="glass-card p-6 border-violet-500/30">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-violet-400" />
              <h2 className="font-heading text-xl font-semibold">Gérer vos préférences</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium">Cookies essentiels</p>
                  <p className="text-sm text-muted-foreground">Nécessaires au fonctionnement du site</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium">Cookies analytiques</p>
                  <p className="text-sm text-muted-foreground">Nous aident à améliorer le site</p>
                </div>
                <Switch 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <p className="font-medium">Cookies marketing</p>
                  <p className="text-sm text-muted-foreground">Personnalisation des publicités</p>
                </div>
                <Switch 
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setPreferences({ essential: true, analytics: false, marketing: false });
                }}
              >
                Refuser tout
              </Button>
              <Button 
                className="btn-primary"
                onClick={savePreferences}
              >
                Sauvegarder mes préférences
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
