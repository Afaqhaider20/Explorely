"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInDays } from "date-fns";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from "@/store/AuthContext";

interface Activity {
  _id?: string;
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
  community: string;
}

interface EditCommunityItineraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (updatedItinerary: Itinerary) => void;
  communityId: string;
  itinerary: Itinerary;
}

export function EditCommunityItineraryDialog({ 
  open, 
  onOpenChange, 
  onCreated,
  communityId,
  itinerary
}: EditCommunityItineraryDialogProps) {
  const [form, setForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // Initialize form with itinerary data
  useEffect(() => {
    if (itinerary) {
      setForm({
        title: itinerary.title,
        destination: itinerary.destination,
        startDate: itinerary.startDate.split('T')[0],
        endDate: itinerary.endDate.split('T')[0],
        travelers: itinerary.travelers,
        description: itinerary.description || '',
      });
    }
  }, [itinerary]);

  // Calculate trip duration
  const tripDuration = form.startDate && form.endDate 
    ? differenceInDays(new Date(form.endDate), new Date(form.startDate)) + 1 
    : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle date validation
    if (name === 'startDate' || name === 'endDate') {
      const today = new Date().toISOString().split('T')[0];
      
      if (name === 'startDate') {
        // Ensure start date is not before today
        if (value < today) {
          toast.error('Start date cannot be before today');
          return;
        }
        // If end date exists and is before new start date, update it
        if (form.endDate && value > form.endDate) {
          setForm(prev => ({ ...prev, endDate: value }));
        }
      } else if (name === 'endDate') {
        // Ensure end date is not before start date
        if (form.startDate && value < form.startDate) {
          toast.error('End date cannot be before start date');
          return;
        }
      }
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDuration) {
      toast.error('Please select valid start and end dates');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communities/${communityId}/itineraries/${itinerary._id}`,
        { 
          ...form, 
          duration: tripDuration.toString(),
          status: itinerary.status
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      // Get the updated itinerary from the response
      const updatedItinerary = response.data.data;
      
      toast.success('Itinerary updated successfully!');
      onOpenChange(false);
      // Pass the updated itinerary to the parent component
      onCreated?.(updatedItinerary);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Itinerary update error:", error.response?.data || error);
        toast.error(error.response?.data?.message || 'Failed to update itinerary');
      } else {
        console.error("Itinerary update error:", error);
        toast.error('Failed to update itinerary');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Itinerary</DialogTitle>
          <DialogDescription>
            Update your itinerary details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
          <Input name="destination" placeholder="Destination" value={form.destination} onChange={handleChange} required />
          <div className="flex gap-2">
            <Input 
              name="startDate" 
              type="date" 
              value={form.startDate} 
              onChange={handleChange} 
              min={new Date().toISOString().split('T')[0]}
              required 
            />
            <Input 
              name="endDate" 
              type="date" 
              value={form.endDate} 
              onChange={handleChange} 
              min={form.startDate || new Date().toISOString().split('T')[0]}
              required 
            />
          </div>
          <Input 
            name="travelers" 
            type="number" 
            placeholder="Number of travelers" 
            value={form.travelers} 
            onChange={handleChange}
            min={1}
            required 
          />
          <Textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />
          
          {form.startDate && form.endDate && (
            <Card className="p-4 bg-muted/30 border-muted">
              <div className="flex items-center text-sm">
                <Info className="h-4 w-4 mr-2 text-primary/70" />
                <span>Your trip will last for <span className="font-medium">{tripDuration}</span> {tripDuration === 1 ? 'day' : 'days'}</span>
              </div>
            </Card>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Itinerary'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 