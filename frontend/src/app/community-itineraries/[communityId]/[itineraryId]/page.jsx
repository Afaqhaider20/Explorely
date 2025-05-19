'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollText, Users, Calendar, Clock, MapPin, ChefHat, Home, Landmark, Plus, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CommunityItineraryPage({ params }) {
  // Use React.use() to unwrap the params Promise
  const resolvedParams = use(params);
  const { communityId, itineraryId } = resolvedParams;
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newPlace, setNewPlace] = useState('');
  const [placeCategory, setPlaceCategory] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const { token } = useAuth();

  // Demo data based on the itinerary ID
  const getDemoItinerary = () => {
    const demoItineraries = {
      'itin_001': {
        _id: "itin_001",
        title: "Weekend in Paris",
        description: "A perfect weekend getaway exploring the City of Light with visits to iconic landmarks and hidden gems that make Paris magical.",
        destinations: ["Paris", "Versailles"],
        duration: 3,
        author: {
          _id: "user_001",
          username: "travelmaster",
          avatar: "/avatars/user-01.jpg"
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        coverImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000",
        places: {
          eat: ["Le Bistrot Parisien", "Café de Flore", "L'Avant Comptoir", "Angelina", "Le Jules Verne"],
          stay: ["Hotel de Paris", "Le Marais Apartment", "Saint Germain Boutique Hotel"],
          visit: ["Eiffel Tower", "Louvre Museum", "Notre Dame", "Montmartre", "Versailles Palace", "Seine River Cruise"]
        }
      },
      'itin_002': {
        _id: "itin_002",
        title: "Tokyo Adventure",
        description: "Exploring the vibrant neighborhoods and traditions of Tokyo along with a day trip to the historic city of Kyoto.",
        destinations: ["Tokyo", "Kyoto"],
        duration: 7,
        author: {
          _id: "user_002",
          username: "wanderlust",
          avatar: "/avatars/user-02.jpg"
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        coverImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000",
        places: {
          eat: ["Sushi Dai", "Ichiran Ramen", "Tsukiji Market", "Gonpachi", "Yakitori Alley"],
          stay: ["Shinjuku Ryokan", "Tokyo Bay Hotel", "Traditional Kyoto Guesthouse"],
          visit: ["Shibuya Crossing", "Tokyo Tower", "Senso-ji Temple", "Meiji Shrine", "Fushimi Inari Shrine", "Akihabara", "TeamLab Borderless"]
        }
      },
      'itin_003': {
        _id: "itin_003",
        title: "Italian Countryside",
        description: "Discover the charming villages and vineyards of Tuscany with stops in Florence, Siena, and San Gimignano.",
        destinations: ["Florence", "Siena", "San Gimignano"],
        duration: 5,
        author: {
          _id: "user_003",
          username: "travel_lover",
          avatar: "/avatars/user-03.jpg"
        },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        coverImage: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1000",
        places: {
          eat: ["Trattoria Mario", "Osteria del Cinghiale Bianco", "Gelateria La Carraia", "Farmhouse dinner in Chianti", "La Grotta in Siena"],
          stay: ["Tuscan Villa", "Agriturismo Il Casale", "Florence Historic Center Hotel"],
          visit: ["Uffizi Gallery", "Ponte Vecchio", "Duomo di Siena", "Chianti Vineyards", "San Gimignano Towers", "Piazzale Michelangelo"]
        }
      }
    };

    return demoItineraries[itineraryId] || createGenericItinerary();
  };

  // Create a generic itinerary for unknown IDs
  const createGenericItinerary = () => {
    return {
      _id: itineraryId,
      title: "Exploring New Destinations",
      description: "A custom travel itinerary for exploring exciting destinations with friends and family.",
      destinations: ["Various Destinations"],
      duration: 4,
      author: {
        _id: "user_generic",
        username: "explorely_user",
        avatar: "/avatars/default.jpg"
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      coverImage: "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000",
      places: {
        eat: ["Local Restaurant", "Beachside Café", "Downtown Bistro"],
        stay: ["Boutique Hotel", "Vacation Rental"],
        visit: ["City Center", "Historic District", "National Park", "Local Market"]
      }
    };
  };

  const fetchItinerary = useCallback(async () => {
    setLoading(true);
    try {
      // For demo purposes, we'll use the local data instead of an API call
      const demoData = getDemoItinerary();
      setTimeout(() => {
        setItinerary(demoData);
        setLoading(false);
      }, 800); // Simulated API delay
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      toast.error('Failed to load itinerary details');
      setLoading(false);
    }
  }, [itineraryId]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  // Functions to manage places
  const addPlace = (category) => {
    if (!newPlace.trim()) {
      toast.error('Please enter a place name');
      return;
    }

    const updatedItinerary = { ...itinerary };
    if (!updatedItinerary.places[category]) {
      updatedItinerary.places[category] = [];
    }
    
    updatedItinerary.places[category].push(newPlace);
    setItinerary(updatedItinerary);
    setNewPlace('');
    setOpenDialog(false);
    toast.success(`Added ${newPlace} to ${category}!`);
  };

  const removePlace = (category, index) => {
    const updatedItinerary = { ...itinerary };
    updatedItinerary.places[category].splice(index, 1);
    setItinerary(updatedItinerary);
    toast.success('Item removed!');
  };

  const editPlace = (category, index, value) => {
    const updatedItinerary = { ...itinerary };
    updatedItinerary.places[category][index] = value;
    setItinerary(updatedItinerary);
    setEditItem(null);
    setEditMode(false);
    toast.success('Item updated!');
  };

  const handleOpenDialog = (category) => {
    setPlaceCategory(category);
    setNewPlace('');
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-10 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-2">Itinerary Not Found</h2>
        <p className="text-muted-foreground">
          This itinerary doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="relative h-64 rounded-xl overflow-hidden mb-6">
        {itinerary.coverImage ? (
          <Image
            src={itinerary.coverImage}
            alt={itinerary.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
            <MapPin className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="outline" className="bg-primary/10">
            {itinerary.destinations?.[0] || 'Destination'}
          </Badge>
          <Badge variant="outline" className="bg-muted">
            {itinerary.duration} {itinerary.duration === 1 ? 'day' : 'days'}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold mb-4">{itinerary.title}</h1>

        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-10 w-10">
            <AvatarImage src={itinerary.author?.avatar} alt={itinerary.author?.username} />
            <AvatarFallback>{itinerary.author?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{itinerary.author?.username}</div>
            <div className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(parseISO(itinerary.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-lg">{itinerary.description}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex gap-3 items-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Duration</div>
                <div className="text-lg">{itinerary.duration} days</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex gap-3 items-center">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Destinations</div>
                <div className="text-lg">{itinerary.destinations?.join(', ')}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex gap-3 items-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Last Updated</div>
                <div className="text-lg">{formatDistanceToNow(parseISO(itinerary.updatedAt), { addSuffix: true })}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Place Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a {placeCategory === 'visit' ? 'Place to Visit' : 
                            placeCategory === 'eat' ? 'Place to Eat' : 
                            'Place to Stay'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="place-name">Name</Label>
              <Input
                id="place-name"
                value={newPlace}
                onChange={(e) => setNewPlace(e.target.value)}
                placeholder={`Enter a ${placeCategory === 'visit' ? 'place to visit' : 
                            placeCategory === 'eat' ? 'restaurant or café' : 
                            'hotel or accommodation'}`}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={() => addPlace(placeCategory)}>Add Place</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="places" className="mt-8">
          <TabsList>
            <TabsTrigger value="places">Places to Visit</TabsTrigger>
            <TabsTrigger value="eat">Places to Eat</TabsTrigger>
            <TabsTrigger value="stay">Places to Stay</TabsTrigger>
          </TabsList>

          <TabsContent value="places">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-xl font-medium">Places to Visit</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog('visit')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Place
                  </Button>
                </div>
                <ul className="space-y-3">
                  {itinerary.places?.visit?.map((place, index) => (
                    <li key={index} className="flex items-center gap-3 group">
                      {editMode && editItem === `visit-${index}` ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={place}
                            onChange={(e) => {
                              const updatedItinerary = { ...itinerary };
                              updatedItinerary.places.visit[index] = e.target.value;
                              setItinerary(updatedItinerary);
                            }}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => editPlace('visit', index, place)}>Save</Button>
                        </div>
                      ) : (
                        <>
                          <Badge className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                          <span className="flex-1">{place}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => { setEditMode(true); setEditItem(`visit-${index}`); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => removePlace('visit', index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                  {!itinerary.places?.visit?.length && (
                    <p className="text-muted-foreground">No places to visit added yet.</p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eat">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-xl font-medium">Places to Eat</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog('eat')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Restaurant
                  </Button>
                </div>
                <ul className="space-y-3">
                  {itinerary.places?.eat?.map((place, index) => (
                    <li key={index} className="flex items-center gap-3 group">
                      {editMode && editItem === `eat-${index}` ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={place}
                            onChange={(e) => {
                              const updatedItinerary = { ...itinerary };
                              updatedItinerary.places.eat[index] = e.target.value;
                              setItinerary(updatedItinerary);
                            }}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => editPlace('eat', index, place)}>Save</Button>
                        </div>
                      ) : (
                        <>
                          <Badge className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                          <span className="flex-1">{place}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => { setEditMode(true); setEditItem(`eat-${index}`); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => removePlace('eat', index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                  {!itinerary.places?.eat?.length && (
                    <p className="text-muted-foreground">No places to eat added yet.</p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stay">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-xl font-medium">Places to Stay</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog('stay')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Accommodation
                  </Button>
                </div>
                <ul className="space-y-3">
                  {itinerary.places?.stay?.map((place, index) => (
                    <li key={index} className="flex items-center gap-3 group">
                      {editMode && editItem === `stay-${index}` ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={place}
                            onChange={(e) => {
                              const updatedItinerary = { ...itinerary };
                              updatedItinerary.places.stay[index] = e.target.value;
                              setItinerary(updatedItinerary);
                            }}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => editPlace('stay', index, place)}>Save</Button>
                        </div>
                      ) : (
                        <>
                          <Badge className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                          <span className="flex-1">{place}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => { setEditMode(true); setEditItem(`stay-${index}`); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => removePlace('stay', index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                  {!itinerary.places?.stay?.length && (
                    <p className="text-muted-foreground">No places to stay added yet.</p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}