'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const recommendedCommunities = [
  {
    id: 1,
    name: 'Nature Photography',
    members: 12453,
    image: '/communities/nature.jpg',
    href: '/communities/photography',
  },
  {
    id: 2,
    name: 'Adventure Pakistan',
    members: 8234,
    image: '/communities/adventure.jpg',
    href: '/communities/adventure',
  },
  {
    id: 3,
    name: 'Street Food Explorer',
    members: 15678,
    image: '/communities/food.jpg',
    href: '/communities/food',
  },
];

export default function RightSidebar() {
  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l border-border/40 bg-panel-translucent backdrop-blur supports-[backdrop-filter]:bg-panel-translucent">
      <div className="flex flex-col h-full p-4">
        <h2 className="font-semibold text-lg mb-6 px-2 text-secondary">
          Explore Communities
        </h2>
        
        <div className="space-y-3">
          {recommendedCommunities.map((community) => (
            <div
              key={community.id}
              className="group relative rounded-xl hover:bg-background-muted transition-all duration-200"
            >
              <Link
                href={community.href}
                className="block p-3"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 rounded-lg ring-1 ring-border/50">
                    <AvatarImage src={community.image} alt={community.name} className="object-cover" />
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
                      {community.members.toLocaleString()} members
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-medium hover:bg-primary/5 hover:text-primary 
                    transition-all duration-200 opacity-0 group-hover:opacity-100 absolute right-3"
                  >
                    Join
                  </Button>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <Link
          href="/communities/discover"
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
