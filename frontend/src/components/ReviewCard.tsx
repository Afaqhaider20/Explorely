"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MoreHorizontal, Flag, Share, Heart, MessageCircle, Trash2, ZoomIn } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageGallery } from '@/components/ImageGallery';
import { ReportDialog } from '@/components/ReportDialog';
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/store/AuthContext";
import { SignInDialog } from "@/components/SignInDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ReviewCardProps {
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
  isDetailView?: boolean;
}

export function ReviewCard({
  _id,
  title,
  content,
  location,
  category,
  rating,
  images,
  author,
  likeCount,
  commentCount,
  isDetailView = false
}: ReviewCardProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [likes, setLikes] = useState(likeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [signInOpen, setSignInOpen] = useState(false);
  const { token, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check if user has liked the review when component mounts
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!isAuthenticated || !token) return;
      
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${_id}/like-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setIsLiked(response.data.data.hasLiked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [_id, isAuthenticated, token]);

  const handleReport = async () => {
    if (!token || !user) {
      toast.error('Authentication required');
      return;
    }
    setIsReportDialogOpen(false);
  };

  const handleLike = async () => {
    if (!isAuthenticated || !token) {
      toast.error('Please login to like reviews');
      setSignInOpen(true);
      return;
    }

    try {
      // Prevent multiple clicks while request is processing
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${_id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        const { hasLiked } = response.data.data;
        setIsLiked(hasLiked);
        setLikes(prev => hasLiked ? prev + 1 : prev - 1);
      } else {
        throw new Error(response.data.message || 'Failed to update like status');
      }
    } catch (error) {
      console.error('Error liking review:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update like status');
      }
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !token) {
      toast.error('Please login to delete reviews');
      return;
    }
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Review deleted successfully');
      if (isDetailView) {
        router.push('/');
      } else {
        const card = document.getElementById(`review-${_id}`);
        if (card) {
          card.remove();
        }
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleCardClick = () => {
    if (!isDetailView) {
      router.push(`/reviews/${_id}`);
    }
  };

  const handleImageClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    setGalleryInitialIndex(index);
    setIsGalleryOpen(true);
  };

  return (
    <Card id={`review-${_id}`} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3 space-y-4 px-4 sm:px-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-primary/10">
              <AvatarImage src={author.avatar} alt={author.username} />
              <AvatarFallback className="bg-primary/5">{author.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Link 
                href={author._id === user?._id ? '/profile' : `/profile/${author._id}`} 
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                {author.username}
              </Link>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="font-medium">{location}</span>
                <span className="hidden xs:inline">•</span>
                <span className="text-primary/80">{category}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted/20 text-muted/20"
                  }`}
                />
              ))}
            </div>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full text-muted-foreground hover:text-primary"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {author._id === user?._id && (
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsDropdownOpen(false);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
                {user && author._id !== user._id && (
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsDropdownOpen(false);
                      setIsReportDialogOpen(true);
                    }}
                  >
                    <Flag className="h-4 w-4" />
                    <span>Report</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="gap-2"
                  onSelect={() => setIsDropdownOpen(false)}
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Review</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this review? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async (e) => {
                      e.preventDefault();
                      setDeleteDialogOpen(false);
                      await handleDelete();
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent 
        className="space-y-3 sm:space-y-4 cursor-pointer px-4 sm:px-6" 
        onClick={handleCardClick}
      >
        <h3 className="text-lg sm:text-xl font-semibold leading-tight">{title}</h3>
        <p className={`text-muted-foreground text-sm sm:text-base leading-relaxed ${
          !isDetailView ? 'line-clamp-3' : ''
        }`}>{content}</p>

        {images && images.length > 0 && (
          <ReviewImageGrid images={images} isDetailView={isDetailView} handleImageClick={handleImageClick} />
        )}
      </CardContent>

      <CardFooter className="px-4 sm:px-5 py-2 sm:py-3 border-t border-border/40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center bg-muted/50 rounded-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={handleLike}
            >
              <Heart
                className={`h-4 w-4 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`}
              />
            </Button>
            <span className="min-w-[2rem] sm:min-w-[2.5rem] text-center text-sm font-medium">{likes}</span>
          </div>
          {!isDetailView && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 sm:h-9 rounded-full hover:bg-muted/50 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              onClick={handleCardClick}
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {commentCount} Comments
            </Button>
          )}
        </div>
      </CardFooter>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReport}
        type="review"
        contentTitle={title}
        itemId={_id}
      />
      
      <ImageGallery 
        images={images}
        initialIndex={galleryInitialIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      <SignInDialog
        trigger={null}
        open={signInOpen}
        onOpenChange={setSignInOpen}
      />
    </Card>
  );
}

interface ReviewImageGridProps {
  images: string[];
  isDetailView: boolean;
  handleImageClick: (index: number, e: React.MouseEvent) => void;
}

function ReviewImageGrid({ images, isDetailView, handleImageClick }: ReviewImageGridProps) {
  // Store orientation for each image
  const [orientations, setOrientations] = useState<(null | 'portrait' | 'landscape' | 'square')[]>(
    Array(images.length).fill(null)
  );

  useEffect(() => {
    const newOrientations = [...orientations];
    images.forEach((img, idx) => {
      const imageObj = new window.Image();
      imageObj.onload = () => {
        if (imageObj.width > imageObj.height) newOrientations[idx] = 'landscape';
        else if (imageObj.width < imageObj.height) newOrientations[idx] = 'portrait';
        else newOrientations[idx] = 'square';
        setOrientations([...newOrientations]);
      };
      imageObj.src = img;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.join(',')]);

  const showImages = images.slice(0, isDetailView ? images.length : Math.min(images.length, 4));

  return (
    <div className={`grid ${
      images.length === 1 ? 'grid-cols-1' :
      images.length === 2 ? 'grid-cols-2' :
      'grid-cols-2'
    } gap-2 sm:gap-3 mt-3 sm:mt-4`}>
      {showImages.map((image, i) => {
        const orientation = orientations[i];
        const isPortrait = orientation === 'portrait';
        const isSquare = orientation === 'square';
        const isLandscape = orientation === 'landscape';
        // For single image, use a larger/taller container for portrait
        const single = images.length === 1;
        return (
          <div
            key={i}
            className={`relative rounded-lg overflow-hidden group cursor-pointer
              ${single && isPortrait ? 'bg-black h-80 sm:h-[32rem] flex items-center justify-center' : ''}
              ${single && isLandscape ? 'aspect-video' : ''}
              ${single && isSquare ? 'bg-black h-80 sm:h-[32rem] flex items-center justify-center' : ''}
              ${!single ? 'aspect-square' : ''}
            `}
            onClick={(e) => handleImageClick(i, e)}
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 z-10 transition-colors flex items-center justify-center">
              <ZoomIn className="h-0 w-0 group-hover:h-8 group-hover:w-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </div>
            <Image
              src={image}
              alt={`Review image ${i + 1}`}
              fill
              className={`transition-transform duration-300 group-hover:scale-105
                ${single && (isPortrait || isSquare) ? 'object-contain' : 'object-cover'}
              `}
              style={{ backgroundColor: single && (isPortrait || isSquare) ? 'black' : undefined }}
            />
            {!isDetailView && i === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
