export interface Review {
  title: string;
  content: string;
  rating: number;
  location: string;
  category: string;
  images?: string[];
  author: {
    name: string;
    image: string;
  };
  votes: number;
  comments: number;
  timeAgo: string;
  likes: number;
}

export const reviews: Review[] = [
  {
    title: "Best Chapli Kebab in Peshawar!",
    content: "Taku's is a hidden gem in the heart of Peshawar. The chapli kebabs are perfectly seasoned and cooked to perfection. The atmosphere is authentic and the staff is incredibly friendly...",
    rating: 5,
    location: "Taku's Restaurant",
    category: "Restaurant",
    images: [
      "/reviews/kebab-1.jpg",
      "/reviews/kebab-2.jpg",
    ],
    author: {
      name: "foodiepk",
      image: "/users/foodie.jpg"
    },
    votes: 234,
    comments: 45,
    timeAgo: "2 days ago",
    likes: 156
  },
  {
    title: "Serena Hotel - A Luxurious Stay",
    content: "Exceptional service and stunning mountain views. The rooms are spacious and well-appointed...",
    rating: 4,
    location: "Serena Hotel",
    category: "Hotel",
    images: ["/reviews/serena-1.jpg"],
    author: {
      name: "traveler_pak",
      image: "/users/traveler.jpg"
    },
    votes: 156,
    comments: 23,
    timeAgo: "1 week ago",
    likes: 98
  },
  {
    title: "Mesmerizing Badshahi Mosque",
    content: "One of the most beautiful historical sites in Pakistan. The architecture is breathtaking...",
    rating: 5,
    location: "Badshahi Mosque",
    category: "Attraction",
    images: ["/reviews/mosque-1.jpg", "/reviews/mosque-2.jpg"],
    author: {
      name: "history_buff",
      image: "/users/historian.jpg"
    },
    votes: 312,
    comments: 67,
    timeAgo: "3 days ago",
    likes: 245
  }
];
