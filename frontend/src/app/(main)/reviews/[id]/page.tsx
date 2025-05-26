'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReviewCard } from '@/components/ReviewCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { ReviewComments } from '@/components/ReviewComments';

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

export default function ReviewDetailPage() {
  const { id } = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${id}`
        );
        setReview(response.data.data.review);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            // Handle not found case
            setReview(null);
          } else if (error.response?.status === 400) {
            // Handle invalid ID case
            console.error('Invalid review ID:', error);
            setReview(null);
          } else if (error.response?.status === 500) {
            // Handle server error
            console.error('Server error:', error);
            toast.error('Server error occurred. Please try again later.');
          } else {
            // Handle other errors
            console.error('Error fetching review:', error);
            toast.error('Failed to load review');
          }
        } else {
          // Handle non-Axios errors
          console.error('Error fetching review:', error);
          toast.error('Failed to load review');
        }
        setReview(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [id]);

  const handleCommentAdded = () => {
    // Increment the comment count locally
    if (review) {
      setReview(prev => prev ? {
        ...prev,
        commentCount: prev.commentCount + 1
      } : null);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 space-y-8 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container py-12 space-y-8 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-background border rounded-xl p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-2">Oops! Review Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The review you&apos;re looking for doesn&apos;t exist or has been removed. Let&apos;s find you another great review!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/reviews">
                <Button className="w-full sm:w-auto gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Reviews
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  Go to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-8 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/reviews">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Review Details</h1>
      </div>

      <ReviewCard {...review} isDetailView />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Comments
        </h2>
        <ReviewComments reviewId={review._id} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
} 