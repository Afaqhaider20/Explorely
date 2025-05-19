'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Bed, Utensils, MapPin, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  type: 'accommodation' | 'restaurant' | 'attraction';
  name: string;
  notes?: string;
  date?: string;
  time?: string;
  location?: string;
  status: 'planned' | 'confirmed' | 'completed';
}

export default function ItineraryDetailsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);

  const addActivity = (type: Activity['type']) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: '',
      status: 'planned'
    };
    setActivities([...activities, newActivity]);
  };

  const deleteActivity = (id: string) => {
    setActivities(activities.filter(activity => activity.id !== id));
  };

  const updateActivityStatus = (id: string, status: Activity['status']) => {
    setActivities(activities.map(activity => 
      activity.id === id ? { ...activity, status } : activity
    ));
  };

  const getStatusBadge = (status: Activity['status']) => {
    const statusColors = {
      planned: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800"
    };
    return <Badge className={statusColors[status]}>{status}</Badge>;
  };

  const renderActivityCard = (activity: Activity, index: number) => (
    <Card key={activity.id} className="relative hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} #{index + 1}
          </h3>
          {activity.name && <p className="text-sm text-muted-foreground">{activity.name}</p>}
        </div>
        {getStatusBadge(activity.status)}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hotel/Place Name</Label>
            <Input placeholder="e.g., Hunza Serena Inn" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input placeholder="e.g., Karimabad, Hunza" />
          </div>
          <div className="space-y-2">
            <Label>Check-in Date</Label>
            <Input type="date" />
          </div>
          <div className="space-y-2">
            <Label>Check-out Date</Label>
            <Input type="date" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea placeholder="Add any special notes or requirements..." />
        </div>
      </CardContent>

      <CardFooter className="justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateActivityStatus(activity.id, 'confirmed')}
          disabled={activity.status === 'confirmed'}
        >
          Confirm
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateActivityStatus(activity.id, 'completed')}
          disabled={activity.status === 'completed'}
        >
          Complete
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteActivity(activity.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container py-8 mx-auto max-w-7xl px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-secondary">Northern Areas Adventure</h1>
        <p className="text-muted-foreground">Plan your activities, accommodations, and dining</p>
      </div>

      <Tabs defaultValue="stays" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stays">
            <Bed className="h-4 w-4 mr-2" />
            Stays
          </TabsTrigger>
          <TabsTrigger value="dining">
            <Utensils className="h-4 w-4 mr-2" />
            Dining
          </TabsTrigger>
          <TabsTrigger value="attractions">
            <MapPin className="h-4 w-4 mr-2" />
            Places to Visit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stays">
          <div className="space-y-4">
            <Button 
              onClick={() => addActivity('accommodation')} 
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Accommodation
            </Button>

            <div className="grid gap-4">
              {activities
                .filter(activity => activity.type === 'accommodation')
                .map((activity, index) => renderActivityCard(activity, index))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dining">
          <div className="space-y-4">
            <Button onClick={() => addActivity('restaurant')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Restaurant
            </Button>

            <div className="grid gap-4">
              {activities
                .filter(activity => activity.type === 'restaurant')
                .map((activity, index) => (
                  <Card key={activity.id} className="relative hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} #{index + 1}
                        </h3>
                        {activity.name && <p className="text-sm text-muted-foreground">{activity.name}</p>}
                      </div>
                      {getStatusBadge(activity.status)}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Restaurant Name</Label>
                          <Input placeholder="e.g., Cafe de Hunza" />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input placeholder="e.g., Aliabad, Hunza" />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input type="time" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cuisine Type</Label>
                        <Input placeholder="e.g., Local/Traditional, Continental" />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea placeholder="Add any special dishes to try or reservations needed..." />
                      </div>
                    </CardContent>

                    <CardFooter className="justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateActivityStatus(activity.id, 'confirmed')}
                        disabled={activity.status === 'confirmed'}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateActivityStatus(activity.id, 'completed')}
                        disabled={activity.status === 'completed'}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attractions">
          <div className="space-y-4">
            <Button onClick={() => addActivity('attraction')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Place to Visit
            </Button>

            <div className="grid gap-4">
              {activities
                .filter(activity => activity.type === 'attraction')
                .map((activity, index) => (
                  <Card key={activity.id} className="relative hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} #{index + 1}
                        </h3>
                        {activity.name && <p className="text-sm text-muted-foreground">{activity.name}</p>}
                      </div>
                      {getStatusBadge(activity.status)}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Place Name</Label>
                          <Input placeholder="e.g., Baltit Fort" />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input placeholder="e.g., Karimabad, Hunza" />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input type="time" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Input placeholder="e.g., Historical Site, Viewpoint, Trek" />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea placeholder="Add visiting tips, entry fees, or things to remember..." />
                      </div>
                    </CardContent>

                    <CardFooter className="justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateActivityStatus(activity.id, 'confirmed')}
                        disabled={activity.status === 'confirmed'}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateActivityStatus(activity.id, 'completed')}
                        disabled={activity.status === 'completed'}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
