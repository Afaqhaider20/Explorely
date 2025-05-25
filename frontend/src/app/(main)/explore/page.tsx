'use client';

import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { ExploreSection, CommunityCard } from "@/components/ExploreSection";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { SignInDialog } from "@/components/SignInDialog";
import { Button } from "@/components/ui/button";

interface TrendingCommunity {
  _id: string;
  name: string;
  memberCount: number;
  image: string;
  description: string;
  tags: string[];
}

interface TrendingPost {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  community: {
    _id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  media: string | null;
  voteCount: number;
  commentCount: number;
  upvotes: number;
  downvotes: number;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-semibold text-secondary">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const { token, isAuthenticated } = useAuth();
  const [trendingCommunities, setTrendingCommunities] = useState<TrendingCommunity[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/explore`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );

        if (response.data.status === 'success') {
          setTrendingCommunities(response.data.data.trendingCommunities);
          setTrendingPosts(response.data.data.trendingPosts);
        }
      } catch (error) {
        console.error('Error fetching explore data:', error);
        toast.error('Failed to load explore data', {
          description: 'Please try again later'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8 mx-auto max-w-5xl px-4">
        <div className="mb-6 sm:mb-8">
          <div className="h-7 sm:h-8 w-40 sm:w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-60 sm:w-72 bg-muted rounded animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="h-6 w-32 sm:w-36 bg-muted rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 sm:h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-6 w-32 sm:w-36 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 sm:h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8 mx-auto max-w-5xl px-4">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-secondary mb-2">Explore</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover new communities and trending posts from across Explorely
        </p>
        {!isAuthenticated && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-sm text-muted-foreground">
              Sign in to join communities, create posts, and interact with other travelers.
            </p>
            <div className="mt-3">
              <SignInDialog
                open={isSignInOpen}
                onOpenChange={setIsSignInOpen}
                trigger={
                  <Button 
                    variant="link" 
                    className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 p-0"
                  >
                    Sign in to get started
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Trending Communities Section */}
      <ExploreSection
        title="Trending Communities"
        subtitle="Fast-growing communities to check out"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {trendingCommunities.map((community) => (
            <CommunityCard 
              key={community._id}
              community={{
                _id: community._id,
                name: community.name,
                members: community.memberCount,
                image: community.image,
                description: community.description,
                tags: community.tags
              }}
            />
          ))}
        </div>
      </ExploreSection>

      {/* Trending Posts Section */}
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <SectionHeader
          title="Trending Posts"
          subtitle="Popular posts from the last 24 hours"
        />
        <div className="space-y-4 sm:space-y-6">
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post) => (
              <PostCard 
                key={post._id} 
                {...post}
                community={{
                  _id: post.community._id,
                  name: post.community.name
                }}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trending posts at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
