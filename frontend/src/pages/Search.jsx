import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, MessageSquare, User, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useForumStore } from '../store/forumStore';
import { RoleBadge } from '../components/Layout';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ topics: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { search } = useForumStore();
  
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchParams({ q: query });
    
    try {
      const data = await search(query);
      setResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  React.useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, []);
  
  return (
    <div className="min-h-screen py-8" data-testid="search-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-6">Recherche</h1>
          
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher des discussions, utilisateurs..."
                className="input-dark pl-12 py-6 text-lg"
                data-testid="search-input-main"
              />
            </div>
            <Button type="submit" className="btn-primary px-8" disabled={isSearching}>
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </Button>
          </form>
        </div>
        
        {hasSearched && (
          <Tabs defaultValue="topics" className="space-y-6">
            <TabsList className="glass-card p-1">
              <TabsTrigger value="topics" className="data-[state=active]:bg-violet-500/20">
                <MessageSquare className="w-4 h-4 mr-2" />
                Discussions ({results.topics.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-violet-500/20">
                <User className="w-4 h-4 mr-2" />
                Utilisateurs ({results.users.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="topics" className="space-y-3">
              {results.topics.length > 0 ? (
                results.topics.map((topic, index) => (
                  <motion.div
                    key={topic.topic_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/topic/${topic.topic_id}`}
                      className="glass-card p-4 flex items-center gap-4 card-hover block group"
                    >
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate group-hover:text-violet-400 transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          par {topic.author_name} • {topic.reply_count} réponses
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="glass-card p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune discussion trouvée</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="space-y-3">
              {results.users.length > 0 ? (
                results.users.map((user, index) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/profile/${user.user_id}`}
                      className="glass-card p-4 flex items-center gap-4 card-hover block group"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.picture} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium group-hover:text-violet-400 transition-colors">
                            {user.name}
                          </h3>
                          <RoleBadge role={user.role} />
                        </div>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="glass-card p-12 text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {!hasSearched && (
          <div className="glass-card p-12 text-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">Trouvez ce que vous cherchez</h2>
            <p className="text-muted-foreground">
              Recherchez des discussions ou des membres de la communauté
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
