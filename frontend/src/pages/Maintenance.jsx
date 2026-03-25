import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, ExternalLink } from 'lucide-react';

export default function Maintenance({ title, message, eta }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090B]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 15, -15, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center"
        >
          <Wrench className="w-12 h-12 text-amber-500" />
        </motion.div>
        
        {/* Title */}
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 gradient-text">
          {title || 'Maintenance en cours'}
        </h1>
        
        {/* Message */}
        <p className="text-muted-foreground mb-6 text-lg">
          {message || 'Le site est temporairement indisponible pour maintenance. Nous serons bientôt de retour !'}
        </p>
        
        {/* ETA */}
        {eta && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-8">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Retour estimé : {new Date(eta).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
        
        {/* Social Links */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-muted-foreground mb-4">Suivez-nous pour les mises à jour</p>
          <div className="flex justify-center gap-4">
            <a
              href="https://discord.gg/5VFqZzWDTT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
              <ExternalLink className="w-4 h-4 opacity-50" />
            </a>
            <a
              href="https://tiktok.com/@astuceson_off"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              TikTok
              <ExternalLink className="w-4 h-4 opacity-50" />
            </a>
          </div>
        </div>
        
        {/* Logo */}
        <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">A</span>
          </div>
          <span className="font-heading font-bold">Astuceson</span>
        </div>
      </motion.div>
    </div>
  );
}
