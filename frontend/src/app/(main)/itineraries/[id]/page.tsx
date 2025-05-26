"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import { Loader2, MapPin, Users, Calendar, Info, Plus, BedDouble, Utensils, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useAuth } from "@/store/AuthContext";
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

interface Accommodation {
  name: string;
  address?: string;
  date?: string;
  notes?: string;
}

interface Restaurant {
  name: string;
  address?: string;
  date?: string;
  notes?: string;
}

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
  accommodations?: Accommodation[];
  restaurants?: Restaurant[];
}

export default function ItineraryDetailsPage() {
  const { id } = useParams();
  const { token, isAuthenticated, isInitialized } = useAuth();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accForm, setAccForm] = useState<Accommodation>({ name: '' });
  const [restForm, setRestForm] = useState<Restaurant>({ name: '' });
  const [addingAcc, setAddingAcc] = useState(false);
  const [addingRest, setAddingRest] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showAccForm, setShowAccForm] = useState(false);
  const [showRestForm, setShowRestForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', date: '', notes: '' });
  const [addingActivity, setAddingActivity] = useState(false);

  useEffect(() => {
    const fetchItinerary = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/useritineraries/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const itineraryData = res.data.data.itinerary;
        const status = itineraryData.status === 'planning' ? 'upcoming' : itineraryData.status;
        setItinerary({
          ...itineraryData,
          status,
          activities: itineraryData.activities || []
        });
      } catch {
        setError("Itinerary not found");
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if auth is initialized and we have the necessary data
    if (id && isInitialized) {
      if (isAuthenticated && token) {
        fetchItinerary();
      } else {
        setError("You must be signed in to view this itinerary.");
        setLoading(false);
      }
    }
  }, [id, isAuthenticated, token, isInitialized]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your itinerary...</p>
        </div>
      </div>
    );
  }
  
  if (error || !itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-4">
        <div className="bg-muted/30 p-6 rounded-full mb-6">
          <Info className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">Itinerary Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "The itinerary you are looking for does not exist or you do not have access."}</p>
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  // Date formatting (match ItineraryCard)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };
  const durationNum = Number(itinerary.duration);
  const durationLabel = durationNum === 1 ? '1 day' : `${durationNum} days`;

  // Helper function to check if actions are allowed
  const canModify = () => {
    return itinerary && itinerary.status !== 'completed';
  };

  // Add Activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify()) {
      toast.error('Cannot modify completed itineraries');
      return;
    }
    if (!activityForm.name) return toast.error('Activity name is required');
    if (activityForm.date) {
      const activityDate = new Date(activityForm.date);
      const startDate = new Date(itinerary.startDate);
      const endDate = new Date(itinerary.endDate);
      
      if (activityDate < startDate || activityDate > endDate) {
        toast.error('Activity date must be within the trip dates');
        return;
      }
    }
    setAddingActivity(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/useritineraries/${id}/activities`, activityForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItinerary(it => it ? { ...it, activities: res.data.data.activities } : it);
      setActivityForm({ name: '', date: '', notes: '' });
      setShowActivityForm(false);
      toast.success('Activity added');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add activity');
    } finally {
      setAddingActivity(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (idx: number) => {
    if (!canModify()) {
      toast.error('Cannot modify completed itineraries');
      return;
    }
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/useritineraries/${id}/activities/${idx}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItinerary(it => it ? { ...it, activities: (it.activities || []).filter((_, i) => i !== idx) } : it);
      toast.success('Activity deleted');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete activity');
    }
  };

  // Add Accommodation
  const handleAddAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify()) {
      toast.error('Cannot modify completed itineraries');
      return;
    }
    if (!accForm.name) return toast.error('Accommodation name is required');
    if (accForm.date) {
      const accDate = new Date(accForm.date);
      const startDate = new Date(itinerary.startDate);
      const endDate = new Date(itinerary.endDate);
      
      if (accDate < startDate || accDate > endDate) {
        toast.error('Accommodation date must be within the trip dates');
        return;
      }
    }
    setAddingAcc(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/useritineraries/${id}/accommodations`, accForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItinerary(it => it ? { ...it, accommodations: res.data.data.accommodations } : it);
      setAccForm({ name: '' });
      toast.success('Accommodation added');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add accommodation');
    } finally {
      setAddingAcc(false);
    }
  };

  // Delete Accommodation
  const handleDeleteAccommodation = async (idx: number) => {
    if (!canModify()) {
      toast.error('Cannot modify completed itineraries');
      return;
    }
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/useritineraries/${id}/accommodations/${idx}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItinerary(it => it ? { ...it, accommodations: (it.accommodations || []).filter((_, i) => i !== idx) } : it);
      toast.success('Accommodation deleted');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete accommodation');
    }
  };

  // Add Restaurant
  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify()) {
      toast.error('Cannot modify completed itineraries');
      return;
    }
    if (!restForm.name) return toast.error('Restaurant name is required');
    if (restForm.date) {
      const restDate = new Date(restForm.date);
      const startDate = new Date(itinerary.startDate);
      const endDate = new Date(itinerary.endDate);
      
      if (restDate < startDate || restDate > endDate) {
        toast.error('Restaurant date must be within the trip dates');
        return;
      }
    }
    setAddingRest(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/useritineraries/${id}/restaurants`, restForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItinerary(it => it ? { ...it, restaurants: res.data.data.restaurants } : it);
      setRestForm({ name: '' });
      toast.success('Restaurant added');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add restaurant');
    } finally {
      setAddingRest(false);
    }
  };

  // Delete Restaurant
  const handleDeleteRestaurant = async (idx: number) => {
    if (!canModify()) {
      toast.error('Cannot modify completed itineraries');
      return;
    }
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/useritineraries/${id}/restaurants/${idx}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItinerary(it => it ? { ...it, restaurants: (it.restaurants || []).filter((_, i) => i !== idx) } : it);
      toast.success('Restaurant deleted');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete restaurant');
    }
  };

  return (
    <div className="container py-6 md:py-10 space-y-6 md:space-y-10 mx-auto max-w-4xl px-4">
      {/* Hero/Summary Card */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-xl border border-primary/15">
        {/* Background with gradient and subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
        </div>
        
        {/* Content container */}
        <div className="relative z-10 p-6 md:p-8 lg:p-10">
          {/* Top metadata row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary backdrop-blur-sm">
              <ListChecks className="h-3 w-3 mr-1.5" />
              Itinerary Details
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center text-xs rounded-full px-3 py-1 font-medium capitalize shadow-sm ${
                itinerary.status === 'upcoming' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50' 
                  : itinerary.status === 'completed' 
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50'
              }`}>
                <span className={`mr-1.5 w-2 h-2 rounded-full ${
                  itinerary.status === 'upcoming' ? 'bg-blue-500' : 
                  itinerary.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                }`}></span>
                {itinerary.status}
              </span>
              
              {itinerary.progress !== undefined && (
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs rounded-full px-3 py-1 font-medium border border-emerald-200 shadow-sm dark:from-emerald-950/40 dark:to-teal-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
                  <div className="w-10 h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${itinerary.progress}%` }}
                    ></div>
                  </div>
                  {itinerary.progress}% planned
                </span>
              )}
            </div>
          </div>
          
          {/* Title and destination section */}
          <div className="space-y-4 mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-secondary tracking-tight">{itinerary.title}</h1>
            
            <div className="inline-flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-md shadow-sm border border-border/50 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{itinerary.destination}</span>
            </div>
          </div>
          
          {/* Key details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/40 shadow-sm p-3 sm:p-4 flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2.5 flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Travel Dates</div>
                <div className="font-medium">
                  {formatDate(itinerary.startDate)} — {formatDate(itinerary.endDate)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{durationLabel}</div>
              </div>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/40 shadow-sm p-3 sm:p-4 flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2.5 flex-shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Group Size</div>
                <div className="font-medium">{itinerary.travelers} {itinerary.travelers === 1 ? 'Traveler' : 'Travelers'}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {itinerary.travelers === 1 ? 'Solo trip' : 'Group trip'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Description section */}
          {itinerary.description && (
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40"></div>
              </div>
              <div className="relative flex justify-start">
                <span className="bg-gradient-to-r from-background/90 via-background/90 to-background/90 backdrop-blur-sm px-2 text-xs font-medium text-muted-foreground">
                  DESCRIPTION
                </span>
              </div>
              <p className="text-sm text-secondary/90 leading-relaxed mt-4 bg-background/60 backdrop-blur-sm p-4 rounded-lg border border-border/30 shadow-sm">
                {itinerary.description}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs Section */}
      <Card className="rounded-xl border shadow-md overflow-hidden">
        <Tabs defaultValue="activities" className="w-full">
          <div className="bg-muted/40 px-3 sm:px-6 pt-4 sm:pt-6 pb-0">
            <TabsList className="mb-0 w-full justify-start overflow-x-auto no-scrollbar p-1 bg-muted/70 backdrop-blur-sm rounded-lg">
              <TabsTrigger 
                value="activities" 
                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <ListChecks className="h-3 w-3 sm:h-4 sm:w-4" />Activities
              </TabsTrigger>
              <TabsTrigger 
                value="accommodations" 
                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <BedDouble className="h-3 w-3 sm:h-4 sm:w-4" />Accommodations
              </TabsTrigger>
              <TabsTrigger 
                value="restaurants" 
                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />Restaurants
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Contents */}
          <div className="bg-gradient-to-b from-muted/10 to-transparent">
            {/* Activities Tab */}
            <TabsContent value="activities" className="p-3 sm:p-6 pt-6 sm:pt-8 focus:outline-none">
              <div className="space-y-4 sm:space-y-6">
                {canModify() && (
                  <Button
                    variant={showActivityForm ? "secondary" : "outline"}
                    size="sm"
                    className="mb-2 sm:mb-4 shadow-sm w-full sm:w-auto"
                    onClick={() => setShowActivityForm((v) => !v)}
                  >
                    {showActivityForm ? (
                      <>Cancel</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Add Activity</>
                    )}
                  </Button>
                )}
                
                {showActivityForm && (
                  <Card className="bg-muted/30 border-dashed border-2 border-primary/30 mb-4 sm:mb-6 overflow-hidden shadow-sm">
                    <CardHeader className="pb-2 bg-primary/5 px-3 sm:px-6 py-3 sm:py-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Add Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
                      <form className="grid gap-3 sm:gap-4 md:grid-cols-2" onSubmit={handleAddActivity}>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="activity-name" className="text-xs sm:text-sm font-medium">Activity Name</Label>
                          <input
                            id="activity-name"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. City Tour"
                            value={activityForm.name}
                            onChange={e => setActivityForm(f => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="activity-date" className="text-xs sm:text-sm font-medium">Date</Label>
                          <input
                            id="activity-date"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            type="date"
                            value={activityForm.date}
                            onChange={e => setActivityForm(f => ({ ...f, date: e.target.value }))}
                            min={itinerary.startDate}
                            max={itinerary.endDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="activity-notes" className="text-xs sm:text-sm font-medium">Notes</Label>
                          <input
                            id="activity-notes"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Notes (optional)"
                            value={activityForm.notes}
                            onChange={e => setActivityForm(f => ({ ...f, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end md:col-span-2 pt-2">
                          <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={addingActivity}>
                            {addingActivity ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                            ) : (
                              <>Add Activity</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
                
                <div className="bg-muted/20 rounded-lg overflow-hidden border">
                  <div className="bg-muted/30 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center">
                    <h3 className="font-medium text-sm sm:text-base">Activities</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {(itinerary.activities?.length || 0)} total
                    </span>
                  </div>
                  <div className="p-3 sm:p-4">
                    {(itinerary.activities && itinerary.activities.length > 0) ? (
                      <ul className="space-y-3 divide-y divide-border">
                        {itinerary.activities.map((activity, idx) => (
                          <li key={activity._id || idx} className="pt-3 first:pt-0 pb-1 last:pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <span className="font-medium text-sm sm:text-md">{activity.name || 'Activity'}</span>
                                {activity.date && (
                                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                    {formatDate(activity.date)}
                                  </span>
                                )}
                                {activity.notes && (
                                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md">
                                    {activity.notes}
                                  </div>
                                )}
                              </div>
                              {canModify() && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteActivity(idx)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 self-end sm:self-start shrink-0 text-xs h-8"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-2">
                          <ListChecks className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm">No activities added yet.</p>
                        {canModify() && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setShowActivityForm(true)}
                            className="mt-2 h-8 text-xs"
                          >
                            Add your first activity
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Accommodations Tab */}
            <TabsContent value="accommodations" className="p-3 sm:p-6 pt-6 sm:pt-8 focus:outline-none">
              <div className="space-y-4 sm:space-y-6">
                {canModify() && (
                  <Button
                    variant={showAccForm ? "secondary" : "outline"}
                    size="sm"
                    className="mb-2 sm:mb-4 shadow-sm w-full sm:w-auto"
                    onClick={() => setShowAccForm((v) => !v)}
                  >
                    {showAccForm ? (
                      <>Cancel</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Add Accommodation</>
                    )}
                  </Button>
                )}
                
                {showAccForm && (
                  <Card className="bg-muted/30 border-dashed border-2 border-primary/30 mb-4 sm:mb-6 overflow-hidden shadow-sm">
                    <CardHeader className="pb-2 bg-primary/5 px-3 sm:px-6 py-3 sm:py-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Add Accommodation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
                      <form className="grid gap-3 sm:gap-4 md:grid-cols-2" onSubmit={handleAddAccommodation}>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="acc-name" className="text-xs sm:text-sm font-medium">Accommodation Name</Label>
                          <input
                            id="acc-name"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Hotel Name"
                            value={accForm.name}
                            onChange={e => setAccForm(f => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="acc-address" className="text-xs sm:text-sm font-medium">Address</Label>
                          <input
                            id="acc-address"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Address (optional)"
                            value={accForm.address || ''}
                            onChange={e => setAccForm(f => ({ ...f, address: e.target.value }))}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="acc-date" className="text-xs sm:text-sm font-medium">Date</Label>
                          <input
                            id="acc-date"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            type="date"
                            value={accForm.date || ''}
                            onChange={e => setAccForm(f => ({ ...f, date: e.target.value }))}
                            min={itinerary.startDate}
                            max={itinerary.endDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="acc-notes" className="text-xs sm:text-sm font-medium">Notes</Label>
                          <input
                            id="acc-notes"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Notes (optional)"
                            value={accForm.notes || ''}
                            onChange={e => setAccForm(f => ({ ...f, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end md:col-span-2 pt-2">
                          <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={addingAcc}>
                            {addingAcc ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                            ) : (
                              <>Add Accommodation</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
                
                <div className="bg-muted/20 rounded-lg overflow-hidden border">
                  <div className="bg-muted/30 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center">
                    <h3 className="font-medium text-sm sm:text-base">Accommodations</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {(itinerary.accommodations?.length || 0)} total
                    </span>
                  </div>
                  <div className="p-3 sm:p-4">
                    {(itinerary.accommodations && itinerary.accommodations.length > 0) ? (
                      <ul className="space-y-3 divide-y divide-border">
                        {itinerary.accommodations.map((acc, idx) => (
                          <li key={idx} className="pt-3 first:pt-0 pb-1 last:pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <span className="font-medium text-sm sm:text-md flex items-center gap-1">
                                  <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70" />
                                  {acc.name}
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {acc.address && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {acc.address}
                                    </span>
                                  )}
                                  {acc.date && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {formatDate(acc.date)}
                                    </span>
                                  )}
                                </div>
                                {acc.notes && (
                                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md">
                                    {acc.notes}
                                  </div>
                                )}
                              </div>
                              {canModify() && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteAccommodation(idx)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 self-end sm:self-start shrink-0 text-xs h-8"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-2">
                          <BedDouble className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm">No accommodations added yet.</p>
                        {canModify() && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setShowAccForm(true)}
                            className="mt-2 h-8 text-xs"
                          >
                            Add your first accommodation
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Restaurants Tab */}
            <TabsContent value="restaurants" className="p-3 sm:p-6 pt-6 sm:pt-8 focus:outline-none">
              <div className="space-y-4 sm:space-y-6">
                {canModify() && (
                  <Button
                    variant={showRestForm ? "secondary" : "outline"}
                    size="sm"
                    className="mb-2 sm:mb-4 shadow-sm w-full sm:w-auto"
                    onClick={() => setShowRestForm((v) => !v)}
                  >
                    {showRestForm ? (
                      <>Cancel</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Add Restaurant</>
                    )}
                  </Button>
                )}
                
                {showRestForm && (
                  <Card className="bg-muted/30 border-dashed border-2 border-primary/30 mb-4 sm:mb-6 overflow-hidden shadow-sm">
                    <CardHeader className="pb-2 bg-primary/5 px-3 sm:px-6 py-3 sm:py-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Add Restaurant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
                      <form className="grid gap-3 sm:gap-4 md:grid-cols-2" onSubmit={handleAddRestaurant}>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="rest-name" className="text-xs sm:text-sm font-medium">Restaurant Name</Label>
                          <input
                            id="rest-name"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Restaurant Name"
                            value={restForm.name}
                            onChange={e => setRestForm(f => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="rest-address" className="text-xs sm:text-sm font-medium">Address</Label>
                          <input
                            id="rest-address"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Address (optional)"
                            value={restForm.address || ''}
                            onChange={e => setRestForm(f => ({ ...f, address: e.target.value }))}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="rest-date" className="text-xs sm:text-sm font-medium">Date</Label>
                          <input
                            id="rest-date"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            type="date"
                            value={restForm.date || ''}
                            onChange={e => setRestForm(f => ({ ...f, date: e.target.value }))}
                            min={itinerary.startDate}
                            max={itinerary.endDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="rest-notes" className="text-xs sm:text-sm font-medium">Notes</Label>
                          <input
                            id="rest-notes"
                            className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Notes (optional)"
                            value={restForm.notes || ''}
                            onChange={e => setRestForm(f => ({ ...f, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end md:col-span-2 pt-2">
                          <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={addingRest}>
                            {addingRest ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                            ) : (
                              <>Add Restaurant</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
                
                <div className="bg-muted/20 rounded-lg overflow-hidden border">
                  <div className="bg-muted/30 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center">
                    <h3 className="font-medium text-sm sm:text-base">Restaurants</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {(itinerary.restaurants?.length || 0)} total
                    </span>
                  </div>
                  <div className="p-3 sm:p-4">
                    {(itinerary.restaurants && itinerary.restaurants.length > 0) ? (
                      <ul className="space-y-3 divide-y divide-border">
                        {itinerary.restaurants.map((rest, idx) => (
                          <li key={idx} className="pt-3 first:pt-0 pb-1 last:pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <span className="font-medium text-sm sm:text-md flex items-center gap-1">
                                  <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70" />
                                  {rest.name}
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {rest.address && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {rest.address}
                                    </span>
                                  )}
                                  {rest.date && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {formatDate(rest.date)}
                                    </span>
                                  )}
                                </div>
                                {rest.notes && (
                                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md">
                                    {rest.notes}
                                  </div>
                                )}
                              </div>
                              {canModify() && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteRestaurant(idx)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 self-end sm:self-start shrink-0 text-xs h-8"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-2">
                          <Utensils className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm">No restaurants added yet.</p>
                        {canModify() && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setShowRestForm(true)}
                            className="mt-2 h-8 text-xs"
                          >
                            Add your first restaurant
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
