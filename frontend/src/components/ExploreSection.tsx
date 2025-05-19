'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Fixed import
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";

interface ExploreSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showViewAll?: boolean;
}

interface Community {
  _id: string;  // Add _id to the interface
  name: string;
  members: number;
  image?: string;
  description?: string;
  tags?: string[];
  isNew?: boolean;
}

export function ExploreSection({ title, subtitle, children, showViewAll }: ExploreSectionProps) {
  return (
    <Card className="border-border/40 bg-gradient-to-b from-background to-muted/30">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground/80">{subtitle}</p>
          )}
        </div>
        {showViewAll && (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            View all
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function CommunityCard({ community }: { community: Community }) {
  return (
    <Link 
      href={`/communities/${community._id}`}
      className="group relative block p-4 rounded-lg hover:bg-muted/50 transition-all duration-200
        hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 rounded-xl border-2 border-border/40 transition-transform 
          duration-200 group-hover:scale-105 group-hover:border-primary/20">
          <AvatarImage src={community.image} />
          <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-foreground/70">
            {community.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {community.name}
            </h3>
            {community.isNew && (
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{community.members.toLocaleString()} members</span>
          </div>
        </div>
      </div>
      {community.description && (
        <p className="mt-3 text-sm text-muted-foreground/80 line-clamp-2 group-hover:text-muted-foreground/90">
          {community.description}
        </p>
      )}
      {community.tags && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {community.tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="bg-muted-foreground/10 hover:bg-muted-foreground/15 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent 
        via-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
