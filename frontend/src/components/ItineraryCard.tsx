import { Button } from "@/components/ui/button";
import { Clock, Map, Users, PlusCircle, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ItineraryCardProps {
  id: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  travelers: number;
  coverImage: string;
  status: 'upcoming' | 'planning' | 'completed';
  progress?: number;
  activities?: number;
  description?: string;
  onAddActivity: () => void;
  colorStyle?: 'primary' | 'amber' | 'emerald';
  actionLabel?: string;
}

export function ItineraryCard({
  id,
  title,
  destination,
  startDate,
  endDate,
  duration,
  travelers,
  coverImage,
  status,
  progress,
  activities,
  description,
  onAddActivity,
  colorStyle = 'primary',
  actionLabel = 'View Details'
}: ItineraryCardProps) {
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

  const colors = colorClasses[colorStyle];
  const detailsUrl = `/itineraries/${id}`;
  
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300">
      {coverImage && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image 
            src={coverImage} 
            alt={destination}
            fill
            className="object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <Badge className={statusBadgeClass[status]}>
              {statusText[status]}
            </Badge>
            {activities !== undefined && activities > 0 && (
              <Badge variant="outline" className="bg-black/20 backdrop-blur-sm text-white border-white/20">
                {activities} activities
              </Badge>
            )}
          </div>

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
      )}
      
      {!coverImage && (
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
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        {!coverImage && (
          <div>
            <Link href={detailsUrl} className="group/link">
              <h3 className="text-xl font-bold text-secondary mb-1 group-hover/link:text-primary transition-colors">
                {title}
              </h3>
            </Link>
            <div className="flex items-center text-muted-foreground text-sm">
              <Map className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate">{destination}</span>
            </div>
          </div>
        )}
        
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-md bg-muted flex-shrink-0">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{startDate}</p>
              <p className="text-xs text-muted-foreground">→ {endDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-md bg-muted flex-shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">{duration}</p>
            </div>
          </div>
        </div>

        {status === 'planning' && progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Planning progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" indicatorClassName={colors.progress} />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 mt-1 border-t">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{travelers} travelers</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddActivity}
              className="hidden sm:flex"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Add activity
            </Button>
            <Link href={detailsUrl}>
              <Button size="sm" className={cn(colors.button, "gap-1")}>
                {actionLabel}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
