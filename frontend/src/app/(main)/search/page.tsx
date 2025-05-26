'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Users, ScrollText } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { useAuth } from '@/store/AuthContext';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { MiniCommunityCard } from "@/components/MiniCommunityCard";
import { Skeleton } from "@/components/ui/skeleton";

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
  memberCount: number;
  postCount: number;
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

function SearchSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
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
    <div className="container max-w-4xl mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-secondary">
            Search Results
          </h1>
        </div>
        {query && (
          <p className="text-muted-foreground">
            Showing results for <span className="font-medium text-secondary">&quot;{query}&quot;</span>
          </p>
        )}
      </div>

      {loading ? (
        <SearchSkeleton />
      ) : error ? (
        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
          <CardContent className="px-6 py-8 text-center">
            <div className="mb-4 p-3 bg-destructive/10 rounded-full inline-flex">
              <Search className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchSearchResults}>Try Again</Button>
          </CardContent>
        </Card>
      ) : searchResults && totalCount > 0 ? (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 mb-8 w-full bg-muted/50 p-1">
            <TabsTrigger value="all" className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm">
              All
              <Badge className="ml-1.5 bg-primary/10 text-xs">{totalCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="communities" className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Communities
              <Badge className="ml-1.5 bg-primary/10 text-xs">{communitiesCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="posts" className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm">
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
                    <MiniCommunityCard 
                      key={community._id} 
                      community={community}
                      variant="list"
                    />
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
                        name: post.community?.name || 'Unknown Community'
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
                  <MiniCommunityCard 
                    key={community._id} 
                    community={community}
                    variant="list"
                  />
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
                      name: post.community?.name || 'Unknown Community'
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
          <CardContent className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center p-6 bg-primary/5 rounded-full mb-6">
              <Search className="h-10 w-10 text-primary/50" />
            </div>
            <h2 className="text-xl font-semibold mb-3 text-secondary">Search for Something</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Enter a search term in the search bar at the top to find communities, posts, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
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

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-muted shadow-md mx-auto max-w-lg">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2 text-primary text-center">{title}</h2>
      <p className="text-muted-foreground max-w-md mx-auto text-center mb-6">{description}</p>
      <Button variant="default" onClick={() => router.push('/search')} className="mt-2">Try a New Search</Button>
    </div>
  );
}
