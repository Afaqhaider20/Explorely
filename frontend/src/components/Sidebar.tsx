'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Newspaper,
  Compass,
  LucideIcon,
  Plus,
  Star,
  Map,
  UserPlus,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";
import { useAuth } from '@/store/AuthContext';
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const publicNavItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Newspaper,
  },
  {
    href: '/explore',
    label: 'Explore',
    icon: Compass,
  },
  {
    href: '/reviews',
    label: 'Reviews',
    icon: Star,
  },
];

const privateNavItems: NavItem[] = [
  {
    href: '/itineraries',
    label: 'My Itineraries',
    icon: Map,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const handleCreateCommunity = (data: { name: string; description: string; avatar?: File }) => {
    // Implement community creation logic here
    console.log('Creating community:', data);
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border/40 bg-panel-translucent backdrop-blur supports-[backdrop-filter]:bg-panel-translucent">
      <ScrollArea className="h-full">
        <div className="px-3 py-6">
          <nav className="space-y-2.5">
            {/* Public Navigation Items */}
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "bg-primary/8 text-primary shadow-sm"
                    : "text-foreground-muted hover:bg-background-muted hover:text-foreground hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    pathname === item.href ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}

            {/* Private Navigation Items - Only show when logged in */}
            {user && (
              <>
                {privateNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname === item.href
                        ? "bg-primary/8 text-primary shadow-sm"
                        : "text-foreground-muted hover:bg-background-muted hover:text-foreground hover:shadow-sm"
                    )} 
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}

                {/* Communities Section - Only show when logged in */}
                <div className="pt-2 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground px-3">
                    Communities
                  </h3>

                  <CreateCommunityDialog
                    onSubmit={handleCreateCommunity}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-sm font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Create Community
                      </Button>
                    }
                  />

                  {user.joinedCommunities && user.joinedCommunities.length > 0 ? (
                    <div className="space-y-1">
                      {(Array.isArray(user.joinedCommunities) ? user.joinedCommunities : []).map((community) => (
                        <Link
                          key={community._id || `community-${Date.now()}-${Math.random()}`}
                          href={`/communities/${community._id}`}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                            pathname === `/communities/${community._id}`
                              ? "bg-primary/5 text-primary font-medium"
                              : "text-foreground-muted hover:text-foreground hover:bg-background-muted"
                          )}
                        >
                          <Avatar className="h-6 w-6 ring-1 ring-border/50">
                            {community.avatar ? (
                              <AvatarImage src={community.avatar} alt={community.name || ''} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {community.name ? community.name.slice(0, 2).toUpperCase() : 'C'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="truncate">{community.name || 'Community'}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-8 text-center">
                      <UserPlus className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">No communities joined yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.location.href = '/communities'}
                      >
                        Browse Communities
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}
