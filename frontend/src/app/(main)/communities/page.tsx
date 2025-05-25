'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { CreateCommunityDialog } from '@/components/CreateCommunityDialog';

interface Community {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  memberCount?: number;
  creator?: {
    _id: string;
    username: string;
    avatar: string;
  };
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, user, removeJoinedCommunity } = useAuth();
  const router = useRouter();

  const fetchCommunities = useCallback(async () => {
    if (!token) {
      toast.error('Authentication required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch communities');
      }

      const data = await response.json();
      const fetchedCommunities = data.joinedCommunities || [];
      setCommunities(fetchedCommunities);

      // Compare with auth context communities and remove any that no longer exist
      if (user?.joinedCommunities) {
        const fetchedCommunityIds = new Set(fetchedCommunities.map((c: Community) => c._id));
        
        // Find communities that exist in auth context but not in fetched data
        const removedCommunities = user.joinedCommunities.filter(
          community => !fetchedCommunityIds.has(community._id)
        );

        // Remove each non-existent community from auth context
        removedCommunities.forEach(community => {
          removeJoinedCommunity(community._id);
        });
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  }, [token, user?.joinedCommunities, removeJoinedCommunity]);

  useEffect(() => {
    // Initialize with communities from auth context if available
    if (user?.joinedCommunities) {
      setCommunities(user.joinedCommunities);
      setLoading(false);
    }
    // Then fetch fresh data
    fetchCommunities();
  }, [fetchCommunities, user?.joinedCommunities]);

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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

  return (
    <div className="min-h-screen pb-10 bg-muted/30">
      <div className="container max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Communities</h1>
            <p className="text-muted-foreground">
              Connect with fellow travelers and share your experiences
            </p>
          </div>
          <CreateCommunityDialog
            onSubmit={async () => {
              await fetchCommunities();
            }}
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Community
              </Button>
            }
          />
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-background border rounded-xl p-8 max-w-md mx-auto">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Communities Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "No communities match your search. Try different keywords!"
                  : "You haven't joined any communities yet. Create one or join existing ones to get started!"}
              </p>
              <CreateCommunityDialog
                onSubmit={async () => {
                  await fetchCommunities();
                }}
                trigger={
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Community
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <Card
                key={community._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/communities/${community._id}`)}
              >
                <div className="aspect-video bg-muted relative">
                  <Avatar className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 h-20 w-20 border-4 border-background">
                    <AvatarImage src={community.avatar} alt={community.name} />
                    <AvatarFallback className="text-2xl">
                      {community.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="p-6 pt-12">
                  <h3 className="text-xl font-semibold mb-2 text-center">
                    {community.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 text-center">
                    {community.description}
                  </p>
                  <div className="flex justify-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {community.memberCount} members
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 