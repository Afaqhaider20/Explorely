export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  upvotes: number;
  createdAt: string;
  timeAgo: string;
  replies?: Comment[];
}

export const comments: Comment[] = [
  {
    id: "c1",
    postId: "1",
    content: "This is really helpful! Thanks for sharing.",
    author: {
      id: "u3",
      name: "Alex Johnson",
      image: "/avatars/alex.jpg"
    },
    upvotes: 12,
    createdAt: "2024-02-19T11:00:00Z",
    timeAgo: "1 hour ago",
    replies: [
      {
        id: "c1r1",
        postId: "1",
        content: "Glad you found it useful!",
        author: {
          id: "u1",
          name: "Sarah Wilson",
          image: "/avatars/sarah.jpg"
        },
        upvotes: 5,
        createdAt: "2024-02-19T11:30:00Z",
        timeAgo: "30 minutes ago"
      }
    ]
  },
  // Add more comments as needed...
];
