"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Star } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Demo data interface
interface Review {
  _id: string;
  title: string;
  content: string;
  rating: number;
  createdAt: string;
  author: {
    username: string;
    avatar?: string;
  };
  location: {
    name: string;
    _id: string;
  };
  likes: number;
  reportCount: number;
  reports: {
    reason: string;
  }[];
}

interface ReviewListResponse {
  reviews: Review[];
  currentPage: number;
  totalPages: number;
  totalReviews: number;
}


export default function ReviewsTab() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'reported'>('all');

  const fetchReviews = useCallback(async (page: number, search?: string) => {
    if (!token) return;
    setReviewLoading(true);

    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reviews`;
      const url = search
        ? `${baseUrl}/search?query=${encodeURIComponent(search)}&page=${page}&filter=${filter}`
        : `${baseUrl}?page=${page}&filter=${filter}`;

      const response = await axios.get<ReviewListResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setReviews(response.data.reviews);
      setTotalReviewPages(response.data.totalPages);
      setTotalReviews(response.data.totalReviews);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch reviews');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setReviewLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    fetchReviews(reviewPage, reviewSearchQuery);
  }, [reviewPage, reviewSearchQuery, fetchReviews, filter]);

  const handleFilterChange = (value: 'all' | 'reported') => {
    setFilter(value);
    setReviewPage(1);
  };

  const handleReviewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewPage(1);
    fetchReviews(1, reviewSearchQuery);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!token) return;
    setDeletingReviewId(reviewId);

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Review deleted successfully');
      fetchReviews(reviewPage, reviewSearchQuery);
    } catch (err) {
      console.error('Error deleting review:', err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to delete review');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setDeletingReviewId(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Management</CardTitle>
        <CardDescription>
          Manage and search through all location reviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <form onSubmit={handleReviewSearch} className="flex-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={reviewSearchQuery}
                onChange={(e) => setReviewSearchQuery(e.target.value)}
                placeholder="Search reviews by title, content, or location..."
                className="flex-1 px-4 py-2 border rounded-md"
              />
              <Button type="submit" className="w-full sm:w-auto">Search</Button>
            </div>
          </form>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter reviews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="reported">Reported Reviews</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reviewLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="flex flex-col p-4 border rounded-lg gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={review.author.avatar} />
                        <AvatarFallback>
                          {review.author.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link 
                          href={`/reviews/${review._id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {review.title}
                        </Link>
                        <p className="text-sm text-gray-500 line-clamp-2">{review.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-400">
                            Posted {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link 
                          href={`/locations/${review.location._id}`}
                          className="text-sm text-gray-500 hover:text-primary transition-colors"
                        >
                          {review.location.name}
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-sm text-gray-500">
                        {review.reportCount} reports
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {review.reportCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedReviewId(expandedReviewId === review._id ? null : review._id)}
                            className="flex-1 sm:flex-none gap-2"
                          >
                            {expandedReviewId === review._id ? 'Hide Reports' : 'View Reports'}
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingReviewId === review._id}
                              className="flex-1 sm:flex-none gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Review
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review</AlertDialogTitle>
                              <div className="text-sm text-muted-foreground">
                                Are you sure you want to delete this review? This action will:
                                <ul className="list-disc list-inside mt-2">
                                  <li>Delete the review permanently</li>
                                  <li>Remove all likes associated with this review</li>
                                </ul>
                                <p className="mt-2">This action cannot be undone.</p>
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReview(review._id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete Review
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  
                  {expandedReviewId === review._id && review.reports.length > 0 && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {review.reports.map((report, index) => (
                          <li key={index}>{report.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                {totalReviews > 0 ? (
                  `Showing ${reviews.length} of ${totalReviews} reviews`
                ) : (
                  "No reviews found"
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                  disabled={reviewPage === 1 || totalReviews === 0}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                  disabled={reviewPage === totalReviewPages || totalReviews === 0}
                  className="flex-1 sm:flex-none"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 