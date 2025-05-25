'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Users, ScrollText, PlusCircle } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useAuth } from '@/store/AuthContext';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Interface definitions
interface Author {
  _id: string;
  username: string;
  avatar: string;
}

interface CommunityPreview {
  _id: string;
  name: string;
  description: string;
  avatar: string;
}

interface CommunityInPost {
  _id: string;
  name: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  author: Author;
  community: CommunityInPost;
  media: string | null;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SearchResponse {
  query: string;
  type: string;
  results: {
    posts: Post[];
    communities: CommunityPreview[];
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const { token } = useAuth();

  const fetchSearchResults = useCallback(async () => {
    if (!query) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/search?query=${encodeURIComponent(query)}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Search failed. Please try again.');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, token]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Count results for each category
  const postsCount = searchResults?.results.posts.length || 0;
  const communitiesCount = searchResults?.results.communities.length || 0;
  const totalCount = postsCount + communitiesCount;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-secondary">
            Search Results
          </h1>
        </div>
        {loading && (
          <p className="text-muted-foreground">Searching...</p>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Searching for results...</p>
        </div>
      ) : error ? (
        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
          <CardContent className="px-6 py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchSearchResults}>Try Again</Button>
          </CardContent>
        </Card>
      ) : searchResults && totalCount > 0 ? (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 mb-8 w-full">
            <TabsTrigger value="all" className="relative">
              All
              <Badge className="ml-1.5 bg-primary/10 text-xs">{totalCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="communities">
              Communities
              <Badge className="ml-1.5 bg-primary/10 text-xs">{communitiesCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="posts">
              Posts
              <Badge className="ml-1.5 bg-primary/10 text-xs">{postsCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {communitiesCount > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Communities</span>
                  </h2>
                  {communitiesCount > 4 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab('communities')}
                      className="text-primary hover:text-primary/80"
                    >
                      View all ({communitiesCount})
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.results.communities.slice(0, 4).map((community) => (
                    <CommunityGridCard key={community._id} community={community} />
                  ))}
                </div>
              </div>
            )}

            {postsCount > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-primary" />
                    <span>Posts</span>
                  </h2>
                  {postsCount > 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab('posts')}
                      className="text-primary hover:text-primary/80"
                    >
                      View all ({postsCount})
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {searchResults.results.posts.slice(0, 3).map((post) => (
                    <PostCard 
                      key={post._id} 
                      {...post}
                      community={{
                        _id: post.community?._id || '',
                        name: post.community?.name || 'Unknown Community',
                        creator: post.community?.creator || { _id: '' }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="communities">
            {communitiesCount > 0 ? (
              <div className="space-y-3">
                {searchResults.results.communities.map((community) => (
                  <CommunityCard key={community._id} community={community} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="h-12 w-12 text-muted-foreground/30" />}
                title="No Communities Found"
                description={`No communities matching &quot;${query}&quot; were found.`}
              />
            )}
          </TabsContent>

          <TabsContent value="posts">
            {postsCount > 0 ? (
              <div className="space-y-6">
                {searchResults.results.posts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    {...post}
                    community={{
                      _id: post.community?._id || '',
                      name: post.community?.name || 'Unknown Community',
                      creator: post.community?.creator || { _id: '' }
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ScrollText className="h-12 w-12 text-muted-foreground/30" />}
                title="No Posts Found"
                description={`No posts matching &quot;${query}&quot; were found.`}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : query ? (
        <EmptyState
          icon={<Search className="h-16 w-16 text-muted-foreground/20" />}
          title="No Results Found"
          description="No matching results were found. Try different search terms."
        />
      ) : (
        <Card className="border-muted shadow-sm">
          <CardContent className="px-6 py-10 text-center">
            <div className="inline-flex items-center justify-center p-6 bg-primary/5 rounded-full mb-6">
              <Search className="h-10 w-10 text-primary/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-secondary">Search for Something</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Enter a search term in the search bar at the top to find communities, posts, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <SuggestionButton query="Travel" />
              <SuggestionButton query="Adventure" />
              <SuggestionButton query="Europe" />
              <SuggestionButton query="Budget" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SuggestionButton({ query }: { query: string }) {
  const router = useRouter();
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => router.push(`/search?query=${encodeURIComponent(query)}`)}
      className="hover:bg-primary/5"
    >
      {query}
    </Button>
  );
}

function CommunityCard({ community }: { community: CommunityPreview }) {
  return (
    <Link href={`/communities/${community._id}`} className="block">
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:border-primary/20 group">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-lg ring-1 ring-border/50">
              <AvatarImage src={community.avatar} alt={community.name} className="object-cover" />
              <AvatarFallback className="rounded-lg text-xs font-medium bg-primary/10 text-primary">
                {community.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-secondary group-hover:text-primary transition-colors duration-200 line-clamp-1">
                {community.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 line-clamp-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30 flex-shrink-0"></span>
                <span className="truncate">{community.description}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs font-medium text-primary",
                "opacity-0 group-hover:opacity-100 transition-all duration-200",
                "absolute right-3 hover:bg-primary/5"
              )}
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// When displaying communities in the grid (for the All tab)
function CommunityGridCard({ community }: { community: CommunityPreview }) {
  return (
    <Link href={`/communities/${community._id}`} className="block h-full">
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:border-primary/20 group h-full">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-lg ring-1 ring-border/50">
                <AvatarImage src={community.avatar} alt={community.name} className="object-cover" />
                <AvatarFallback className="rounded-lg text-xs font-medium bg-primary/10 text-primary">
                  {community.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-secondary group-hover:text-primary transition-colors duration-200 line-clamp-1">
                  {community.name}
                </h3>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30"></span>
                  <span>Community</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {community.description}
            </p>
            <div className="mt-auto pt-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full text-xs justify-center hover:bg-primary/5 hover:text-primary mt-2 group-hover:bg-primary/5 group-hover:text-primary transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                View Community
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-16 bg-muted/10 rounded-lg border border-muted">
      <div className="mx-auto mb-4">{icon}</div>
      <h2 className="text-xl font-semibold mb-2 text-secondary">{title}</h2>
      <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
    </div>
  );
}
