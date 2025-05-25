"use client";

import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageSquare, ArrowBigUp, ArrowBigDown, Users, Share2, MoreHorizontal, Flag, Trash2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/store/AuthContext";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { Badge } from "./ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from '@/components/ReportDialog';
import { ImageGallery } from '@/components/ImageGallery';
import axios from "axios";
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

export interface PostCardProps {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  community: {
    _id: string;
    name: string;
    creator?: {
      _id: string;
    };
  };
  media: string | null;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  commentCount: number;
  votes?: {
    upvotes: string[];
    downvotes: string[];
  };
  isDetailView?: boolean;
  onDelete?: () => void;
}

export function PostCard({ 
  _id,
  title,
  content,
  author,
  community,
  media,
  createdAt,
  voteCount,
  commentCount,
  isDetailView = false,
  onDelete
}: PostCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [currentVoteCount, setCurrentVoteCount] = useState(voteCount);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { token, user } = useAuth();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Image orientation state
  const [imgOrientation, setImgOrientation] = useState<'portrait' | 'landscape' | 'square' | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!media) return;
    const img = new window.Image();
    img.onload = () => {
      if (img.width > img.height) setImgOrientation('landscape');
      else if (img.width < img.height) setImgOrientation('portrait');
      else setImgOrientation('square');
    };
    img.src = media;
  }, [media]);

  // Fetch vote status when component mounts
  useEffect(() => {
    const fetchVoteStatus = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/${_id}/vote-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch vote status');
        }

        const data = await response.json();
        if (data.status === 'success') {
          setIsUpvoted(data.data.isUpvoted);
          setIsDownvoted(data.data.isDownvoted);
          setCurrentVoteCount(data.data.voteCount);
        } else {
          throw new Error(data.message || 'Failed to fetch vote status');
        }
      } catch (error) {
        console.error('Error fetching vote status:', error);
        // Don't show error toast for vote status fetch failures
        // Just log it and keep the default state
      }
    };

    fetchVoteStatus();
  }, [_id, token, user]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    
    try {
      const cleanDateString = dateString.split('.')[0] + 'Z';
      const date = parseISO(cleanDateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      console.error('Error parsing date:', err);
      return 'Recently';
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;
    
    if (!user) {
      toast.error("Please log in to vote on posts");
      setSignInOpen(true);
      return;
    }
    
    setIsVoting(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/${_id}/${voteType}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        setIsUpvoted(response.data.data.isUpvoted);
        setIsDownvoted(response.data.data.isDownvoted);
        setCurrentVoteCount(response.data.data.voteCount);
        toast.success(`Successfully ${voteType}d the post`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handlePostClick = () => {
    if (!isDetailView) {
      router.push(`/posts/${_id}`);
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${_id}`);
    toast.success('Link copied to clipboard!');
  };

  const handleReport = async (reason: string) => {
    if (!token || !user) {
      toast.error('Authentication required');
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports`,
        {
          reportedType: 'post',
          reportedItemId: _id,
          reason
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
    setIsReportDialogOpen(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/${_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    setIsGalleryOpen(true);
  };

  return (
    <Card className="mb-4 sm:mb-6 overflow-hidden border-muted hover:border-primary/20 transition-colors shadow-sm hover:shadow-md">
      <CardHeader className="p-3 sm:p-4 pb-2 flex flex-row items-start sm:items-center space-y-0 gap-2 border-b border-muted/40">
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-primary/10 flex-shrink-0">
          <AvatarImage src={author?.avatar} alt={author?.username} />
          <AvatarFallback className="bg-primary/5 text-primary text-xs sm:text-sm">
            {author?.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <Link 
            href={author._id === user?._id ? '/profile' : `/profile/${author._id}`} 
            className="text-sm font-medium hover:text-primary transition-colors truncate"
          >
            {author?.username}
          </Link>
          <div className="flex flex-wrap sm:flex-nowrap items-center text-xs text-muted-foreground">
            <span className="mr-1">{formatDate(createdAt)}</span>
            <span className="hidden sm:inline mx-1">•</span>
            <Link href={`/communities/${community?._id}`} className="flex items-center gap-1 hover:text-primary hover:underline transition-colors mt-0.5 sm:mt-0">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium truncate">{community?.name}</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
          <Badge variant="outline" className="bg-primary/5 text-xs hidden sm:flex">
            {currentVoteCount > 0 && '+'}{currentVoteCount} votes
          </Badge>
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
              {user && (community.creator?._id === user._id || author._id === user._id) && (
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
                className="gap-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(false);
                  handleShare();
                }}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post? This action cannot be undone.
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
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4 cursor-pointer" onClick={!isDetailView ? handlePostClick : undefined}>
        <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 line-clamp-2 text-secondary">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-3">{content}</p>
        
        {media && (
          <div
            className={`mt-3 sm:mt-4 relative w-full rounded-md overflow-hidden border border-muted group cursor-pointer
              ${imgOrientation === 'portrait' ? 'bg-black h-80 sm:h-[32rem] flex items-center justify-center' : ''}
              ${imgOrientation === 'landscape' ? 'h-64 sm:h-96' : ''}
              ${imgOrientation === 'square' ? 'bg-black h-64 sm:h-96 flex items-center justify-center' : ''}
              ${!imgOrientation ? 'h-64 sm:h-96' : ''}
            `}
            onClick={handleImageClick}
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 z-10 transition-colors flex items-center justify-center">
              <ZoomIn className="h-0 w-0 group-hover:h-8 group-hover:w-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </div>
            <Image
              ref={imgRef}
              src={media}
              alt={title}
              fill
              className={`transition-transform duration-300 group-hover:scale-105
                ${imgOrientation === 'portrait' || imgOrientation === 'square' ? 'object-contain' : 'object-cover'}
              `}
              style={{ backgroundColor: imgOrientation === 'portrait' || imgOrientation === 'square' ? 'black' : undefined }}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-2 sm:pt-2 border-t border-muted/40">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 hover:bg-primary/10",
                isUpvoted && "text-primary hover:text-primary"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleVote('upvote');
              }}
              disabled={isVoting}
            >
              <ArrowBigUp className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                isUpvoted && "fill-current"
              )} />
            </Button>
            <span className="text-xs sm:text-sm font-medium min-w-[1.5rem] text-center">
              {currentVoteCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 hover:bg-primary/10",
                isDownvoted && "text-primary hover:text-primary"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleVote('downvote');
              }}
              disabled={isVoting}
            >
              <ArrowBigDown className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                isDownvoted && "fill-current"
              )} />
            </Button>
          </div>

          <Link
            href={isDetailView ? '#' : `/posts/${_id}`}
            onClick={(e) => {
              if (isDetailView) {
                e.preventDefault();
              }
            }}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">{commentCount}</span>
          </Link>
        </div>
      </CardFooter>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReport}
        type="post"
        contentTitle={title}
        itemId={_id}
      />

      {media && (
        <ImageGallery 
          images={[media]}
          initialIndex={0}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      <SignInDialog
        trigger={null}
        open={signInOpen}
        onOpenChange={setSignInOpen}
      />
    </Card>
  );
}
