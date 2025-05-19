export interface Post {
  id: string;
  title: string;
  content: string;
  image?: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  communityId: string;
  upvotes: number;
  comments: number;
  createdAt: string;
  timeAgo: string;
}

export const posts: Post[] = [
  {
    id: "1",
    title: "Getting Started with Next.js 14",
    content: "Next.js 14 introduces several groundbreaking features that revolutionize the way we build web applications...",
    image: "https://picsum.photos/800/400",
    author: {
      id: "u1",
      name: "Sarah Wilson",
      image: "/avatars/sarah.jpg"
    },
    communityId: "programming",
    upvotes: 156,
    comments: 23,
    createdAt: "2024-02-19T10:00:00Z",
    timeAgo: "2 hours ago"
  },
  {
    id: "2",
    title: "The Art of Street Photography",
    content: "Street photography is about capturing genuine moments in public spaces...",
    image: "https://picsum.photos/800/401",
    author: {
      id: "u2",
      name: "Mike Chen",
      image: "/avatars/mike.jpg"
    },
    communityId: "photography",
    upvotes: 89,
    comments: 12,
    createdAt: "2024-02-19T09:00:00Z",
    timeAgo: "3 hours ago"
  },
  {
    id: "3",
    title: "Must-Visit Food Streets in Lahore",
    content: "A comprehensive guide to the best food streets in Lahore. From the bustling Food Street in Old Lahore to the modern MM Alam Road, here's where you can find the most authentic Pakistani cuisine...",
    image: "https://picsum.photos/800/402",
    author: {
      id: "u3",
      name: "FoodieExplorer",
      image: "/avatars/foodie.jpg"
    },
    communityId: "food-and-cuisine",
    upvotes: 234,
    comments: 45,
    createdAt: "2024-02-19T08:00:00Z",
    timeAgo: "4 hours ago"
  },
  {
    id: "4",
    title: "K2 Base Camp Trek Experience",
    content: "Just completed the K2 Base Camp trek! Here's my complete experience, including preparation tips, best time to visit, and breathtaking photos from the journey...",
    image: "https://picsum.photos/800/403",
    author: {
      id: "u4",
      name: "Mountaineer",
      image: "/avatars/mountaineer.jpg"
    },
    communityId: "adventure",
    upvotes: 567,
    comments: 89,
    createdAt: "2024-02-18T10:00:00Z",
    timeAgo: "1 day ago"
  },
  // Add more posts as needed...
];
