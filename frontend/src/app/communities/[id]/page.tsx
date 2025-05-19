'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollText, Users, Info, MessageSquare, Map, UserPlus, UserMinus, Shield, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { useAuth } from '@/store/AuthContext';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { PostCard } from "@/components/PostCard";
import { CommunityItineraryCard } from "@/components/CommunityItineraryCard";

interface CommunityMember {
  _id: string;
  username: string;
  id: string;
  joinedCommunities: Community[];
}

interface CommunityRule {
  order: number;
  content: string;
  _id: string;
  createdAt: string;
}

// Interface for community objects stored in AuthContext
interface JoinedCommunity {
  _id: string;
  name: string;
  avatar: string;
  description: string;
  rules: {
    order: number;
    content: string;
    _id: string;
    createdAt: string;
  }[];
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

interface Itinerary {
  _id: string;
  title: string;
  description: string;
  destinations: string[];
  duration: number;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  coverImage: string | null;
  communityId?: string; // Add this field
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
  rules: CommunityRule[];
  posts: Post[];
  itineraries: Itinerary[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export default function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false); // Track join/leave operation state
  const { token, user, addJoinedCommunity, removeJoinedCommunity } = useAuth();

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
      toast.error('Authentication required');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching community with ID:', resolvedParams.id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Raw API response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch community');
      }

      let communityData = data.data?.community || data;
      
      // Add dummy itineraries if they don't exist
      if (!communityData.itineraries || communityData.itineraries.length === 0) {
        communityData = {
          ...communityData,
          itineraries: [
            {
              _id: "itin_001",
              title: "Weekend in Paris",
              description: "A perfect weekend getaway exploring the City of Light",
              destinations: ["Paris", "Versailles"],
              duration: 3,
              author: {
                _id: communityData.creator._id,
                username: communityData.creator.username,
                avatar: "/avatars/user-01.jpg"
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              coverImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000",
              communityId: communityData._id, // Add community ID
              places: {
                eat: ["Le Bistrot Parisien", "Café de Flore"],
                stay: ["Hotel de Paris", "Le Marais Apartment"],
                visit: ["Eiffel Tower", "Louvre Museum", "Notre Dame"]
              }
            },
            {
              _id: "itin_002",
              title: "Tokyo Adventure",
              description: "Exploring the vibrant neighborhoods and traditions of Tokyo",
              destinations: ["Tokyo", "Kyoto"],
              duration: 7,
              author: {
                _id: communityData.members[0]?._id || communityData.creator._id,
                username: communityData.members[0]?.username || communityData.creator.username,
                avatar: "/avatars/user-02.jpg"
              },
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              coverImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000",
              communityId: communityData._id, // Add community ID
              places: {
                eat: ["Sushi Dai", "Ichiran Ramen", "Tsukiji Market"],
                stay: ["Shinjuku Ryokan", "Tokyo Bay Hotel"],
                visit: ["Shibuya Crossing", "Tokyo Tower", "Senso-ji Temple", "Meiji Shrine"]
              }
            },
            {
              _id: "itin_003",
              title: "Italian Countryside",
              description: "Discover the charming villages and vineyards of Tuscany",
              destinations: ["Florence", "Siena", "San Gimignano"],
              duration: 5,
              author: {
                _id: communityData.members[1]?._id || communityData.creator._id,
                username: communityData.members[1]?.username || "travel_lover",
                avatar: "/avatars/user-03.jpg"
              },
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              coverImage: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1000",
              communityId: communityData._id, // Add community ID
              places: {
                eat: ["Trattoria Mario", "Osteria del Cinghiale Bianco", "Gelateria La Carraia"],
                stay: ["Tuscan Villa", "Agriturismo Il Casale"],
                visit: ["Uffizi Gallery", "Ponte Vecchio", "Duomo di Siena", "Chianti Vineyards"]
              }
            }
          ]
        };
      } else {
        // Add communityId to any existing itineraries
        communityData.itineraries = communityData.itineraries.map((itinerary: Omit<Itinerary, 'communityId'>) => ({
          ...itinerary,
          communityId: communityData._id
        }));
      }
      
      console.log('Processed community data:', communityData);
      setCommunity(communityData);
    } catch (err) {
      console.error('Error fetching community:', err);
      toast.error('Failed to load community. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, token]);

  // Function to check if current user is a member
  const isUserMember = useCallback(() => {
    if (!user || !community) return false;
    return community.members.some(member => member._id === user._id);
  }, [user, community]);

  // Function to check if current user is a moderator
  const isUserModerator = useCallback(() => {
    if (!user || !community) return false;
    return community.moderators.some(mod => mod._id === user._id);
  }, [user, community]);

  // Function to check if current user is the creator
  const isUserCreator = useCallback(() => {
    if (!user || !community) return false;
    return community.creator?._id === user._id;
  }, [user, community]);

  // Function to handle join/leave action
  const handleToggleMembership = async () => {
    if (!token || !community) return;

    setIsJoining(true);
    try {
      const isMember = isUserMember();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${community._id}/toggle-membership`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle membership');
      }

      // Update AuthContext based on the action (join/leave)
      if (isMember) {
        // User was a member and is now leaving
        removeJoinedCommunity(community._id);
        toast.success(`Left ${community.name}`, {
          description: "You are no longer a member of this community"
        });
      } else {
        // User was not a member and is now joining
        const communityForContext: JoinedCommunity = {
          _id: community._id,
          name: community.name,
          avatar: community.avatar,
          description: community.description,
          rules: community.rules
        };
        addJoinedCommunity(communityForContext);
        toast.success(`Joined ${community.name}!`, {
          description: "Welcome to the community"
        });
      }

      // Refresh community data after successful action
      await fetchCommunity();
    } catch (err) {
      console.error('Error toggling membership:', err);
      toast.error('Failed to update membership. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

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

  if (!community) {
    console.log('Community is null:', community);
    return (
      <div className="min-h-screen pb-10">
        <div className="container max-w-6xl px-4 py-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Community Not Found</h2>
          <p className="text-muted-foreground">This community doesn&apos;t exist or you don&apos;t have access.</p>
        </div>
      </div>
    );
  }

  console.log('Rendering community:', community);

  return (
    <div className="min-h-screen pb-10">
      <div className="container max-w-6xl px-4">
        <div className="border rounded-xl p-6 backdrop-blur-sm bg-background">
          <div className="flex gap-8 items-start">
            <Avatar className="h-40 w-40 rounded-xl ring-4 ring-background flex-shrink-0">
              <AvatarImage src={community?.avatar} alt={community?.name || 'Community'} />
              <AvatarFallback className="text-4xl">
                {community?.name ? community.name.slice(0, 2).toUpperCase() : 'C'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-3xl font-bold text-secondary">{community?.name}</h1>
                
                {/* Membership button */}
                {user && !isUserCreator() && (
                  <Button
                    onClick={handleToggleMembership}
                    disabled={isJoining}
                    variant={isUserMember() ? "outline" : "default"}
                    className="gap-2"
                  >
                    {isJoining ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isUserModerator() ? (
                      <>
                        <Shield className="h-4 w-4" />
                        Moderator
                      </>
                    ) : isUserMember() ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        Leave
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Join
                      </>
                    )}
                  </Button>
                )}
                
                {isUserCreator() && (
                  <Badge variant="outline" className="py-1.5 px-3 border-primary/20 bg-primary/5">
                    <Shield className="h-4 w-4 mr-1.5 text-primary" />
                    Owner
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground text-lg mb-6">{community?.description}</p>
              
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {community?.memberCount || 0} members
                </div>
                <div className="flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  Created {formatCreatedAt(community?.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="posts" className="space-y-6">
            <div className="bg-card border rounded-lg p-1">
              <TabsList className="w-full bg-transparent space-x-8">
                <TabsTrigger value="posts" className="data-[state=active]:bg-primary/10">
                  <ScrollText className="h-4 w-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="itineraries" className="data-[state=active]:bg-primary/10">
                  <Map className="h-4 w-4 mr-2" />
                  Itineraries
                </TabsTrigger>
                <TabsTrigger value="about" className="data-[state=active]:bg-primary/10">
                  <Info className="h-4 w-4 mr-2" />
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
                onPostCreated={fetchCommunity}
              />

              {(community?.posts?.length || 0) > 0 ? (
                <div className="space-y-6">
                  {community.posts.map((post) => (
                    <PostCard 
                      key={post._id}
                      {...post}
                      media={post.media || null}  // Ensure media is never undefined
                      community={community}
                      commentCount={post.commentCount || 0}
                      updatedAt={post.updatedAt || post.createdAt}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="itineraries" className="space-y-6">
              <Button 
                variant="outline" 
                className="w-full py-8 border-2 border-dashed bg-muted/50 hover:bg-muted/80 hover:border-solid 
                  transition-all duration-200 group flex items-center justify-center gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-background p-2 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <Map className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground font-medium">
                    Create a New Itinerary
                  </span>
                </div>
              </Button>

              {(community?.itineraries?.length || 0) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {community.itineraries.map((itinerary: Itinerary) => (
                    <CommunityItineraryCard 
                      key={itinerary._id}
                      itinerary={itinerary}
                      communityName={community.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Map className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No itineraries yet. Share your travel plans with the community!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <Card className="p-6">
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

              <Card className="p-6">
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
    </div>
  );
}
