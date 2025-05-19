"use client";

import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageSquare, ArrowBigUp, ArrowBigDown, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { Badge } from "./ui/badge";

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
  isDetailView = false
}: PostCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [currentVoteCount, setCurrentVoteCount] = useState(voteCount);
  const { token } = useAuth();
  const router = useRouter();

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
    
    setIsVoting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/${_id}/${voteType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to vote');
      }

      const data = await response.json();
      setCurrentVoteCount(data.voteCount);
      toast.success(`Successfully ${voteType}d the post`);
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

  return (
    <Card className="mb-6 overflow-hidden border-muted hover:border-primary/20 transition-colors shadow-sm hover:shadow-md">
      <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-2 border-b border-muted/40">
        <Avatar className="h-9 w-9 ring-2 ring-primary/10">
          <AvatarImage src={author?.avatar} alt={author?.username} />
          <AvatarFallback className="bg-primary/5 text-primary">
            {author?.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="text-sm font-medium">{author?.username}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span>{formatDate(createdAt)}</span>
            <span className="mx-1">•</span>
            <Link href={`/communities/${community?._id}`} className="flex items-center gap-1 hover:text-primary hover:underline transition-colors">
              <Users className="h-3 w-3" />
              <span className="font-medium">{community?.name}</span>
            </Link>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto bg-primary/5 text-xs">
          {currentVoteCount > 0 && '+'}{currentVoteCount} votes
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-4 cursor-pointer" onClick={!isDetailView ? handlePostClick : undefined}>
        <h3 className="text-xl font-bold mb-2 line-clamp-2 text-secondary">{title}</h3>
        <p className="text-muted-foreground mt-1 line-clamp-3">{content}</p>
        
        {media && (
          <div className="mt-4 relative h-96 w-full rounded-md overflow-hidden border border-muted">
            <Image 
              src={media} 
              alt={title}
              fill
              className="object-cover transition-transform hover:scale-105 duration-500"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-1 border-t border-muted/40 bg-muted/10">
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center">
            <div className="flex items-center rounded-full bg-background/80 border border-muted/20 p-0.5 m-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 px-3 rounded-l-full border-r border-muted/20 transition-colors",
                  "hover:bg-green-500/10 hover:text-green-600",
                  currentVoteCount > 0 && "text-green-600 bg-green-500/10",
                  isVoting && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
              >
                <ArrowBigUp className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 px-3 rounded-r-full transition-colors",
                  "hover:bg-red-500/10 hover:text-red-600",
                  currentVoteCount < 0 && "text-red-600 bg-red-500/10",
                  isVoting && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
              >
                <ArrowBigDown className="h-5 w-5" />
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
              onClick={!isDetailView ? handlePostClick : undefined}
            >
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>
                  {commentCount > 0 ? (
                    <span className="font-medium">{commentCount}{" "}
                      <span className="font-normal">Comment{commentCount !== 1 ? 's' : ''}</span>
                    </span>
                  ) : (
                    'Comment'
                  )}
                </span>
              </div>
            </Button>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
