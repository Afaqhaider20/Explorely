export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  image?: string;
  author: {
    name: string;
    image?: string;
  };
  upvotes: number;
  comments: number;
  timeAgo: string;
}

export interface Community {
  id: string;
  name: string;
  image: string;
  coverImage?: string;
  description: string;
  members: number;
  rules: string[];
  posts: CommunityPost[]; // Now using the proper type instead of any[]
}

export const communities: Record<string, Community> = {
  "nature-photography": {
    id: "nature-photography",
    name: "NaturePhotography",
    image: "/communities/nature.jpg",
    coverImage: "/communities/nature-cover.jpg",
    description: "A community for nature photography enthusiasts. Share your best shots of Pakistan's stunning landscapes, wildlife, and natural wonders.",
    members: 24680,
    posts: [
      {
        id: 1,
        title: "Sunset at Passu Cones",
        content: "Shot on Sony A7III, f/2.8, 1/1000s, ISO 100. The light was perfect just before sunset, creating these amazing golden hues on the cathedral-like spires.",
        image: "/posts/sunset.jpg",
        author: {
          name: "lenspk",
          image: "/users/lens.jpg"
        },
        upvotes: 892,
        comments: 76,
        timeAgo: "12 hours ago"
      },
      {
        id: 2,
        title: "Wildlife spotted near Deosai Plains",
        content: "Early morning encounter with a Himalayan Brown Bear. Remember to maintain safe distance and use telephoto lenses for wildlife photography.",
        image: "/posts/wildlife.jpg",
        author: {
          name: "wildlifepk",
          image: "/users/wildlife.jpg"
        },
        upvotes: 654,
        comments: 42,
        timeAgo: "1 day ago"
      }
    ],
    rules: [
      "Only original photographs allowed",
      "Include camera settings in post",
      "No excessive post-processing",
      "Credit other photographers when sharing their work"
    ]
  },

  "pakistan-travel": {
    id: "pakistan-travel",
    name: "PakistanTravel",
    image: "/communities/travel.jpg",
    coverImage: "/communities/travel-cover.jpg",
    description: "Your ultimate guide to exploring Pakistan. Share travel tips, hidden gems, and authentic experiences from across the country.",
    members: 32150,
    posts: [
      {
        id: 1,
        title: "Hidden waterfall in Kaghan Valley! 🏞️",
        content: "After a 3-hour hike, we found this pristine waterfall that's not on any tourist map. The locals call it 'Chhota Pani'. Here's how to get there...",
        image: "/posts/waterfall.jpg",
        author: {
          name: "mountainexplorer",
          image: "/users/avatar1.jpg"
        },
        upvotes: 324,
        comments: 45,
        timeAgo: "5 hours ago"
      },
      {
        id: 2,
        title: "Complete Guide: Fairy Meadows Camping",
        content: "Everything you need to know about camping at Fairy Meadows - from booking jeeps to the best camping spots and essential gear to pack.",
        image: "/posts/camping.jpg",
        author: {
          name: "adventurepk",
          image: "/users/adventure.jpg"
        },
        upvotes: 567,
        comments: 89,
        timeAgo: "2 days ago"
      }
    ],
    rules: [
      "Provide accurate location information",
      "Include practical travel tips",
      "Respect local customs and traditions",
      "No promotional content without mod approval"
    ]
  },

  "food-and-cuisine": {
    id: "food-and-cuisine",
    name: "Food & Cuisine",
    image: "/communities/food.jpg",
    coverImage: "/communities/food-cover.jpg",
    description: "Discover Pakistan's rich culinary heritage. From street food to traditional recipes, share your foodie adventures and cooking tips.",
    members: 18450,
    posts: [
      {
        id: 1,
        title: "Best Chapli Kebab spots in Peshawar",
        content: "After trying 15 different places, here's my top 5 chapli kebab spots in Peshawar, ranked by taste, authenticity, and value for money.",
        image: "/posts/kebab.jpg",
        author: {
          name: "foodiepk",
          image: "/users/foodie.jpg"
        },
        upvotes: 423,
        comments: 67,
        timeAgo: "1 day ago"
      },
      {
        id: 2,
        title: "Traditional Hunza Cuisine Guide",
        content: "Exploring the unique flavors of Hunza Valley - from Dawdo soup to Chapshuro. Here's what to try and where to find authentic local food.",
        image: "/posts/hunza-food.jpg",
        author: {
          name: "culinarypk",
          image: "/users/culinary.jpg"
        },
        upvotes: 345,
        comments: 52,
        timeAgo: "3 days ago"
      }
    ],
    rules: [
      "Include restaurant location and prices when relevant",
      "Original photos only",
      "No spam or self-promotion",
      "Respect dietary preferences and restrictions"
    ]
  },

  "adventure": {
    id: "adventure",
    name: "Adventure",
    image: "/communities/adventure.jpg",
    coverImage: "/communities/adventure-cover.jpg",
    description: "For thrill-seekers and adventure enthusiasts. Share your hiking, climbing, camping, and outdoor adventure experiences in Pakistan.",
    members: 15720,
    posts: [
      {
        id: 1,
        title: "K2 Base Camp Trek Guide 2024",
        content: "Complete day-by-day breakdown of the K2 Base Camp trek, including preparation tips, gear list, and acclimatization schedule.",
        image: "/posts/k2-trek.jpg",
        author: {
          name: "highaltitude",
          image: "/users/trek.jpg"
        },
        upvotes: 892,
        comments: 124,
        timeAgo: "4 days ago"
      },
      {
        id: 2,
        title: "Paragliding in Mushkpuri: First Timer's Experience",
        content: "Everything you need to know about paragliding in Mushkpuri - from booking to landing. Includes safety tips and best weather conditions.",
        image: "/posts/paragliding.jpg",
        author: {
          name: "adrenalinepk",
          image: "/users/paraglide.jpg"
        },
        upvotes: 567,
        comments: 83,
        timeAgo: "2 days ago"
      }
    ],
    rules: [
      "Always include safety information",
      "Mark difficulty levels for activities",
      "Include emergency contact information when relevant",
      "No dangerous or illegal activities"
    ]
  },

  "programming": {
    id: "programming",
    name: "Programming",
    image: "/communities/programming.jpg",
    description: "A community for programmers and developers",
    members: 15000,
    rules: [
      "Be respectful and helpful",
      "No spam or self-promotion",
      "Use appropriate tags"
    ],
    posts: []
  },
  "photography": {
    id: "photography",
    name: "Photography",
    image: "/communities/photography.jpg",
    description: "Share and discuss photography",
    members: 8000,
    rules: [
      "Credit original photographers",
      "No NSFW content",
      "Use proper tags"
    ],
    posts: []
  }
};
