import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function CGU() {
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
            <FileText className="w-8 h-8 text-violet-500" />
            <h1 className="font-heading text-3xl font-bold">Conditions Générales d'Utilisation</h1>
          </div>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">Dernière mise à jour : Janvier 2026</p>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">1. Objet</h2>
              <p>Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation du forum Astuceson, ainsi que les droits et obligations des utilisateurs.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">2. Acceptation des CGU</h2>
              <p>L'accès et l'utilisation du forum impliquent l'acceptation sans réserve des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le forum.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">3. Inscription et Compte</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>L'inscription est gratuite et ouverte à toute personne physique majeure.</li>
                <li>Vous devez fournir des informations exactes et les maintenir à jour.</li>
                <li>Vous êtes responsable de la confidentialité de vos identifiants.</li>
                <li>Un seul compte par personne est autorisé.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">4. Règles de Conduite</h2>
              <p>Les utilisateurs s'engagent à :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Respecter les autres membres de la communauté</li>
                <li>Ne pas publier de contenu illégal, diffamatoire, haineux ou discriminatoire</li>
                <li>Ne pas harceler, menacer ou intimider d'autres utilisateurs</li>
                <li>Ne pas publier de spam ou de contenu publicitaire non autorisé</li>
                <li>Ne pas usurper l'identité d'une autre personne</li>
                <li>Ne pas tenter de pirater ou d'altérer le fonctionnement du forum</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">5. Modération et Sanctions</h2>
              <p>L'équipe de modération se réserve le droit de :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Supprimer tout contenu contraire aux présentes CGU</li>
                <li>Émettre des avertissements aux utilisateurs</li>
                <li>Suspendre temporairement ou définitivement un compte</li>
                <li>Bannir un utilisateur en cas de violations répétées ou graves</li>
              </ul>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">6. Propriété Intellectuelle</h2>
              <p>Le contenu publié par les utilisateurs reste leur propriété. Toutefois, en publiant sur Astuceson, vous accordez une licence non exclusive d'utilisation de ce contenu sur la plateforme.</p>
              <p>Les éléments graphiques, logos et textes du forum sont protégés par le droit d'auteur.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">7. Responsabilité</h2>
              <p>Astuceson ne peut être tenu responsable des contenus publiés par les utilisateurs. Nous agissons en tant qu'hébergeur et retirons tout contenu signalé comme illicite dans les plus brefs délais.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">8. Droit Applicable</h2>
              <p>Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">9. Modification des CGU</h2>
              <p>Astuceson se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par notification sur le forum.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-xl font-semibold">10. Contact</h2>
              <p>Pour toute question concernant ces CGU, vous pouvez nous contacter via notre Discord : <a href="https://discord.gg/5VFqZzWDTT" className="text-violet-400 hover:underline">discord.gg/5VFqZzWDTT</a></p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
