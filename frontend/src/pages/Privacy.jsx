import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Privacy() {
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
            <Shield className="w-8 h-8 text-violet-500" />
            <h1 className="font-heading text-3xl font-bold">Politique de Confidentialité</h1>
          </div>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">Dernière mise à jour : Janvier 2026</p>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">1. Introduction</h2>
              <p>La présente politique de confidentialité décrit comment Astuceson collecte, utilise et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">2. Données Collectées</h2>
              <p>Nous collectons les données suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Données d'identification :</strong> nom, adresse email, photo de profil (via Google OAuth)</li>
                <li><strong>Données de connexion :</strong> adresse IP, horodatage des connexions</li>
                <li><strong>Données d'activité :</strong> messages postés, discussions créées, interactions</li>
                <li><strong>Données techniques :</strong> type de navigateur, système d'exploitation</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">3. Finalités du Traitement</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gérer votre compte et vous authentifier</li>
                <li>Permettre le fonctionnement du forum</li>
                <li>Assurer la modération et la sécurité</li>
                <li>Améliorer nos services</li>
                <li>Vous envoyer des notifications relatives à votre activité</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">4. Base Légale</h2>
              <p>Le traitement de vos données repose sur :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>L'exécution du contrat (CGU) pour le fonctionnement du service</li>
                <li>Votre consentement pour les cookies non essentiels</li>
                <li>Notre intérêt légitime pour la sécurité et l'amélioration du service</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">5. Durée de Conservation</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Données de compte :</strong> conservées tant que le compte est actif, puis 3 ans après suppression</li>
                <li><strong>Données de connexion :</strong> 1 an</li>
                <li><strong>Messages et contenus :</strong> conservés tant que le compte existe</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">6. Partage des Données</h2>
              <p>Vos données ne sont pas vendues à des tiers. Elles peuvent être partagées avec :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nos hébergeurs et prestataires techniques</li>
                <li>Les autorités compétentes en cas de réquisition légale</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">7. Vos Droits RGPD</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
              </ul>
              <p>Pour exercer ces droits, contactez-nous via Discord ou par email.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">8. Sécurité</h2>
              <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chiffrement des communications (HTTPS)</li>
                <li>Stockage sécurisé des données</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Authentification sécurisée via OAuth</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">9. Contact DPO</h2>
              <p>Pour toute question relative à la protection de vos données, vous pouvez nous contacter :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Discord : <a href="https://discord.gg/5VFqZzWDTT" className="text-violet-400 hover:underline">discord.gg/5VFqZzWDTT</a></li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">10. Modifications</h2>
              <p>Cette politique peut être mise à jour. Les modifications seront notifiées sur le forum.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
