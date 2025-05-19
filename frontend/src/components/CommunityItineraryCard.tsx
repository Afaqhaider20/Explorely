'use client';

import { Card, CardContent, CardFooter } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Map, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Image from "next/image";

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
  communityId?: string;
}

interface CommunityItineraryCardProps {
  itinerary: Itinerary;
  communityName: string;
}

export function CommunityItineraryCard({ itinerary, communityName }: CommunityItineraryCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer border-primary/10 hover:border-primary/30">
      <div className="relative h-48 overflow-hidden">
        {itinerary.coverImage ? (
          <div className="relative w-full h-full">
            <Image 
              src={itinerary.coverImage}
              alt={itinerary.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
            <Map className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
          <h3 className="text-xl font-bold line-clamp-2">{itinerary.title}</h3>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(itinerary.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{itinerary.duration} {itinerary.duration === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2">{itinerary.description}</p>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {itinerary.destinations.slice(0, 3).map((destination, index) => (
            <Badge key={index} variant="outline" className="bg-primary/5">
              {destination}
            </Badge>
          ))}
          {itinerary.destinations.length > 3 && (
            <Badge variant="outline" className="bg-primary/5">
              +{itinerary.destinations.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={itinerary.author.avatar} alt={itinerary.author.username} />
            <AvatarFallback>{itinerary.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{itinerary.author.username}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10">
            {communityName}
          </Badge>
          <Link href={`/community-itineraries/${itinerary.communityId || 'unknown'}/${itinerary._id}`}>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              View Itinerary
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
