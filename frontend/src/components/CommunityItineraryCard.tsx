'use client';

import { Card } from "./ui/card";
import { Map, Calendar, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/store/AuthContext";

interface Activity {
  name: string;
  date?: string;
  notes?: string;
}

interface Itinerary {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  travelers: number;
  status: "upcoming" | "planning" | "completed";
  progress?: number;
  activities?: Activity[];
  description?: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  communityId?: string;
  community?: string;
}

interface CommunityItineraryCardProps {
  itinerary: Itinerary;
  communityName: string;
  isOwner: boolean;
  onDelete?: () => void;
}

export function CommunityItineraryCard({ 
  itinerary, 
  communityName, 
  isOwner, 
  onDelete
}: CommunityItineraryCardProps) {
  console.log('CommunityItineraryCard props:', { communityName, itinerary });
  const { token } = useAuth();
  const colorClasses = {
    primary: {
      badge: 'bg-primary/10 text-primary',
      button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
      progress: 'bg-primary',
      accent: 'from-primary/20 to-primary/5'
    },
    amber: {
      badge: 'bg-amber-500/10 text-amber-700',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
      progress: 'bg-amber-500',
      accent: 'from-amber-500/20 to-amber-500/5'
    },
    emerald: {
      badge: 'bg-emerald-500/10 text-emerald-700',
      button: 'bg-emerald-500 hover:bg-emerald-600 text-white', 
      progress: 'bg-emerald-500',
      accent: 'from-emerald-500/20 to-emerald-500/5'
    }
  };

  const statusBadgeClass = {
    upcoming: 'bg-primary/10 text-primary',
    planning: 'bg-amber-500/10 text-amber-700',
    completed: 'bg-emerald-500/10 text-emerald-700'
  };

  const statusText = {
    upcoming: 'Upcoming',
    planning: 'Planning',
    completed: 'Completed'
  };

  const colors = colorClasses['primary'];
  const detailsUrl = `/community-itineraries/${itinerary.community || itinerary.communityId}/${itinerary._id}?isOwner=${isOwner}`;

  // Format dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  // Format duration
  const durationNum = Number(itinerary.duration);
  const durationLabel = durationNum === 1 ? '1 day' : `${durationNum} days`;

  // Handle delete
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (!isOwner || !token) return;

    if (!itinerary?._id || !itinerary?.communityId) {
      toast.error('Invalid itinerary data');
      return;
    }

    if (!confirm('Are you sure you want to delete this itinerary?')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${itinerary.communityId}/itineraries/${itinerary._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete itinerary');
      }

      toast.success('Itinerary deleted successfully');
      if (typeof onDelete === 'function') {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete itinerary');
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className={cn(
        "w-full h-32 bg-gradient-to-br",
        colors.accent,
        "flex items-center justify-center relative"
      )}>
        <Map className="h-16 w-16 text-primary/20" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={statusBadgeClass[itinerary.status || 'upcoming']}>
            {statusText[itinerary.status || 'upcoming']}
          </Badge>
          <Badge variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/20">
            {communityName}
          </Badge>
        </div>
        {itinerary.activities && itinerary.activities.length > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-black/20 backdrop-blur-sm text-white border-white/20">
              {itinerary.activities.length} activities
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <Link href={detailsUrl}>
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">
              {itinerary.title}
            </h3>
          </Link>
          <div className="flex items-center text-white/90 text-sm">
            <Map className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{itinerary.destination}</span>
          </div>
          <div className="flex items-center text-white/80 text-xs mt-1">
            <span className="truncate">Community: {communityName}</span>
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {itinerary.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{itinerary.description}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-md bg-muted flex-shrink-0">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {formatDate(itinerary.startDate)}
                <span className="mx-1 text-muted-foreground">→</span>
                {formatDate(itinerary.endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-md bg-muted flex-shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">{durationLabel}</p>
            </div>
          </div>
        </div>
        {itinerary.status === 'planning' && itinerary.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Planning progress</span>
              <span className="font-medium">{itinerary.progress}%</span>
            </div>
            <Progress value={itinerary.progress} className="h-1.5" indicatorClassName={colors.progress} />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-1 border-t gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{itinerary.travelers} travelers</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href={detailsUrl} className="w-full sm:w-auto">
              <Button size="sm" className={cn(colors.button, "gap-1 w-full sm:w-auto")}>View Details<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
            </Link>
            {isOwner && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={handleDelete}
                className="gap-1 w-full sm:w-auto"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
