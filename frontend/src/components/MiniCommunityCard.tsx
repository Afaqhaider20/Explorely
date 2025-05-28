import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, MessageSquare } from "lucide-react";

interface CommunityPreview {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  memberCount: number;
  postCount: number;
}

interface MiniCommunityCardProps {
  community: CommunityPreview;
  variant?: 'grid' | 'list';
  showJoinButton?: boolean;
  compact?: boolean;
}

export function MiniCommunityCard({ 
  community, 
  variant = 'list',
  showJoinButton = false,
  compact = false
}: MiniCommunityCardProps) {
  const isGrid = variant === 'grid';

  return (
    <Link href={`/communities/${community._id}`} className="block h-full">
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30 group bg-white/90 hover:bg-primary/5 border border-border rounded-xl relative h-full flex flex-col",
        isGrid && "h-full"
      )}>
        <CardContent className={cn(
          compact ? "p-2" : "p-4",
          "flex flex-col h-full"
        )}>
          {/* Top: Avatar, name, description */}
          <div className="flex items-center gap-3 mb-1">
            <Avatar className={cn("rounded-lg ring-1 ring-border/50", compact ? "h-9 w-9" : "h-12 w-12") }>
              <AvatarImage src={community.avatar} alt={community.name} className="object-cover" />
              <AvatarFallback className="rounded-lg text-xs font-medium bg-primary/10 text-primary">
                {community.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
              <h3 className={cn(
                "font-medium group-hover:text-primary transition-colors duration-200 line-clamp-1",
                compact ? "text-sm" : "text-secondary"
              )}>
                {community.name}
              </h3>
              <p className={cn(
                "text-xs text-muted-foreground mt-0.5",
                "truncate w-48"
              )}>
                {community.description}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-muted/20" />

          {/* Bottom: Stats and View button */}
          <div className="flex items-center justify-between mt-auto pt-1 gap-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{community.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{community.postCount} posts</span>
              </div>
            </div>
            {/* View Button */}
            {!isGrid && !showJoinButton && !compact && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs font-medium text-primary border-primary/30 bg-white/80 hover:bg-primary/10 shadow-sm",
                  "opacity-0 group-hover:opacity-100 transition-all duration-200"
                )}
              >
                View
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 