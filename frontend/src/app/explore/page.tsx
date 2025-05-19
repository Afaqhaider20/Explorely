import { PostCard } from "@/components/PostCard";
import { ExploreSection, CommunityCard } from "@/components/ExploreSection";
import { posts } from "@/data/posts"; // Add this import

const trendingCommunities = [
  {
    name: "NaturePhotography",
    members: 24680,
    image: "/communities/nature.jpg",
    description: "A community for nature photography enthusiasts. Share your best shots of Pakistan's stunning landscapes."
  },
  {
    name: "StreetFoodPK",
    members: 18450,
    image: "/communities/food.jpg",
    description: "Discover and share the best street food spots across Pakistan. From karahi to biryani!"
  },
];

// Remove the old trendingPosts array as we'll use the imported posts

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-secondary">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="container py-8 space-y-8 mx-auto max-w-5xl px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-secondary mb-2">Explore</h1>
        <p className="text-muted-foreground">
          Discover new communities and trending posts from across Explorely
        </p>
      </div>

      <ExploreSection
        title="Trending Communities"
        subtitle="Fast-growing communities to check out"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingCommunities.map((community) => (
            <CommunityCard 
              key={community.name}
              community={community}
            />
          ))}
        </div>
      </ExploreSection>

      <div>
        <SectionHeader
          title="Trending Posts"
          subtitle="Popular posts from the last 24 hours"
        />
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              {...post} 
              community={{
                name: post.communityId,
                image: `/communities/${post.communityId}.jpg`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
