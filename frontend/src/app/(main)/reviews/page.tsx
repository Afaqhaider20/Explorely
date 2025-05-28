'use client';

import { ReviewCard } from "@/components/ReviewCard";
import { CreateReviewDialog } from "@/components/CreateReviewDialog";
import { Button } from "@/components/ui/button";
import { Plus, MessagesSquare, Search, ArrowUpDown, Star, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback, useRef } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useAuth } from '@/store/AuthContext';
import { ReviewSkeleton } from "@/components/ReviewSkeleton";
import { cn } from "@/lib/utils";

interface Review {
  _id: string;
  title: string;
  content: string;
  location: string;
  category: string;
  rating: number;
  images: string[];
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface ReviewData {
  title: string;
  content: string;
  location: string;
  category: string;
  rating: number;
  images?: FileList;
}

export default function ReviewsPage() {
  const { token, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchReviews = useCallback(async (pageNumber: number, append: boolean = false) => {
    try {
      if (pageNumber > 1) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const endpoint = searchQuery 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/search`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/reviews`;

      const response = await axios.get(endpoint, {
        params: {
          page: pageNumber,
          limit: 10,
          category: activeTab === 'all' ? undefined : activeTab,
          sort: sortBy,
          q: searchQuery || undefined
        }
      });

      const newReviews = response.data.data.reviews;
      
      if (append) {
        setReviews(prev => [...prev, ...newReviews]);
      } else {
        setReviews(newReviews);
      }
      
      setHasMore(newReviews.length === 10);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
      if (!append) {
        setReviews([]);
        setPage(1);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  }, [activeTab, sortBy, searchQuery]);

  const loadMoreReviews = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      fetchReviews(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchReviews]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearching(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchReviews(1, false);
    }, 500);
  };

  useEffect(() => {
    setPage(1);
    fetchReviews(1, false);
  }, [activeTab, sortBy, fetchReviews]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
          loadMoreReviews();
        }
      },
      { threshold: 0.5 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, isLoading, loadMoreReviews]);

  const handleCreateReview = async (data: ReviewData) => {
    try {
      if (!isAuthenticated || !token) {
        toast.error('Please login to create a review');
        return;
      }

      setIsLoading(true);
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('location', data.location);
      formData.append('category', data.category);
      formData.append('rating', data.rating.toString());
      
      if (user?.location) {
        formData.append('userCity', user.location.city);
        formData.append('userCountry', user.location.country);
      }
      
      if (data.images) {
        Array.from(data.images).forEach(file => {
          formData.append('images', file);
        });
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success('Review created successfully');
      setReviews(prev => [response.data.data.review, ...prev]);
    } catch (error) {
      console.error('Error creating review:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Please login to create a review');
      } else {
        toast.error('Failed to create review');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const NoReviews = ({ category }: { category?: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center transition-all duration-300 ease-in-out bg-muted/30 rounded-lg shadow-sm border border-muted">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <MessagesSquare className="h-12 w-12 text-primary/80" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {category 
          ? `Be the first to review a ${category.toLowerCase()}!`
          : 'Start sharing your experiences with others!'}
      </p>
      <CreateReviewDialog
        onSubmit={handleCreateReview}
        trigger={<Button size="lg" className="px-8 gap-2"><Plus className="h-4 w-4" /> Write First Review</Button>}
      />
    </div>
  );

  const LoadingSkeletons = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <ReviewSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 md:py-12 space-y-6 md:space-y-8 mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-sm border border-muted">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6 transition-all duration-300 ease-in-out">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2 md:mb-3 flex items-center gap-2">
                <Star className="h-6 w-6 md:h-7 md:w-7 text-yellow-500 animate-pulse" fill="currentColor" />
                Reviews
              </h1>
              <div className="space-y-1">
                <p className="text-muted-foreground text-base md:text-lg max-w-md">
                  Explore and share authentic experiences from your travels
                </p>
                {isAuthenticated && user?.location && (
                  <p className="text-sm text-muted-foreground/80">
                    Your location: {user.location.city}, {user.location.country.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
            <CreateReviewDialog
              onSubmit={handleCreateReview}
              trigger={
                <Button size="default" className="w-full sm:w-auto mt-3 sm:mt-0 gap-2 px-4 md:px-6 shadow-md hover:shadow-lg transition-all">
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  Write Review
                </Button>
              }
            />
          </div>
        </div>

        {/* Search and filters */}
        <div className="bg-background rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reviews..."
                className="pl-9 h-10 md:h-11 bg-muted/50 focus:bg-background"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 md:h-11 bg-muted/50 hover:bg-muted/70">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    {sortBy === 'recent' ? 'Most Recent' :
                     sortBy === 'popular' ? 'Most Popular' :
                     'Highest Rated'}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs and content */}
        <Tabs defaultValue="all" className="space-y-6 md:space-y-8" onValueChange={setActiveTab}>
          {/* Mobile-friendly tabs */}
          <div className="relative border-b">
            <div className="flex overflow-x-auto scrollbar-hide -mb-px py-1">
              <TabsList className="bg-transparent flex p-0 h-auto w-auto mb-0">
                <TabsTrigger 
                  value="all" 
                  className={cn(
                    "flex-shrink-0 h-10 px-3 md:px-6 rounded-t-md border-b-2 border-transparent",
                    "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium",
                    "text-sm whitespace-nowrap"
                  )}
                >
                  <span className="mr-1.5">📋</span> All
                </TabsTrigger>
                <TabsTrigger 
                  value="Restaurant" 
                  className={cn(
                    "flex-shrink-0 h-10 px-3 md:px-6 rounded-t-md border-b-2 border-transparent",
                    "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium",
                    "text-sm whitespace-nowrap"
                  )}
                >
                  <span className="mr-1.5">🍽️</span> Restaurants
                </TabsTrigger>
                <TabsTrigger 
                  value="Hotel" 
                  className={cn(
                    "flex-shrink-0 h-10 px-3 md:px-6 rounded-t-md border-b-2 border-transparent",
                    "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium",
                    "text-sm whitespace-nowrap"
                  )}
                >
                  <span className="mr-1.5">🏨</span> Hotels
                </TabsTrigger>
                <TabsTrigger 
                  value="Attraction" 
                  className={cn(
                    "flex-shrink-0 h-10 px-3 md:px-6 rounded-t-md border-b-2 border-transparent",
                    "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium",
                    "text-sm whitespace-nowrap"
                  )}
                >
                  <span className="mr-1.5">🏛️</span> Attractions
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {isSearching && !reviews.length ? (
              <LoadingSkeletons />
            ) : isLoading && !reviews.length ? (
              <LoadingSkeletons />
            ) : reviews.length > 0 ? (
              <>
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div
                      key={review._id}
                      ref={index === reviews.length - 1 ? loaderRef : undefined}
                    >
                      <ReviewCard {...review} />
                    </div>
                  ))}
                </div>
                <div ref={loaderRef} className="py-4 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading more reviews...</span>
                    </div>
                  )}
                </div>
                {!hasMore && reviews.length > 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>You&apos;ve reached the end. No more reviews to load.</p>
                  </div>
                )}
              </>
            ) : (
              <NoReviews category={activeTab === 'all' ? undefined : activeTab} />
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
