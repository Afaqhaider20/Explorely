'use client';

import { useEffect, useState } from "react";
import { use } from "react";
import { ProfileHeader } from "@/components/ProfileHeader";
import { PostCard } from "@/components/PostCard";
import { CommunityCard } from "@/components/ExploreSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfileById, UserProfile } from "@/lib/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/utils/dateFormat";
import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Flag, Share2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from '@/components/ReportDialog';
import { toast } from "sonner";
import { ErrorState } from "@/components/ErrorState";

export default function ProfileIdPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'not-found' | 'unauthorized' | 'server-error'>('server-error');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { token, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setErrorType('unauthorized');
        setError('Please log in to view profiles');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserProfileById(token, resolvedParams.id);
        setProfileData(data);
        setError(null);
      } catch (err) {
        let errorType: 'not-found' | 'unauthorized' | 'server-error' = 'server-error';
        let errorMessage = 'An unexpected error occurred';

        if (err instanceof Error) {
          if (err.message.includes('Invalid user ID format')) {
            errorType = 'not-found';
            errorMessage = 'Invalid profile ID format';
          } else if (err.message.includes('User not found')) {
            errorType = 'not-found';
            errorMessage = 'This explorer seems to have wandered off the map!';
          } else if (err.message.includes('Please login')) {
            errorType = 'unauthorized';
            errorMessage = 'Please log in to view this profile';
          }
        }

        setError(errorMessage);
        setErrorType(errorType);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, router, resolvedParams.id]);

  // Show loading state while auth is initializing
  if (!isInitialized) {
    return <ProfileSkeleton />;
  }

  // Only show unauthorized message after auth is initialized
  if (!token) {
    return <ErrorState type="unauthorized" message="Please log in to view profiles" />;
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profileData) {
    return <ErrorState type={errorType} message={error || undefined} />;
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${resolvedParams.id}`);
    toast.success('Profile link copied to clipboard!');
  };

  const handleReport = () => {
    if (!token || !profileData) {
      toast.error('Authentication required');
      return;
    }
  };

  const formattedProfileData = {
    username: profileData.username,
    bio: profileData.bio || "No bio yet",
    avatar: profileData.avatar ? (profileData.avatar.startsWith("http") ? profileData.avatar : `/users/${profileData.avatar}`) : '/default-avatar.png',
    userTrustedScore: profileData.karma?.total || 0,
    stats: {
      posts: profileData.posts?.length || 0,
      communities: profileData.joinedCommunities?.length || 0,
      joined: new Date(profileData.createdAt).toLocaleDateString("en-US", { 
        month: "long", 
        year: "numeric" 
      }),
      location: "Pakistan",
      karma: {
        total: profileData.karma?.total || 0,
        postKarma: profileData.karma?.postKarma || 0,
        commentKarma: profileData.karma?.commentKarma || 0,
        lastCalculated: profileData.karma?.lastCalculated ? new Date(profileData.karma.lastCalculated).toLocaleDateString() : 'Never'
      }
    }
  };

  // Transform the posts data to match PostCard component props
  const userPosts = profileData.posts?.map(post => ({
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
  })) || [];

  const userCommunities = profileData.joinedCommunities?.map(community => ({
    _id: community._id,
    name: community.name,
    members: community.memberCount,
    image: community.avatar,
    description: community.description
  })) || [];

  return (
    <div className="space-y-8">
      <div className="relative">
        <ProfileHeader {...formattedProfileData} readOnly />
        <div className="absolute top-4 right-4">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                className="gap-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(false);
                  setIsReportDialogOpen(true);
                }}
              >
                <Flag className="h-4 w-4" />
                <span>Report</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 cursor-pointer"
                onSelect={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReport}
        type="user"
        contentTitle={profileData.username}
        itemId={profileData._id}
      />
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
