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
        "overflow-hidden hover:shadow-md transition-all duration-300 hover:border-primary/20 group",
        isGrid && "h-full"
      )}>
        <CardContent className={cn(
          compact ? "p-2" : "p-4"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isGrid && "flex-col gap-3 h-full"
          )}>
            <div className={cn(
              "flex items-center gap-3",
              isGrid && "w-full"
            )}>
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
                  "text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5",
                  compact ? "line-clamp-1" : "line-clamp-2"
                )}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30 flex-shrink-0"></span>
                  <span className="truncate">{community.description}</span>
                </p>
                <div className={cn(
                  "flex items-center gap-3 mt-2 text-xs text-muted-foreground",
                  compact && "mt-1"
                )}>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{community.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{community.postCount} posts</span>
                  </div>
                </div>
              </div>
            </div>

            {isGrid && (
              <div className="mt-auto pt-1 w-full">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full text-xs justify-center hover:bg-primary/5 hover:text-primary mt-2 group-hover:bg-primary/5 group-hover:text-primary transition-colors"
                >
                  View Community
                </Button>
              </div>
            )}

            {!isGrid && !showJoinButton && !compact && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-xs font-medium text-primary",
                  "opacity-0 group-hover:opacity-100 transition-all duration-200",
                  "absolute right-3 hover:bg-primary/5"
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