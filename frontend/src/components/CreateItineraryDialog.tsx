"use client";

// Make sure all imports are correct
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// Define the expected data structure
export interface CreateItineraryData {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
}

interface CreateItineraryDialogProps {
  trigger: React.ReactNode;
  onSubmit: (data: CreateItineraryData) => void;
}

export function CreateItineraryDialog({ 
  trigger, 
  onSubmit 
}: CreateItineraryDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [travelers, setTravelers] = useState<number>(2);

  const handleSubmit = () => {
    if (!title || !destination || !startDate || !endDate) {
      return;
    }
    
    onSubmit({
      title,
      destination,
      startDate,
      endDate,
      travelers,
    });
    
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDestination("");
    setStartDate(undefined);
    setEndDate(undefined);
    setTravelers(2);
  };
  
  // Calculate trip duration
  const tripDuration = startDate && endDate 
    ? differenceInDays(endDate, startDate) + 1 
    : 0;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Itinerary</DialogTitle>
          <DialogDescription>
            Plan your next adventure by filling in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Itinerary Title</Label>
            <Input 
              id="title"
              placeholder="e.g., Summer Vacation 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="destination" 
                placeholder="e.g., Hunza Valley, Pakistan"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      // If end date is before start date, reset it
                      if (endDate && date && date > endDate) {
                        setEndDate(undefined);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                      !startDate && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!startDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => 
                      !startDate || date < startDate
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {startDate && endDate && (
            <Card className="p-4 bg-muted/30 border-muted">
              <div className="flex items-center text-sm">
                <Info className="h-4 w-4 mr-2 text-primary/70" />
                <span>Your trip will last for <span className="font-medium">{tripDuration}</span> {tripDuration === 1 ? 'day' : 'days'}</span>
              </div>
            </Card>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="travelers">Number of Travelers</Label>
              <span className="text-sm text-muted-foreground">{travelers}</span>
            </div>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                disabled={travelers <= 1}
              >
                -
              </Button>
              <div className="flex-1 mx-4 flex items-center justify-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="travelers"
                  type="number"
                  min={1}
                  max={20}
                  value={travelers}
                  onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTravelers(Math.min(20, travelers + 1))}
                disabled={travelers >= 20}
              >
                +
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!title || !destination || !startDate || !endDate}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
