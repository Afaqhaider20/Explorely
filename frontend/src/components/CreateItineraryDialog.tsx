"use client";

import { useState } from "react";
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

// Define the expected data structure
export interface CreateItineraryData {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
}

interface CreateItineraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateItineraryDialog({ open, onOpenChange, onCreated }: CreateItineraryDialogProps) {
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
      await axios.post(
        '/api/useritineraries',
        { 
          ...form, 
          travelers: Number(form.travelers),
          duration: tripDuration.toString()
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      toast.success('Itinerary created!');
      onOpenChange(false);
      onCreated?.();
      setForm({
        title: '', 
        destination: '', 
        startDate: '', 
        endDate: '', 
        travelers: 1, 
        description: '',
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Itinerary creation error:", error.response?.data || error);
        toast.error(error.response?.data?.message || 'Failed to create itinerary');
      } else {
        console.error("Itinerary creation error:", error);
        toast.error('Failed to create itinerary');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Itinerary</DialogTitle>
          <DialogDescription>
            Plan your next adventure by filling in the details below.
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
          <Input name="travelers" type="number" min={1} value={form.travelers} onChange={handleChange} required />
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
              {loading ? 'Creating...' : 'Create Itinerary'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
