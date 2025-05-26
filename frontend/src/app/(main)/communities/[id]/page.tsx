"use client";

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollText, Users, Info, MessageSquare, Map, UserPlus, Shield, Loader2, Plus, Ban, ArrowLeft, Pencil, MoreHorizontal, Trash2, Share2, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { useAuth } from '@/store/AuthContext';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { PostCard } from "@/components/PostCard";
import { CommunityItineraryCard } from '@/components/CommunityItineraryCard';
import { CreateCommunityItineraryDialog } from "@/components/CreateCommunityItineraryDialog";
import { EditCommunityDialog } from "@/components/EditCommunityDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { SignInDialog } from "@/components/SignInDialog";
import { ReportDialog } from '@/components/ReportDialog';

interface CommunityMember {
  _id: string;
  username: string;
  id: string;
  avatar: string;
  joinedCommunities: Community[];
}

interface CommunityRule {
  order: number;
  content: string;
  _id: string;
  createdAt: string;
}

interface Post {
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
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  voteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  media: string | null;  // Changed from media?: string | null
}

interface Activity {
  name: string;
  date?: string;
  notes?: string;
}

interface Itinerary {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  travelers: number;
  status: "upcoming" | "planning" | "completed";
  progress?: number;
  activities?: Activity[];
  description?: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  communityId?: string;
  joinedUsers?: {
    _id: string;
    username: string;
    avatar: string;
  }[];
}

interface Community {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  banner: string;
  creator: CommunityMember;
  moderators: CommunityMember[];
  members: CommunityMember[];
  blockedMembers: CommunityMember[];  // Add blocked members
  rules: CommunityRule[];
  posts: Post[];
  itineraries: Itinerary[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

function PostSkeleton() {
  return (
    <div className="border rounded-xl p-6 backdrop-blur-sm bg-background">
      <div className="flex gap-4">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function CommunityPageClient({ id }: { id: string }) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    hasMore: true,
    total: 0
  });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { token, user, isAuthenticated, isInitialized, addJoinedCommunity, removeJoinedCommunity } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const router = useRouter();

  const formatCreatedAt = (dateString: string | undefined) => {
    if (!dateString) {
      console.log('No date string provided');
      return 'Recently';
    }
    
    try {
      // Remove any trailing decimal points and 'Z' if present
      const cleanDateString = dateString.split('.')[0] + 'Z';
      const date = parseISO(cleanDateString);
      
      if (!isValid(date)) {
        console.log('Invalid date after parsing:', dateString);
        return 'Recently';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      console.error('Error parsing date:', dateString, err);
      return 'Recently';
    }
  };

  const fetchCommunity = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching community with ID:', id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Raw API response:', data);

      if (!response.ok) {
        if (response.status === 403 && data.message?.includes('blocked')) {
          setIsBlocked(true);
          setLoading(false);
          return;
        }
        if (response.status === 404) {
          setCommunity(null);
          setLoading(false);
          return;
        }
        throw new Error(data.message || 'Failed to fetch community');
      }

      let communityData = data.data?.community || data;
      
      // Check if user is blocked
      if (user && communityData.blockedMembers?.some((member: CommunityMember) => member._id === user._id)) {
        setIsBlocked(true);
        setLoading(false);
        return;
      }
      
      // Fetch itineraries separately
      const itinerariesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${id}/itineraries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (itinerariesResponse.ok) {
        const itinerariesData = await itinerariesResponse.json();
        communityData = {
          ...communityData,
          itineraries: itinerariesData.data
        };
      } else {
        console.error('Failed to fetch itineraries:', await itinerariesResponse.json());
        communityData = {
          ...communityData,
          itineraries: []
        };
      }
      
      console.log('Processed community data:', communityData);
      setCommunity(communityData);
    } catch (err) {
      console.error('Error fetching community:', err);
      toast.error('Failed to load community. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [id, token, user]);

  const fetchPosts = useCallback(async (page = 1, append = false) => {
    if (!token) return;

    setPostsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communities/${id}/posts?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      const newPosts = data.data.posts;
      
      setPosts(prevPosts => append ? [...prevPosts, ...newPosts] : newPosts);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  }, [id, token, pagination.limit]);

  // Load initial posts when community is loaded
  useEffect(() => {
    if (community) {
      fetchPosts(1, false);
    }
  }, [community, fetchPosts]);

  // Update isOwner state whenever user or community changes
  useEffect(() => {
    if (user && community) {
      const ownerStatus = community.creator?._id === user._id;
      console.log('Setting owner status:', {
        userId: user._id,
        creatorId: community.creator?._id,
        isOwner: ownerStatus
      });
      setIsOwner(ownerStatus);
    } else {
      setIsOwner(false);
    }
  }, [user, community]);

  // Update isMember state whenever user or community changes
  useEffect(() => {
    if (user && community) {
      const memberStatus = community.members.some(member => member._id === user._id);
      setIsMember(memberStatus);
    } else {
      setIsMember(false);
    }
  }, [user, community]);

  // Only fetch community data when we have a token
  useEffect(() => {
    if (token) {
      fetchCommunity();
    }
  }, [fetchCommunity, token]);

  // Add intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && pagination.hasMore && !postsLoading) {
          fetchPosts(pagination.page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [pagination.hasMore, postsLoading, fetchPosts, pagination.page]);

  // Add new function to handle blocking members
  const handleBlockMember = async (memberId: string) => {
    if (!token || !user || !community || !isOwner) {
      toast.error('Unauthorized action');
      return;
    }

    setIsBlocking(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${community._id}/block-member`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ memberId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to block member');
      }

      toast.success('Member blocked successfully');
      await fetchCommunity(); // Refresh community data
    } catch (err) {
      console.error('Error blocking member:', err);
      toast.error('Failed to block member. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  // Add new function to handle unblocking members
  const handleUnblockMember = async (memberId: string) => {
    if (!token || !user || !community || !isOwner) {
      toast.error('Unauthorized action');
      return;
    }

    setIsBlocking(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${community._id}/unblock-member`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ memberId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unblock member');
      }

      toast.success('Member unblocked successfully');
      await fetchCommunity(); // Refresh community data
    } catch (err) {
      console.error('Error unblocking member:', err);
      toast.error('Failed to unblock member. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleToggleMembership = async () => {
    if (!token || !user || !community) {
      toast.error('Authentication required');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communities/${community._id}/toggle-membership`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update membership');
      }

      const data = await response.json();
      setIsMember(!isMember);
      
      // Update auth context based on the action
      if (data.action === 'joined') {
        addJoinedCommunity({
          _id: community._id,
          name: community.name,
          avatar: community.avatar,
          description: community.description,
          rules: community.rules || []
        });
      } else if (data.action === 'left') {
        removeJoinedCommunity(community._id);
      }

      toast.success(isMember ? 'Successfully left community' : 'Successfully joined community');
      await fetchCommunity(); // Refresh community data
    } catch (error) {
      console.error('Error toggling membership:', error);
      toast.error('Failed to update membership status');
    } finally {
      setIsJoining(false);
    }
  };

  const handleReport = async (reason: string) => {
    if (!token || !user) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reportedType: 'community',
            reportedItemId: community?._id,
            reason
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      toast.success('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
    setIsReportDialogOpen(false);
  };

  // Wait for auth to initialize before showing any content
  if (!isInitialized) {
    return (
      <div className="min-h-screen pb-10">
        <div className="container max-w-6xl px-4 py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-10">
        <div className="container max-w-6xl px-4 py-8">
          <div className="border rounded-xl p-8 backdrop-blur-sm bg-background text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold mb-2">Hold up, explorer! 🚀</h2>
            <p className="text-muted-foreground mb-6">
              This community is like a secret clubhouse - you need to be a member to peek inside! 
              Don&apos;t worry though, joining is as easy as pie! 🥧
            </p>
            <Button
              onClick={() => setSignInOpen(true)}
              className="gap-2"
            >
              Sign in to View Community
            </Button>
            <SignInDialog
              trigger={null}
              open={signInOpen}
              onOpenChange={setSignInOpen}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-10">
        <div className="container max-w-6xl px-4">
          <div className="border rounded-xl p-6 backdrop-blur-sm bg-background">
            <div className="flex gap-8 items-start">
              <div className="h-40 w-40 rounded-xl bg-muted animate-pulse" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-20 w-2/3 bg-muted rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen pb-10">
        <div className="container max-w-6xl px-4 py-8">
          <div className="border rounded-xl p-8 backdrop-blur-sm bg-background text-center">
            <Ban className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You have been blocked from accessing this community by the administrator.
            </p>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen pb-10">
        <div className="container max-w-6xl px-4 py-8 text-center">
          <div className="border rounded-xl p-8 backdrop-blur-sm bg-background">
            <div className="mb-6">
              <div className="text-6xl mb-4">🤔</div>
              <h2 className="text-2xl font-semibold mb-2">Oops! Looks like we got lost!</h2>
              <p className="text-muted-foreground mb-6">
                Either this community has packed its bags and left, or you&apos;ve wandered off to the wrong path!
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/communities')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Communities
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering community:', community);

  return (
    <div className="min-h-screen pb-10 bg-muted/30">
      <div className="container max-w-6xl px-2 sm:px-4">
        <div className="border rounded-xl p-6 sm:p-8 backdrop-blur-sm bg-background shadow-md sm:shadow-none">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start">
            <Avatar className="h-32 w-32 sm:h-48 sm:w-48 rounded-xl ring-4 ring-background flex-shrink-0 border-4 border-white shadow-md">
              <AvatarImage src={community?.avatar} alt={community?.name || 'Community'} />
              <AvatarFallback className="text-5xl">
                {community?.name ? community.name.slice(0, 2).toUpperCase() : 'C'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 w-full flex flex-col items-center sm:items-start">
              <div className="flex items-center justify-between w-full mb-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary text-center sm:text-left">{community?.name}</h1>
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
                    {isOwner ? (
                      <>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          onSelect={async (e) => {
                            e.preventDefault();
                            setIsDropdownOpen(false);
                            if (!confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
                              return;
                            }
                            try {
                              const response = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/api/communities/${community._id}`,
                                {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  }
                                }
                              );
                              if (!response.ok) {
                                throw new Error('Failed to delete community');
                              }
                              toast.success('Community deleted successfully');
                              setTimeout(() => {
                                router.push('/communities');
                              }, 1000);
                            } catch (error) {
                              console.error('Error deleting community:', error);
                              toast.error('Failed to delete community');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setIsDropdownOpen(false);
                            navigator.clipboard.writeText(`${window.location.origin}/communities/${community._id}`);
                            toast.success('Community link copied to clipboard!');
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
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
                          onSelect={(e) => {
                            e.preventDefault();
                            setIsDropdownOpen(false);
                            navigator.clipboard.writeText(`${window.location.origin}/communities/${community._id}`);
                            toast.success('Community link copied to clipboard!');
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="w-12 h-1 bg-primary/10 rounded-full mb-4 sm:hidden" />
              <div className="flex flex-col gap-3 w-full max-w-xs sm:max-w-none sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isOwner && (
                    <Badge variant="outline" className="py-1.5 px-3 border-primary/20 bg-primary/5 text-primary font-semibold rounded-full">
                      <Shield className="h-4 w-4 mr-1.5 text-primary" />
                      Owner
                    </Badge>
                  )}
                  {!isOwner && (
                    <Button
                      variant={isMember ? "outline" : "default"}
                      size="sm"
                      onClick={handleToggleMembership}
                      disabled={isJoining}
                      className={`gap-2 rounded-full font-medium transition-all duration-200 ${
                        isMember 
                          ? 'border-muted-foreground/20 hover:bg-muted-foreground/10 hover:text-muted-foreground' 
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      {isJoining ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isMember ? (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Leave Community
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Join Community
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditDialogOpen(true)}
                    className="gap-2 rounded-full font-medium border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-200"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Community
                  </Button>
                )}
              </div>
              <div className="w-full border-b border-muted mb-4 sm:hidden" />
              <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 text-center sm:text-left bg-muted/40 rounded-lg px-4 py-3 w-full max-w-xs sm:max-w-none mx-auto">
                {community?.description}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-8 text-sm text-muted-foreground w-full">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary/60" />
                  {community?.memberCount || 0} members
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary/60" />
                  Created {formatCreatedAt(community?.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add EditCommunityDialog */}
        {isOwner && community && (
          <EditCommunityDialog
            community={community}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onUpdated={fetchCommunity}
          />
        )}

        <div className="mt-6">
          <Tabs defaultValue="posts" className="space-y-6">
            <div className="bg-card border rounded-lg p-1 overflow-x-auto mt-4 sm:mt-0 shadow-sm sm:shadow-none">
              <TabsList className="w-full bg-muted/40 rounded-lg space-x-2 sm:space-x-4 min-w-max px-1 py-1">
                <TabsTrigger value="posts" className="data-[state=active]:bg-primary/10 whitespace-nowrap text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-md">
                  <ScrollText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="itineraries" className="data-[state=active]:bg-primary/10 whitespace-nowrap text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-md">
                  <Map className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Itineraries
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="members" className="data-[state=active]:bg-primary/10 whitespace-nowrap text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-md">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Members
                  </TabsTrigger>
                )}
                <TabsTrigger value="about" className="data-[state=active]:bg-primary/10 whitespace-nowrap text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-md">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  About
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="posts" className="space-y-6">
              <CreatePostDialog
                communityId={community._id}
                communityName={community.name}
                trigger={
                  <Button 
                    variant="outline" 
                    className="w-full py-8 border-2 border-dashed bg-muted/50 hover:bg-muted/80 hover:border-solid 
                      transition-all duration-200 group flex items-center justify-center gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-background p-2 shadow-sm group-hover:scale-110 transition-transform duration-200">
                        <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground font-medium">
                        Create a Post
                      </span>
                    </div>
                  </Button>
                }
                onPostCreated={() => {
                  fetchPosts(1, false); // Refresh posts from first page
                }}
              />

              {postsLoading && posts.length === 0 ? (
                <div className="space-y-6">
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard 
                      key={post._id}
                      {...post}
                      media={post.media || null}
                      community={{
                        ...community,
                        creator: community.creator
                      }}
                      commentCount={post.commentCount || 0}
                      updatedAt={post.updatedAt || post.createdAt}
                      onDelete={() => fetchPosts(1, false)}
                    />
                  ))}
                  
                  {/* Loading indicator and intersection observer target */}
                  <div ref={loadMoreRef} className="py-4">
                    {postsLoading && (
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="itineraries" className="space-y-6">
              {user && community.moderators.some(mod => mod._id === user._id) && (
                <div className="flex justify-end mb-4">
                  <Button
                    size="lg"
                    className="gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Create New Itinerary
                  </Button>
                  <CreateCommunityItineraryDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onCreated={fetchCommunity}
                    communityId={community._id}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 gap-6">
                {(community?.itineraries || []).length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Map className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No itineraries shared yet.</p>
                    {user && community.members.some(member => member._id === user._id) && (
                      <p className="text-sm mt-2">Be the first to share your travel plans!</p>
                    )}
                  </div>
                ) : (
                  community.itineraries.map((itinerary) => (
                    <CommunityItineraryCard
                      key={itinerary._id}
                      itinerary={{
                        ...itinerary,
                        community: community._id
                      }}
                      communityName={community.name}
                      isOwner={isOwner}
                      onDelete={fetchCommunity}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {isOwner && (
              <TabsContent value="members" className="space-y-6">
                <Tabs defaultValue="active" className="space-y-6">
                  <div className="bg-card border rounded-lg p-1 overflow-x-auto">
                    <TabsList className="w-full bg-transparent min-w-max">
                      <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-primary/10 whitespace-nowrap text-sm px-3 py-1.5">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Active Members
                      </TabsTrigger>
                      <TabsTrigger value="blocked" className="flex-1 data-[state=active]:bg-primary/10 whitespace-nowrap text-sm px-3 py-1.5">
                        <Ban className="h-3.5 w-3.5 mr-1.5" />
                        Blocked Members
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="active">
                    <Card className="p-4 sm:p-6">
                      <h3 className="text-xl font-semibold mb-4">Active Members</h3>
                      <div className="space-y-4">
                        {community.members.map((member) => (
                          <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar} alt={member.username} />
                                <AvatarFallback>{member.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{member.username}</p>
                                  {member._id === community.creator._id && (
                                    <Badge variant="outline" className="py-0.5 px-2 border-primary/20 bg-primary/5">
                                      <Shield className="h-3 w-3 mr-1 text-primary" />
                                      Owner
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Joined {formatCreatedAt(member.joinedCommunities?.find(c => c._id === community._id)?.createdAt)}
                                </p>
                              </div>
                            </div>
                            {member._id !== community.creator._id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleBlockMember(member._id)}
                                disabled={isBlocking}
                                className="gap-2 w-full sm:w-auto"
                              >
                                {isBlocking ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Ban className="h-4 w-4" />
                                    Block
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="blocked">
                    <Card className="p-4 sm:p-6">
                      <h3 className="text-xl font-semibold mb-4">Blocked Members</h3>
                      <div className="space-y-4">
                        {community.blockedMembers?.length > 0 ? (
                          community.blockedMembers.map((member) => (
                            <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-muted/50 gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.avatar} alt={member.username} />
                                  <AvatarFallback>{member.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{member.username}</p>
                                    {member._id === community.creator._id && (
                                      <Badge variant="outline" className="py-0.5 px-2 border-primary/20 bg-primary/5">
                                        <Shield className="h-3 w-3 mr-1 text-primary" />
                                        Owner
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Blocked {formatCreatedAt(member.joinedCommunities?.find(c => c._id === community._id)?.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockMember(member._id)}
                                disabled={isBlocking}
                                className="gap-2 w-full sm:w-auto"
                              >
                                {isBlocking ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4" />
                                    Unblock
                                  </>
                                )}
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Ban className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No blocked members</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}

            <TabsContent value="about" className="space-y-6">
              <Card className="p-4 sm:p-6">
                <h3 className="text-xl font-semibold mb-4">Community Rules</h3>
                <ol className="space-y-4">
                  {(community?.rules || []).sort((a, b) => a.order - b.order).map((rule) => (
                    <li key={rule._id} className="flex gap-4">
                      <span className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                        {rule.order}
                      </span>
                      <span className="flex-1">{rule.content}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="p-4 sm:p-6">
                <h3 className="text-xl font-semibold mb-4">Community Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{community?.memberCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Members</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{community?.moderators?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Moderators</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{community?.posts?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReport}
        type="community"
        contentTitle={community?.name || ''}
        itemId={community?._id || ''}
      />
    </div>
  );
}

export default function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <CommunityPageClient id={resolvedParams.id} />;
}
