'use client';

import { ReviewCard } from "@/components/ReviewCard";
import { CreateReviewDialog } from "@/components/CreateReviewDialog";
import { Button } from "@/components/ui/button";
import { Plus, MessagesSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reviews } from "@/data/reviews";
import { useState } from "react";

interface ReviewData {
  title: string;
  content: string;
  location: string;
  category: string;
  rating: number;
  images?: FileList;
}

export default function ReviewsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateReview = async (data: ReviewData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Creating review:', data);
    } finally {
      setIsLoading(false);
    }
  };

  const NoReviews = ({ category }: { category?: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center transition-all duration-300 ease-in-out">
      <MessagesSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
      <p className="text-muted-foreground mb-4">
        {category 
          ? `Be the first to review a ${category.toLowerCase()}!`
          : 'Start sharing your experiences with others!'}
      </p>
      <CreateReviewDialog
        onSubmit={handleCreateReview}
        trigger={<Button>Write First Review</Button>}
      />
    </div>
  );

  return (
    <div className="container py-12 space-y-8 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300 ease-in-out">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Reviews</h1>
          <p className="text-muted-foreground text-lg">
            Explore and share experiences from your travels
          </p>
        </div>
        <CreateReviewDialog
          onSubmit={handleCreateReview}
          trigger={
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Write Review
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="all" className="space-y-8">
        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent">
          <TabsTrigger value="all" className="data-[state=active]:border-b-2">
            All Reviews
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="data-[state=active]:border-b-2">
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="hotels" className="data-[state=active]:border-b-2">
            Hotels
          </TabsTrigger>
          <TabsTrigger value="attractions" className="data-[state=active]:border-b-2">
            Attractions
          </TabsTrigger>
        </TabsList>

        {["all", "restaurants", "hotels", "attractions"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6 min-h-[200px] transition-all duration-300 ease-in-out">
            {isLoading ? (
              <div className="animate-pulse space-y-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-48 bg-muted rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="transition-opacity duration-300 ease-in-out">
                {tab === "all" ? (
                  reviews.length > 0 ? (
                    reviews.map((review, i) => <ReviewCard key={i} {...review} />)
                  ) : (
                    <NoReviews />
                  )
                ) : (
                  (() => {
                    const category = tab.charAt(0).toUpperCase() + tab.slice(1, -1);
                    const filteredReviews = reviews.filter(
                      (review) => review.category === category
                    );
                    return filteredReviews.length > 0 ? (
                      filteredReviews.map((review, i) => (
                        <ReviewCard key={i} {...review} />
                      ))
                    ) : (
                      <NoReviews category={category} />
                    );
                  })()
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
