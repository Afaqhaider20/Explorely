import { Button } from "@/components/ui/button";
import { Clock, Map, Users, ArrowRight, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/store/AuthContext";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import React from "react";

interface ItineraryCardProps {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  travelers: number;
  coverImage: string;
  status: 'upcoming' | 'planning' | 'completed';
  progress?: number;
  activities?: number[];
  description?: string;
  colorStyle?: 'primary' | 'emerald';
  actionLabel?: string;
  onDelete?: () => void;
}

export function ItineraryCard({
  id,
  title,
  destination,
  startDate,
  endDate,
  duration,
  travelers,
  status,
  activities,
  description,
  colorStyle = 'primary',
  actionLabel = 'View Details',
  onDelete
}: ItineraryCardProps) {
  const { token } = useAuth();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const colorClasses = {
    primary: {
      badge: 'bg-primary/10 text-primary',
      button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
      progress: 'bg-primary',
      accent: 'from-primary/20 to-primary/5'
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
    planning: 'bg-primary/10 text-primary',
    completed: 'bg-emerald-500/10 text-emerald-700'
  };

  const statusText = {
    upcoming: 'Upcoming',
    planning: 'Upcoming',
    completed: 'Completed'
  };

  const colors = colorClasses[colorStyle];
  const detailsUrl = `/itineraries/${id}`;
  
  // Format dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  // Format duration
  const durationNum = Number(duration);
  const durationLabel = durationNum === 1 ? '1 day' : `${durationNum} days`;

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className={cn(
        "w-full h-32 bg-gradient-to-br",
        colors.accent,
        "flex items-center justify-center relative"
      )}>
        <Map className="h-16 w-16 text-primary/20" />
        <div className="absolute top-3 left-3">
          <Badge className={statusBadgeClass[status]}>
            {statusText[status]}
          </Badge>
        </div>
        {activities && activities.length > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-black/20 backdrop-blur-sm text-white border-white/20">
              {activities.length} activities
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <Link href={detailsUrl}>
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">
              {title}
            </h3>
          </Link>
          <div className="flex items-center text-white/90 text-sm">
            <Map className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-md bg-muted flex-shrink-0">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {formatDate(startDate)}
                <span className="mx-1 text-muted-foreground">→</span>
                {formatDate(endDate)}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-1 border-t gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{travelers} travelers</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href={detailsUrl} className="w-full sm:w-auto">
              <Button size="sm" className={cn(colors.button, "gap-1 w-full sm:w-auto")}>{actionLabel}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
            </Link>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1 w-full sm:w-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Itinerary</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this itinerary? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDialogOpen(false);
                      try {
                        await axios.delete(`/api/useritineraries/${id}`, {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        });
                        toast.success('Itinerary deleted successfully');
                        onDelete?.();
                      } catch (error) {
                        console.error('Error deleting itinerary:', error);
                        toast.error('Failed to delete itinerary');
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Card>
  );
}
