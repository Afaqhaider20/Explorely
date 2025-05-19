export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  userId: string;
  communityId: string;
}

export interface Channel {
  id: string;
  name: string;
  communityId: string;
}

export interface Community {
  id: string;
  name: string;
  icon: string;
}

export const users: User[] = [
  { id: "1", name: "Alex Johnson", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "2", name: "Sam Smith", avatar: "https://i.pravatar.cc/150?img=2" },
  { id: "3", name: "Taylor Chen", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: "4", name: "Jordan Lee", avatar: "https://i.pravatar.cc/150?img=4" },
];

export const communities: Community[] = [
  {
    id: "1",
    name: "Travel Explorers",
    icon: "🌍",
  },
  {
    id: "2",
    name: "Photography Club",
    icon: "📸",
  },
  {
    id: "3",
    name: "Hiking Enthusiasts",
    icon: "🥾",
  },
];

export const messages: Message[] = [
  {
    id: "m1",
    content: "Hi everyone! Welcome to Travel Explorers!",
    timestamp: "2023-10-01T10:30:00Z",
    userId: "1",
    communityId: "1",
  },
  {
    id: "m2",
    content: "Has anyone been to Bali recently?",
    timestamp: "2023-10-01T10:32:00Z",
    userId: "2",
    communityId: "1",
  },
  {
    id: "m3",
    content: "I went last month! It was amazing.",
    timestamp: "2023-10-01T10:33:00Z",
    userId: "3",
    communityId: "1",
  },
  {
    id: "m4",
    content: "Check out this amazing beach I found in Thailand!",
    timestamp: "2023-10-01T11:00:00Z",
    userId: "4",
    communityId: "1",
  },
  {
    id: "m5",
    content: "Welcome to the Photography Club!",
    timestamp: "2023-10-02T09:00:00Z",
    userId: "1",
    communityId: "2",
  },
  {
    id: "m6",
    content: "I just got a new Canon R5, it's fantastic!",
    timestamp: "2023-10-02T09:05:00Z",
    userId: "2",
    communityId: "2",
  },
  {
    id: "m7",
    content: "Hello fellow hikers!",
    timestamp: "2023-10-03T08:00:00Z",
    userId: "3",
    communityId: "3",
  },
  {
    id: "m8",
    content: "The Pacific Crest Trail was life-changing.",
    timestamp: "2023-10-03T08:10:00Z",
    userId: "4",
    communityId: "3",
  },
];

