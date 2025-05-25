"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/store/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Smile } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import Link from "next/link";
import { SignInDialog } from "@/components/SignInDialog";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { getApiUrl } from "@/lib/config";

interface CommentAuthor {
  _id: string;
  username: string;
  avatar: string;
}

interface CommentData {
  _id: string;
  content: string;
  author: CommentAuthor;
  review: string;
  parentComment: string | null;
  likes: string[];
  likeCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewCommentsProps {
  reviewId: string;
  onCommentAdded?: () => void;
}

interface CommentTextareaProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

const CommentTextarea = ({ 
  onSubmit, 
  onCancel, 
  submitting, 
  placeholder = "What are your thoughts?",
  defaultValue = "",
  className
}: CommentTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async () => {
    if (!textareaRef.current || !textareaRef.current.value.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    const content = textareaRef.current.value;
    textareaRef.current.value = ''; // Clear before unmounting
    await onSubmit(content);
  };

  const handleCancel = () => {
    if (textareaRef.current) {
      textareaRef.current.value = ''; // Clear before unmounting
    }
    onCancel();
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const textBefore = textareaRef.current.value.substring(0, cursorPosition);
      const textAfter = textareaRef.current.value.substring(cursorPosition);
      textareaRef.current.value = textBefore + emojiData.emoji + textAfter;
      
      // Set cursor position after the inserted emoji
      const newCursorPosition = cursorPosition + emojiData.emoji.length;
      textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      textareaRef.current.focus();
    }
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div className={cn("border rounded-md p-2 sm:p-3 bg-background", className)}>
      <div className="relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            className="w-full min-h-[90px] sm:min-h-[120px] resize-y p-3 sm:p-4 border rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background/50"
            defaultValue={defaultValue}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground hidden md:flex"
                title="Add emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 z-50 emoji-picker-container">
                  <div className="rounded-lg shadow-lg border bg-background">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      width={250}
                      height={300}
                      searchDisabled
                      skinTonesDisabled
                      previewConfig={{
                        showPreview: false
                      }}
                      theme={Theme.LIGHT}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button 
          variant="outline" 
          size="sm"
          className="h-7 text-xs px-2 sm:h-8 sm:px-3"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs px-2 sm:h-8 sm:px-3"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  );
};

export function ReviewComments({ reviewId, onCommentAdded }: ReviewCommentsProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTextarea, setActiveTextarea] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [signInOpen, setSignInOpen] = useState(false);
  const { token, user } = useAuth();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        getApiUrl(`api/reviews/${reviewId}/comments`)
      );
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error("Please log in to like comments");
      setSignInOpen(true);
      return;
    }

    // Optimistically update the UI
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(commentId)) {
        newSet.add(commentId);
      } else {
        newSet.delete(commentId);
      }
      return newSet;
    });

    // Optimistically update the like count
    setComments(prevComments => {
      return prevComments.map(comment => {
        if (comment._id === commentId) {
          const newLikeCount = comment.likeCount + (likedComments.has(commentId) ? -1 : 1);
          return { ...comment, likeCount: newLikeCount };
        }
        return comment;
      });
    });

    try {
      const response = await axios.post(
        getApiUrl(`api/reviews/${reviewId}/comments/${commentId}/like`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data.data;
      
      // Update local state based on the response
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (data.hasLiked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });
      
      setComments(prevComments => 
        updateCommentLikeCount(prevComments, commentId, data.likeCount)
      );
      
      toast.success(data.hasLiked ? "Comment liked" : "Comment unliked");
      
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like status");

      // Revert optimistic updates on error
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(commentId)) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        return newSet;
      });

      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment._id === commentId) {
            const newLikeCount = comment.likeCount + (likedComments.has(commentId) ? 1 : -1);
            return { ...comment, likeCount: newLikeCount };
          }
          return comment;
        });
      });
    }
  };
  
  const updateCommentLikeCount = (comments: CommentData[], commentId: string, newLikeCount: number): CommentData[] => {
    return comments.map(comment => {
      if (comment._id === commentId) {
        return { ...comment, likeCount: newLikeCount };
      }
      
      return comment;
    });
  };

  const handleSubmitComment = async (content: string) => {
    setSubmitting(true);

    // Create a temporary comment object
    const tempComment: CommentData = {
      _id: `temp-${Date.now()}`,
      content,
      author: {
        _id: user!._id,
        username: user!.username,
        avatar: user!.avatar || '',
      },
      review: reviewId,
      parentComment: null,
      likes: [],
      likeCount: 0,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add the comment to the UI
    setComments(prevComments => [tempComment, ...prevComments]);

    try {
      const response = await axios.post(
        getApiUrl(`api/reviews/${reviewId}/comments`),
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Replace the temporary comment with the real one
      setComments(prevComments => 
        prevComments.map(comment => 
          comment._id === tempComment._id ? response.data.data.comment : comment
        )
      );

      setActiveTextarea(false);
      toast.success("Comment posted successfully");
      onCommentAdded?.();
    } catch (error) {
      // Remove the temporary comment on error
      setComments(prevComments => 
        prevComments.filter(comment => comment._id !== tempComment._id)
      );

      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const CommentItem = ({ comment }: { comment: CommentData }) => {
    const { user } = useAuth();
    const hasLiked = likedComments.has(comment._id);
    
    return (
      <div className="mt-4 sm:mt-6">
        <div className="p-3 sm:p-4 rounded bg-primary/5">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 ring-1 ring-primary/20">
              <AvatarImage src={comment.author.avatar} alt={comment.author.username} />
              <AvatarFallback className="text-xs">{comment.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-2">
              <Link 
                href={comment.author._id === user?._id ? '/profile' : `/profile/${comment.author._id}`} 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {comment.author.username}
              </Link>
              <span className="text-xs text-muted-foreground hidden xs:inline">•</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true })}
                {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
              </span>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm mb-2 sm:mb-3 whitespace-pre-wrap">{comment.content}</p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button 
              onClick={() => handleLikeComment(comment._id)}
              className={cn(
                "flex items-center gap-1 hover:text-primary transition-colors p-1",
                hasLiked && "text-primary"
              )}
              disabled={hasLiked}
            >
              <Heart className={cn(
                "h-3 w-3 sm:h-3.5 sm:w-3.5",
                hasLiked && "fill-current"
              )} />
              <span>{comment.likeCount || 0}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <Card className="p-6 shadow-md">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="border-l-2 border-muted pl-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-16 w-full bg-muted rounded animate-pulse mb-3" />
              <div className="flex gap-3">
                <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 shadow-md">
        <div className="text-center text-red-500 mb-4">{error}</div>
        <div className="flex justify-center">
          <Button onClick={fetchComments}>
            Retry Loading Comments
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4 sm:mb-8">
        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-semibold">Comments</h2>
        {comments.length > 0 && (
          <span className="text-xs sm:text-sm text-muted-foreground">({comments.length})</span>
        )}
      </div>
      
      {user ? (
        <div className="mb-4 sm:mb-8">
          {!activeTextarea ? (
            <Button
              onClick={() => setActiveTextarea(true)}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add a comment
            </Button>
          ) : (
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>{user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm font-medium">Add a comment</span>
              </div>
              <CommentTextarea
                onSubmit={(content) => handleSubmitComment(content)}
                onCancel={() => setActiveTextarea(false)}
                submitting={submitting}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 sm:mb-8 text-center p-4 border rounded-md bg-muted/50">
          <p className="text-sm mb-3">Please login to view and add comments</p>
          <SignInDialog
            trigger={
              <Button>Login to Comment</Button>
            }
            open={signInOpen}
            onOpenChange={setSignInOpen}
          />
        </div>
      )}

      {comments.length > 0 ? (
        <>
          <Separator className="mb-4 sm:mb-6" />
          <div className="space-y-4 sm:space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 sm:mb-4 opacity-20" />
          <p className="text-xs sm:text-sm">No comments yet. Be the first to join the conversation!</p>
        </div>
      )}
    </Card>
  );
}