"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Users, Calendar, Info, Plus, BedDouble, Utensils, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/AuthContext";
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from "next/navigation";
import { EditCommunityItineraryDialog } from '@/components/EditCommunityItineraryDialog';

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

interface JoinedUser {
  _id: string;
  username: string;
  avatar: string;
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
  joinedUsers?: JoinedUser[];
  author?: {
    _id: string;
    username: string;
    avatar: string;
  };
  community: string;
}

export default function CommunityItineraryDetailsPage() {
  const params = useParams();
  const communityId = params.communityId;
  const itineraryId = params.itineraryId;
  const searchParams = useSearchParams();
  const isOwner = searchParams.get('isOwner') === 'true';
  const { token, user } = useAuth();
  const router = useRouter();

  console.log('URL Parameters:', { communityId, itineraryId, params });

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [accForm, setAccForm] = useState<Accommodation>({ name: '' });
  const [restForm, setRestForm] = useState<Restaurant>({ name: '' });
  const [addingAcc, setAddingAcc] = useState(false);
  const [addingRest, setAddingRest] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showAccForm, setShowAccForm] = useState(false);
  const [showRestForm, setShowRestForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', date: '', notes: '' });
  const [addingActivity, setAddingActivity] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Remove demo data and use actual data from itinerary
  const joinedUsers: JoinedUser[] = itinerary?.joinedUsers || [];

  const fetchItinerary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community-itineraries/${communityId}/${itineraryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch itinerary');
      }
      
      const data = await res.json();
      setItinerary(data.data);
      
      // Check if current user has joined using the user from useAuth
      if (data.data.joinedUsers && user) {
        const hasUserJoined = data.data.joinedUsers.some((joinedUser: JoinedUser) => joinedUser._id === user._id);
        setHasJoined(hasUserJoined);
      }
    } catch (err) {
      console.error('Error fetching itinerary:', err);
      setError("Itinerary not found");
    } finally {
      setLoading(false);
    }
  }, [communityId, itineraryId, token, user]);

  useEffect(() => {
    if (communityId && itineraryId) fetchItinerary();
  }, [communityId, itineraryId, fetchItinerary]);

  // Add Activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.name) return toast.error('Activity name is required');
    if (activityForm.date) {
      const activityDate = new Date(activityForm.date);
      const startDate = new Date(itinerary!.startDate);
      const endDate = new Date(itinerary!.endDate);
      
      if (activityDate < startDate || activityDate > endDate) {
        toast.error('Activity date must be within the trip dates');
        return;
      }
    }
    setAddingActivity(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community-itineraries/${communityId}/${itineraryId}/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityForm)
      });

      if (!res.ok) {
        throw new Error('Failed to add activity');
      }

      const data = await res.json();
      setItinerary(data.data);
      toast.success('Activity added');
      setActivityForm({ name: '', date: '', notes: '' });
      setShowActivityForm(false);
    } catch (err) {
      console.error('Failed to add activity:', err);
      toast.error('Failed to add activity');
    } finally {
      setAddingActivity(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (idx: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community-itineraries/${communityId}/${itineraryId}/activities/${idx}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete activity');
      }

      const data = await res.json();
      setItinerary(data.data);
      toast.success('Activity deleted');
    } catch (err) {
      console.error('Failed to delete activity:', err);
      toast.error('Failed to delete activity');
    }
  };

  // Add Accommodation
  const handleAddAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accForm.name) return toast.error('Accommodation name is required');
    if (accForm.date) {
      const accDate = new Date(accForm.date);
      const startDate = new Date(itinerary!.startDate);
      const endDate = new Date(itinerary!.endDate);
      
      if (accDate < startDate || accDate > endDate) {
        toast.error('Accommodation date must be within the trip dates');
        return;
      }
    }
    setAddingAcc(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community-itineraries/${communityId}/${itineraryId}/accommodations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accForm)
      });

      if (!res.ok) {
        throw new Error('Failed to add accommodation');
      }

      const data = await res.json();
      setItinerary(data.data);
      toast.success('Accommodation added');
      setAccForm({ name: '' });
      setShowAccForm(false);
    } catch (err) {
      console.error('Failed to add accommodation:', err);
      toast.error('Failed to add accommodation');
    } finally {
      setAddingAcc(false);
    }
  };

  // Delete Accommodation
  const handleDeleteAccommodation = async (idx: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community-itineraries/${communityId}/${itineraryId}/accommodations/${idx}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete accommodation');
      }

      const data = await res.json();
      setItinerary(data.data);
      toast.success('Accommodation deleted');
    } catch (err) {
      console.error('Failed to delete accommodation:', err);
      toast.error('Failed to delete accommodation');
    }
  };

  // Add Restaurant
  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restForm.name) return toast.error('Restaurant name is required');
    if (restForm.date) {
      const restDate = new Date(restForm.date);
      const startDate = new Date(itinerary!.startDate);
      const endDate = new Date(itinerary!.endDate);
      
      if (restDate < startDate || restDate > endDate) {
        toast.error('Restaurant date must be within the trip dates');
        return;
      }
    }
    setAddingRest(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community-itineraries/${communityId}/${itineraryId}/restaurants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(restForm)
      });

      if (!res.ok) {
        throw new Error('Failed to add restaurant');
      }

      const data = await res.json();
      setItinerary(data.data);
      toast.success('Restaurant added');
      setRestForm({ name: '' });
      setShowRestForm(false);
    } catch (err) {
      console.error('Failed to add restaurant:', err);
      toast.error('Failed to add restaurant');
    } finally {
      setAddingRest(false);
    }
  };

  // Delete Restaurant
  const handleDeleteRestaurant = async (idx: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community-itineraries/${communityId}/${itineraryId}/restaurants/${idx}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete restaurant');
      }

      const data = await res.json();
      setItinerary(data.data);
      toast.success('Restaurant deleted');
    } catch (err) {
      console.error('Failed to delete restaurant:', err);
      toast.error('Failed to delete restaurant');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Info className="h-10 w-10 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Itinerary Not Found</h2>
        <p className="text-muted-foreground">{error || "The itinerary you are looking for does not exist or you do not have access."}</p>
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

  // Add delete handler
  const handleDelete = async () => {
    if (!token || !isOwner || !itinerary) {
      console.log('Delete prerequisites not met:', { token: !!token, isOwner, hasItinerary: !!itinerary });
      return;
    }

    if (!confirm('Are you sure you want to delete this itinerary?')) {
      return;
    }
    
    try {
      console.log('Delete request details:', {
        url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${itinerary.community}/itineraries/${itineraryId}`,
        token: token.substring(0, 10) + '...',
        communityId: itinerary.community,
        itineraryId,
        authorId: itinerary.author?._id
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${itinerary.community}/itineraries/${itineraryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      console.log('Delete response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('Delete response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete itinerary');
      }

      toast.success('Itinerary deleted successfully');
      router.push(`/communities/${itinerary.community}`);
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete itinerary');
    }
  };

  // Add join handler
  const handleJoin = async () => {
    if (!token || !user) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/communities/${communityId}/itineraries/${itineraryId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to join itinerary');
      }

      // Update local state
      setHasJoined(true);
      if (itinerary) {
        setItinerary({
          ...itinerary,
          joinedUsers: [...(itinerary.joinedUsers || []), {
            _id: user._id,
            username: user.username,
            avatar: user.avatar || ''
          }]
        });
      }
      toast.success('Successfully joined the itinerary!');
    } catch (error) {
      console.error('Error joining itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join itinerary');
    }
  };

  // Add leave handler
  const handleLeave = async () => {
    if (!token || !user) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/communities/${communityId}/itineraries/${itineraryId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to leave itinerary');
      }

      // Update local state
      setHasJoined(false);
      if (itinerary) {
        setItinerary({
          ...itinerary,
          joinedUsers: (itinerary.joinedUsers || []).filter(joinedUser => joinedUser._id !== user._id)
        });
      }
      toast.success('Successfully left the itinerary!');
    } catch (error) {
      console.error('Error leaving itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave itinerary');
    }
  };

  return (
    <div className="container py-8 space-y-8 mx-auto max-w-3xl px-4">
      {/* Hero/Summary Card */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 md:p-8 mb-8 overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-opacity-10 mix-blend-overlay">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary mb-4">
            <ListChecks className="h-3 w-3 mr-1" />
            Community Itinerary Details
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">{itinerary.title}</h1>
          <div className="flex flex-wrap gap-4 items-center text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{itinerary.destination}</span>
            <Separator orientation="vertical" className="h-5" />
            <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />
              {formatDate(itinerary.startDate)}
              <span className="mx-1 text-muted-foreground">→</span>
              {formatDate(itinerary.endDate)}
            </span>
            <Separator orientation="vertical" className="h-5" />
            <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{itinerary.travelers} travelers</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block bg-primary/10 text-primary text-xs rounded-full px-3 py-1 font-medium capitalize">{itinerary.status}</span>
            <span className="inline-block bg-muted text-xs rounded-full px-3 py-1 font-medium">{durationLabel}</span>
            {itinerary.progress !== undefined && (
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs rounded-full px-3 py-1 font-medium">{itinerary.progress}% planned</span>
            )}
          </div>
          {itinerary.description && (
            <p className="text-muted-foreground text-sm max-w-2xl mt-2">{itinerary.description}</p>
          )}
          
          {/* Add owner/non-owner actions */}
          <div className="flex items-center gap-3 mt-6">
            {isOwner ? (
              <>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Itinerary
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                  Edit Details
                </Button>
              </>
            ) : (
              hasJoined ? (
                <Button variant="destructive" onClick={handleLeave}>
                  Leave Itinerary
                </Button>
              ) : (
                <Button onClick={handleJoin}>
                  Join Itinerary
                </Button>
              )
            )}
          </div>
        </div>
      </div>
      {/* Tabs Section */}
      <Card className="rounded-xl border shadow-md overflow-hidden">
        <Tabs defaultValue="activities" className="w-full">
          <div className="bg-muted/40 px-6 pt-6 pb-0">
            <TabsList className="mb-0 w-full md:w-auto justify-start overflow-x-auto no-scrollbar p-1 bg-muted/70 backdrop-blur-sm">
              <TabsTrigger 
                value="activities" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <ListChecks className="h-4 w-4" />Activities
              </TabsTrigger>
              <TabsTrigger 
                value="accommodations" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <BedDouble className="h-4 w-4" />Accommodations
              </TabsTrigger>
              <TabsTrigger 
                value="restaurants" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Utensils className="h-4 w-4" />Restaurants
              </TabsTrigger>
              <TabsTrigger 
                value="joined-users" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />Joined Users
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Contents */}
          <div className="bg-gradient-to-b from-muted/10 to-transparent">
            {/* Activities Tab */}
            <TabsContent value="activities" className="p-6 pt-8 focus:outline-none">
              <div className="space-y-6">
                {isOwner && (
                  <Button
                    variant={showActivityForm ? "secondary" : "outline"}
                    className="mb-4 shadow-sm"
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
                  <Card className="bg-muted/30 border-dashed border-2 border-primary/30 mb-6 overflow-hidden shadow-sm">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Add Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddActivity}>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="activity-name" className="text-sm font-medium">Activity Name</Label>
                          <input
                            id="activity-name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. City Tour"
                            value={activityForm.name}
                            onChange={e => setActivityForm(f => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="activity-date" className="text-sm font-medium">Date</Label>
                          <input
                            id="activity-date"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            type="date"
                            value={activityForm.date}
                            onChange={e => setActivityForm(f => ({ ...f, date: e.target.value }))}
                            min={itinerary.startDate}
                            max={itinerary.endDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="activity-notes" className="text-sm font-medium">Notes</Label>
                          <input
                            id="activity-notes"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Notes (optional)"
                            value={activityForm.notes}
                            onChange={e => setActivityForm(f => ({ ...f, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end md:col-span-2 pt-2">
                          <Button type="submit" disabled={addingActivity}>
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
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-medium">Activities</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {(itinerary.activities?.length || 0)} total
                    </span>
                  </div>
                  <div className="p-4">
                    {(itinerary.activities && itinerary.activities.length > 0) ? (
                      <ul className="space-y-3 divide-y divide-border">
                        {itinerary.activities.map((activity, idx) => (
                          <li key={activity._id || idx} className="pt-3 first:pt-0 pb-1 last:pb-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-medium text-md">{activity.name || 'Activity'}</span>
                                {activity.date && (
                                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                    {formatDate(activity.date)}
                                  </span>
                                )}
                                {activity.notes && (
                                  <div className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md">
                                    {activity.notes}
                                  </div>
                                )}
                              </div>
                              {isOwner && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteActivity(idx)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-2">
                          <ListChecks className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <p>No activities added yet.</p>
                        {isOwner && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setShowActivityForm(true)}
                            className="mt-2"
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
            <TabsContent value="accommodations" className="p-6 pt-8 focus:outline-none">
              <div className="space-y-6">
                {isOwner && (
                  <Button
                    variant={showAccForm ? "secondary" : "outline"}
                    className="mb-4 shadow-sm"
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
                  <Card className="bg-muted/30 border-dashed border-2 border-primary/30 mb-6 overflow-hidden shadow-sm">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Add Accommodation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddAccommodation}>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="acc-name" className="text-sm font-medium">Accommodation Name</Label>
                          <input
                            id="acc-name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Hotel Name"
                            value={accForm.name}
                            onChange={e => setAccForm(f => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="acc-address" className="text-sm font-medium">Address</Label>
                          <input
                            id="acc-address"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Address (optional)"
                            value={accForm.address || ''}
                            onChange={e => setAccForm(f => ({ ...f, address: e.target.value }))}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="acc-date" className="text-sm font-medium">Date</Label>
                          <input
                            id="acc-date"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            type="date"
                            value={accForm.date || ''}
                            onChange={e => setAccForm(f => ({ ...f, date: e.target.value }))}
                            min={itinerary.startDate}
                            max={itinerary.endDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="acc-notes" className="text-sm font-medium">Notes</Label>
                          <input
                            id="acc-notes"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Notes (optional)"
                            value={accForm.notes || ''}
                            onChange={e => setAccForm(f => ({ ...f, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end md:col-span-2 pt-2">
                          <Button type="submit" disabled={addingAcc}>
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
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-medium">Accommodations</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {(itinerary.accommodations?.length || 0)} total
                    </span>
                  </div>
                  <div className="p-4">
                    {(itinerary.accommodations && itinerary.accommodations.length > 0) ? (
                      <ul className="space-y-3 divide-y divide-border">
                        {itinerary.accommodations.map((acc, idx) => (
                          <li key={idx} className="pt-3 first:pt-0 pb-1 last:pb-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-medium text-md flex items-center gap-1">
                                  <BedDouble className="h-4 w-4 text-primary/70" />
                                  {acc.name}
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {acc.address && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {acc.address}
                                    </span>
                                  )}
                                  {acc.date && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" /> {formatDate(acc.date)}
                                    </span>
                                  )}
                                </div>
                                {acc.notes && (
                                  <div className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md">
                                    {acc.notes}
                                  </div>
                                )}
                              </div>
                              {isOwner && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteAccommodation(idx)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-2">
                          <BedDouble className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <p>No accommodations added yet.</p>
                        {isOwner && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setShowAccForm(true)}
                            className="mt-2"
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
            <TabsContent value="restaurants" className="p-6 pt-8 focus:outline-none">
              <div className="space-y-6">
                {isOwner && (
                  <Button
                    variant={showRestForm ? "secondary" : "outline"}
                    className="mb-4 shadow-sm"
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
                  <Card className="bg-muted/30 border-dashed border-2 border-primary/30 mb-6 overflow-hidden shadow-sm">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Add Restaurant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddRestaurant}>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="rest-name" className="text-sm font-medium">Restaurant Name</Label>
                          <input
                            id="rest-name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Restaurant Name"
                            value={restForm.name}
                            onChange={e => setRestForm(f => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="rest-address" className="text-sm font-medium">Address</Label>
                          <input
                            id="rest-address"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Address (optional)"
                            value={restForm.address || ''}
                            onChange={e => setRestForm(f => ({ ...f, address: e.target.value }))}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="rest-date" className="text-sm font-medium">Date</Label>
                          <input
                            id="rest-date"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            type="date"
                            value={restForm.date || ''}
                            onChange={e => setRestForm(f => ({ ...f, date: e.target.value }))}
                            min={itinerary.startDate}
                            max={itinerary.endDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <Label htmlFor="rest-notes" className="text-sm font-medium">Notes</Label>
                          <input
                            id="rest-notes"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Notes (optional)"
                            value={restForm.notes || ''}
                            onChange={e => setRestForm(f => ({ ...f, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end md:col-span-2 pt-2">
                          <Button type="submit" disabled={addingRest}>
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
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-medium">Restaurants</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {(itinerary.restaurants?.length || 0)} total
                    </span>
                  </div>
                  <div className="p-4">
                    {(itinerary.restaurants && itinerary.restaurants.length > 0) ? (
                      <ul className="space-y-3 divide-y divide-border">
                        {itinerary.restaurants.map((rest, idx) => (
                          <li key={idx} className="pt-3 first:pt-0 pb-1 last:pb-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-medium text-md flex items-center gap-1">
                                  <Utensils className="h-4 w-4 text-primary/70" />
                                  {rest.name}
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {rest.address && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {rest.address}
                                    </span>
                                  )}
                                  {rest.date && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" /> {formatDate(rest.date)}
                                    </span>
                                  )}
                                </div>
                                {rest.notes && (
                                  <div className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md">
                                    {rest.notes}
                                  </div>
                                )}
                              </div>
                              {isOwner && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteRestaurant(idx)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-2">
                          <Utensils className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <p>No restaurants added yet.</p>
                        {isOwner && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setShowRestForm(true)}
                            className="mt-2"
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

            {/* Joined Users Tab */}
            <TabsContent value="joined-users" className="p-6 pt-8 focus:outline-none">
              <div className="space-y-6">
                <div className="bg-muted/20 rounded-lg overflow-hidden border">
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-medium">Joined Users</h3>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {joinedUsers.length} total
                    </span>
                  </div>
                  <div className="p-4">
                    {joinedUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <div className="flex justify-center mb-2">
                          <Users className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <p>No users have joined this itinerary yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {joinedUsers.map(user => (
                          <Card key={user._id} className="flex items-center gap-4 p-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar} alt={user.username} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-xs text-muted-foreground">Joined recently</div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Add Edit Dialog */}
      {editDialogOpen && (
        <EditCommunityItineraryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onCreated={(updatedItinerary: Itinerary) => {
            setItinerary(updatedItinerary);
          }}
          communityId={communityId as string}
          itinerary={itinerary}
        />
      )}
    </div>
  );
} 