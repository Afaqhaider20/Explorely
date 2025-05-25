'use client';

import { CreateItineraryDialog } from "@/components/CreateItineraryDialog";
import { ItineraryCard } from "@/components/ItineraryCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Compass, Plus, Route, Package, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

interface Itinerary {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  travelers: number;
  status: 'upcoming' | 'planning' | 'completed';
  progress?: number;
  activities?: number[];
  description?: string;
  coverImage?: string;
}

export default function ItinerariesPage() {
  const [loading, setLoading] = useState(true);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchItineraries = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping fetch');
      setLoading(false);
      return;
    }

    console.log('Fetching itineraries with token:', token);
    setLoading(true);
    try {
      const res = await axios.get('/api/useritineraries/mine', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Itineraries response:', res.data);
      if (res.data?.data?.itineraries) {
        setItineraries(res.data.data.itineraries);
      } else {
        setItineraries([]);
      }
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
      
      if (error instanceof AxiosError) {
        console.log('Auth status:', error.response?.status);
        console.log('Auth headers:', error.response?.headers);
        console.log('Auth data:', error.response?.data);
        
        if (error.response?.status === 401) {
          toast.error('Please sign in to view your itineraries');
          router.push('/auth/signin');
        } else {
          toast.error(error.response?.data?.message || 'Failed to load itineraries');
        }
      } else {
        toast.error('Failed to load itineraries');
      }
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItineraries();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchItineraries]);

  const handleCreated = () => {
    fetchItineraries();
  };

  const getTabCount = (status: 'upcoming' | 'completed') => {
    if (status === 'upcoming') {
      return itineraries.filter(i => i.status === 'upcoming' || i.status === 'planning').length;
    }
    return itineraries.filter(i => i.status === status).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 md:py-10 flex-grow">
        {/* Improved Hero Section with better responsiveness */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent 
          rounded-2xl p-5 sm:p-7 md:p-8 mb-6 sm:mb-8 overflow-hidden shadow-sm">
          {/* Pattern background */}
          <div className="absolute inset-0 bg-opacity-10 mix-blend-overlay">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary mb-3">
                <Compass className="h-3 w-3 mr-1" />
                Plan Your Journey
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary mb-2 sm:mb-3">My Travel Itineraries</h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                Organize your trips, create detailed plans, and keep track of your adventures.
              </p>
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create New Itinerary
              </Button>
              <CreateItineraryDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={handleCreated} />
            </div>
            <div className="hidden md:flex justify-end">
              <Globe className="h-40 w-40 lg:h-48 lg:w-48 text-primary/15" strokeWidth={0.5} />
            </div>
          </div>
        </div>

        {/* Stats Section with improved spacing */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-7">
          <div className="bg-card rounded-xl p-3 sm:p-4 border shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Total Itineraries</p>
                <p className="text-lg font-bold">{loading ? '-' : itineraries.length}</p>
              </div>
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Route className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-3 sm:p-4 border shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Upcoming Trips</p>
                <p className="text-lg font-bold">{loading ? '-' : getTabCount('upcoming')}</p>
              </div>
              <div className="bg-blue-500/10 p-1.5 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-3 sm:p-4 border shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Completed</p>
                <p className="text-lg font-bold">{loading ? '-' : getTabCount('completed')}</p>
              </div>
              <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                <Package className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section with improved padding */}
        <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-5 md:p-6 flex-grow">
          <Tabs 
            defaultValue="upcoming" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'upcoming' | 'completed')}
            className="space-y-5 sm:space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h2 className="text-xl font-semibold">My Itineraries</h2>
              <TabsList className="flex gap-2 border-b border-muted-foreground/10 px-0 py-0 min-h-0 h-auto bg-transparent" style={{margin: 0}}>
                <TabsTrigger 
                  value="upcoming"
                  className={cn(
                    "relative px-3 py-1 text-sm font-medium text-muted-foreground rounded-none border-none bg-transparent transition-all",
                    "data-[state=active]:text-primary data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:bottom-0 data-[state=active]:after:w-full data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full"
                  )}
                >
                  Upcoming
                  {!loading && getTabCount('upcoming') > 0 && (
                    <span className="ml-1 text-xs text-primary font-semibold">{getTabCount('upcoming')}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className={cn(
                    "relative px-3 py-1 text-sm font-medium text-muted-foreground rounded-none border-none bg-transparent transition-all",
                    "data-[state=active]:text-primary data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:bottom-0 data-[state=active]:after:w-full data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full"
                  )}
                >
                  Completed
                  {!loading && getTabCount('completed') > 0 && (
                    <span className="ml-1 text-xs text-primary font-semibold">{getTabCount('completed')}</span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[300px] w-full" />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="upcoming" className="space-y-6 mt-0">
                  {itineraries.filter(i => i.status === 'upcoming' || i.status === 'planning').length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {itineraries
                        .filter(itinerary => itinerary.status === 'upcoming' || itinerary.status === 'planning')
                        .map((itinerary) => (
                          <ItineraryCard
                            key={itinerary._id}
                            id={itinerary._id}
                            title={itinerary.title}
                            destination={itinerary.destination}
                            startDate={itinerary.startDate}
                            endDate={itinerary.endDate}
                            duration={itinerary.duration}
                            travelers={itinerary.travelers}
                            status={itinerary.status === 'planning' ? 'upcoming' : itinerary.status}
                            progress={itinerary.progress}
                            activities={itinerary.activities}
                            description={itinerary.description}
                            coverImage={itinerary.coverImage || '/images/default-itinerary.jpg'}
                            colorStyle="primary"
                            actionLabel="View Details"
                            onDelete={fetchItineraries}
                          />
                        ))}
                    </div>
                  ) : (
                    <EmptyState 
                      title="No upcoming trips"
                      description="Plan your next adventure by creating a new itinerary."
                      icon={<Calendar className="h-12 w-12 text-muted-foreground/20" />}
                    />
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-6 mt-0">
                  {itineraries.filter(i => i.status === 'completed').length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {itineraries
                        .filter(itinerary => itinerary.status === 'completed')
                        .map((itinerary) => (
                          <ItineraryCard
                            key={itinerary._id}
                            id={itinerary._id}
                            title={itinerary.title}
                            destination={itinerary.destination}
                            startDate={itinerary.startDate}
                            endDate={itinerary.endDate}
                            duration={itinerary.duration}
                            travelers={itinerary.travelers}
                            status={itinerary.status}
                            progress={itinerary.progress}
                            activities={itinerary.activities}
                            description={itinerary.description}
                            coverImage={itinerary.coverImage || '/images/default-itinerary.jpg'}
                            colorStyle="emerald"
                            actionLabel="View Memories"
                            onDelete={fetchItineraries}
                          />
                        ))}
                    </div>
                  ) : (
                    <EmptyState 
                      title="No completed trips yet"
                      description="Your completed itineraries will appear here."
                      icon={<Package className="h-12 w-12 text-muted-foreground/20" />}
                    />
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode 
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">{description}</p>
    </div>
  );
}
