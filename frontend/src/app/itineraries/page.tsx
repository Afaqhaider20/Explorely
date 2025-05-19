'use client';

import { CreateItineraryDialog } from "@/components/CreateItineraryDialog";
import { ItineraryCard } from "@/components/ItineraryCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Compass, Map, Plus, Route, Package, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface CreateItineraryData {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
}

interface Itinerary {
  id: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  travelers: number;
  status: 'upcoming' | 'planning' | 'completed';
  coverImage: string;
  progress?: number;
  activities?: number;
  description?: string;
}

const demoItineraries: Itinerary[] = [
  {
    id: 1,
    title: "Northern Areas Adventure",
    destination: "Hunza Valley, Pakistan",
    startDate: "Mar 15, 2024",
    endDate: "Mar 22, 2024",
    duration: "8 days",
    travelers: 4,
    status: 'upcoming',
    coverImage: "/itineraries/hunza.jpg",
    progress: 80,
    activities: 12,
    description: "Explore the beautiful landscapes of Hunza Valley, visit Attabad Lake, and experience local culture.",
  },
  {
    id: 2,
    title: "Coastal Getaway",
    destination: "Gwadar, Pakistan",
    startDate: "Apr 5, 2024",
    endDate: "Apr 10, 2024",
    duration: "6 days",
    travelers: 2,
    status: 'upcoming',
    coverImage: "/itineraries/gwadar.jpg",
    progress: 60,
    activities: 8,
    description: "Relaxing beach trip with seafood dining and coastal exploration.",
  },
  {
    id: 3,
    title: "Historical Tour",
    destination: "Lahore, Pakistan",
    startDate: "Feb 10, 2024",
    endDate: "Feb 15, 2024",
    duration: "5 days",
    travelers: 3,
    status: 'completed',
    coverImage: "/itineraries/lahore.jpg",
    activities: 15,
    description: "Visit the historical sites of Lahore, including Badshahi Mosque and Lahore Fort.",
  },
  {
    id: 4,
    title: "Mountain Retreat",
    destination: "Murree, Pakistan",
    startDate: "Dec 20, 2023",
    endDate: "Dec 25, 2023",
    duration: "5 days",
    travelers: 5,
    status: 'completed',
    coverImage: "/itineraries/murree.jpg",
    activities: 7,
    description: "Winter vacation in the mountains with snow activities and warm food.",
  },
  {
    id: 5,
    title: "Desert Safari",
    destination: "Thar Desert, Pakistan",
    startDate: "Jun 8, 2024",
    endDate: "Jun 12, 2024",
    duration: "5 days",
    travelers: 6,
    status: 'planning',
    coverImage: "/itineraries/thar.jpg",
    progress: 30,
    activities: 4,
    description: "Experience the beauty of desert landscapes, camel rides, and cultural nights.",
  },
];

export default function ItinerariesPage() {
  const [loading, setLoading] = useState(true);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'planning' | 'completed'>('upcoming');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setItineraries(demoItineraries);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCreateItinerary = (data: CreateItineraryData) => {
    console.log('Creating itinerary:', data);
    // Add implementation for creating a new itinerary
  };

  const getTabCount = (status: 'upcoming' | 'planning' | 'completed') => {
    return itineraries.filter(i => i.status === status).length;
  };

  return (
    <div className="container py-8 space-y-8 mx-auto max-w-6xl px-4">
      {/* Improved Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent 
        rounded-2xl p-6 md:p-8 mb-8 overflow-hidden shadow-sm">
        {/* Replace Image with a subtle pattern background */}
        <div className="absolute inset-0 bg-opacity-10 mix-blend-overlay">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary mb-4">
            <Compass className="h-3 w-3 mr-1" />
            Plan Your Journey
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">My Travel Itineraries</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Organize your trips, create detailed plans, and keep track of your adventures.
          </p>
          <CreateItineraryDialog
            onSubmit={handleCreateItinerary}
            trigger={(
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                <Plus className="h-4 w-4" />
                Create New Itinerary
              </Button>
            )}
          />
        </div>
        <div className="hidden md:block absolute bottom-0 right-0 transform translate-y-1/4 translate-x-1/4">
          <Globe className="h-64 w-64 text-primary/10" strokeWidth={0.5} />
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Itineraries</p>
              <p className="text-2xl font-bold">{loading ? '-' : itineraries.length}</p>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Route className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Upcoming Trips</p>
              <p className="text-2xl font-bold">{loading ? '-' : getTabCount('upcoming')}</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Planning</p>
              <p className="text-2xl font-bold">{loading ? '-' : getTabCount('planning')}</p>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Map className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Completed</p>
              <p className="text-2xl font-bold">{loading ? '-' : getTabCount('completed')}</p>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Package className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <Tabs 
          defaultValue="upcoming" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'upcoming' | 'planning' | 'completed')}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">My Itineraries</h2>
            <TabsList className="bg-muted/50">
              <TabsTrigger 
                value="upcoming"
                className={cn(
                  "data-[state=active]:bg-primary data-[state=active]:text-white",
                  "transition-all"
                )}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming
                {!loading && getTabCount('upcoming') > 0 && (
                  <span className="ml-2 bg-primary-foreground/20 text-primary-foreground text-xs rounded-full px-2 py-0.5">
                    {getTabCount('upcoming')}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="planning"
                className={cn(
                  "data-[state=active]:bg-amber-500 data-[state=active]:text-white",
                  "transition-all"
                )}
              >
                <Map className="h-4 w-4 mr-2" />
                Planning
                {!loading && getTabCount('planning') > 0 && (
                  <span className="ml-2 bg-amber-100 text-amber-800 text-xs rounded-full px-2 py-0.5">
                    {getTabCount('planning')}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className={cn(
                  "data-[state=active]:bg-emerald-500 data-[state=active]:text-white",
                  "transition-all"
                )}
              >
                <Package className="h-4 w-4 mr-2" />
                Completed
                {!loading && getTabCount('completed') > 0 && (
                  <span className="ml-2 bg-emerald-100 text-emerald-800 text-xs rounded-full px-2 py-0.5">
                    {getTabCount('completed')}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border rounded-xl overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-3 pt-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="space-y-6 mt-0">
                {itineraries.filter(i => i.status === 'upcoming').length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {itineraries
                      .filter(itinerary => itinerary.status === 'upcoming')
                      .map((itinerary) => (
                        <ItineraryCard
                          key={itinerary.id}
                          {...itinerary}
                          onAddActivity={() => {
                            // Implement activity addition logic
                          }}
                          colorStyle="primary"
                          actionLabel="View Details"
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

              <TabsContent value="planning" className="space-y-6 mt-0">
                {itineraries.filter(i => i.status === 'planning').length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {itineraries
                      .filter(itinerary => itinerary.status === 'planning')
                      .map((itinerary) => (
                        <ItineraryCard
                          key={itinerary.id}
                          {...itinerary}
                          onAddActivity={() => {
                            // Implement activity addition logic
                          }}
                          colorStyle="amber"
                          actionLabel="Continue Planning"
                        />
                      ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No itineraries in planning"
                    description="Start planning your next adventure today."
                    icon={<Map className="h-12 w-12 text-muted-foreground/20" />}
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
                          key={itinerary.id}
                          {...itinerary}
                          onAddActivity={() => {
                            // Implement activity addition logic
                          }}
                          colorStyle="emerald"
                          actionLabel="View Memories"
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
      <CreateItineraryDialog
        onSubmit={(data: { 
          title: string; 
          destination: string; 
          startDate: Date; 
          endDate: Date; 
          travelers: number; 
        }) => console.log('Creating itinerary:', data)}
        trigger={(
          <Button variant="outline" className="mt-6">
            <Plus className="h-4 w-4 mr-2" />
            Create New Itinerary
          </Button>
        )}
      />
    </div>
  );
}
