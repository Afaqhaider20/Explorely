'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { MiniCommunityCard } from './MiniCommunityCard';

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
        
        <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {loading ? (
            <div className="text-center text-foreground-subtle">Loading communities...</div>
          ) : communities.length === 0 ? (
            <div className="text-center text-foreground-subtle">No communities found</div>
          ) : (
            communities.map((community) => (
              <MiniCommunityCard
                key={community._id}
                community={community}
                variant="list"
                compact
              />
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
