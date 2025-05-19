'use client';

import { useEffect, useState } from "react";
import { ProfileHeader } from "@/components/ProfileHeader";
import { PostCard } from "@/components/PostCard";
import { CommunityCard } from "@/components/ExploreSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfile, UserProfile } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/utils/dateFormat";
import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const data = await getUserProfile(token);
        setProfileData(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile data. Please try again later.';
        setError(message);
        if (message.includes('Please login')) {
          router.push('/login');
        }
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, router]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profileData) {
    return <div className="container text-center py-12">{error || "Failed to load profile data."}</div>;
  }

  const formattedProfileData = {
    username: profileData.username,
    bio: profileData.bio || "No bio yet",
    avatar: profileData.avatar.startsWith("http") ? profileData.avatar : `/users/${profileData.avatar}`,
    userTrustedScore: profileData.karma.total,
    stats: {
      posts: profileData.posts.length,
      communities: profileData.joinedCommunities.length,
      joined: new Date(profileData.createdAt).toLocaleDateString("en-US", { 
        month: "long", 
        year: "numeric" 
      }),
      location: "Pakistan",
      karma: {
        total: profileData.karma.total,
        postKarma: profileData.karma.postKarma,
        commentKarma: profileData.karma.commentKarma,
        lastCalculated: new Date(profileData.karma.lastCalculated).toLocaleDateString()
      }
    }
  };

  // Transform the posts data to match PostCard component props
  const userPosts = profileData.posts.map(post => ({
    _id: post._id,
    title: post.title,
    content: post.content,
    author: {
      _id: profileData._id,
      username: profileData.username,
      avatar: profileData.avatar
    },
    community: {
      _id: post.community?._id || 'unknown',
      name: post.community?.name || 'Unknown Community'
    },
    media: post.media,
    voteCount: post.voteCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    timeAgo: formatTimeAgo(new Date(post.createdAt))
  }));

  const userCommunities = profileData.joinedCommunities.map(community => ({
    _id: community._id, // Add the ID to the community data
    name: community.name,
    members: community.memberCount,
    image: community.avatar,
    description: community.description
  }));

  return (
    <div className="space-y-8">
      <ProfileHeader {...formattedProfileData} />

      <div className="container max-w-5xl px-4">
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="posts">Posts ({userPosts.length})</TabsTrigger>
            <TabsTrigger value="communities">Communities ({userCommunities.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard key={post._id} {...post} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No posts yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="communities" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCommunities.length > 0 ? (
              userCommunities.map((community) => (
                <CommunityCard 
                  key={community.name}
                  community={community}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground col-span-2">
                No communities joined yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-muted/30 p-8">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-4 text-center md:text-left">
              <Skeleton className="h-8 w-40 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex flex-wrap gap-6 justify-center md:justify-start pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-24" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl px-4">
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
