'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import axios from 'axios';

interface Community {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  memberCount: number;
  postCount: number;
}

export function RightSidebar() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchTopCommunities = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/communities/top`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        setCommunities(response.data.data.communities);
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCommunities();
  }, []); // Remove token dependency

  // Don't render anything until after hydration
  if (!mounted) {
    return null;
  }

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l border-border/40 bg-panel-translucent backdrop-blur supports-[backdrop-filter]:bg-panel-translucent">
      <div className="flex flex-col h-full p-4">
        <h2 className="font-semibold text-lg mb-6 px-2 text-secondary">
          Top Communities
        </h2>
        
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-foreground-subtle">Loading communities...</div>
          ) : communities.length === 0 ? (
            <div className="text-center text-foreground-subtle">No communities found</div>
          ) : (
            communities.map((community) => (
              <div
                key={community._id}
                className="group relative rounded-xl hover:bg-background-muted transition-all duration-200"
              >
                <Link
                  href={`/communities/${community._id}`}
                  className="block p-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 rounded-lg ring-1 ring-border/50">
                      <AvatarImage 
                        src={community.avatar} 
                        alt={community.name} 
                        className="object-cover" 
                      />
                      <AvatarFallback className="text-xs font-medium bg-background-muted text-foreground-muted">
                        {community.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-secondary group-hover:text-secondary/90 transition-colors duration-200">
                        {community.name}
                      </h3>
                      <p className="text-xs text-foreground-subtle mt-0.5 flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30"></span>
                        {community.memberCount.toLocaleString()} members
                      </p>
                      <p className="text-xs text-foreground-subtle mt-0.5">
                        {community.postCount.toLocaleString()} posts
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>

        <Link
          href="/explore"
          className="mt-6 text-sm text-primary hover:text-primary/80 transition-colors px-2 
          flex items-center gap-1.5 group"
        >
          Discover more communities
          <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </aside>
  );
}
