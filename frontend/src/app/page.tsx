'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { PostCard } from "@/components/PostCard";
import { useAuth } from '@/store/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Author {
  _id: string;
  username: string;
  avatar: string;
}

interface Community {
  _id: string;
  name: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  author: Author;
  community: Community;
  media: string | null;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FeedResponse {
  posts: Post[];
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { token, user } = useAuth();
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pageNumber: number, append: boolean = false) => {
    try {
      if (pageNumber > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const url = token && user
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/feed/home?page=${pageNumber}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/feed/public?page=${pageNumber}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data: FeedResponse = await response.json();
      
      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
      toast.error('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token, user]);

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchPosts]);

  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.5 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMorePosts]);

  if (loading) {
    return (
      <div className="flex justify-center min-h-screen bg-background">
        <div className="w-full max-w-3xl px-4 py-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center min-h-screen bg-background">
        <div className="w-full max-w-3xl px-4 py-8 text-center">
          <div className="rounded-lg border border-destructive/50 p-8 mb-4">
            <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex justify-center min-h-screen bg-background">
        <div className="w-full max-w-3xl px-4 py-8 text-center">
          <div className="rounded-lg border p-8 mb-4">
            <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
            <p className="text-muted-foreground">
              {user 
                ? 'No posts available. Join communities or follow users to see more content.'
                : 'No public posts available at the moment. Sign in to see personalized content.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-3xl px-4 py-8 space-y-6">
        {posts.filter(post => post && post._id).map((post) => (
          <PostCard
            key={post._id}
            _id={post._id}
            title={post.title}
            content={post.content}
            author={post.author}
            community={{
              _id: post.community?._id || 'unknown',
              name: post.community?.name || 'Unknown Community',
            }}
            media={post.media}
            voteCount={post.voteCount}
            commentCount={post.commentCount}
            createdAt={post.createdAt}
            updatedAt={post.updatedAt}
          />
        ))}
        
        <div ref={loaderRef} className="py-4 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading more posts...</span>
            </div>
          )}
        </div>
        
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>You&apos;ve reached the end. No more posts to load.</p>
          </div>
        )}
        
        {!loadingMore && hasMore && posts.length > 0 && (
          <div className="flex justify-center pt-2 pb-8">
            <Button 
              onClick={loadMorePosts}
              variant="outline"
              className="px-8"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
