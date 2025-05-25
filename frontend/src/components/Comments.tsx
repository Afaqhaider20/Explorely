"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/store/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Remove unused Textarea import
import { Reply, Heart, MessageSquare, Smile } from "lucide-react";
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
  post: string;
  parentComment: string | null;
  level: number;
  likes: string[];
  likeCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: CommentData[];
}

interface CommentsProps {
  postId: string;
  type?: 'post' | 'review';
  onCommentAdded?: () => void;
}

// Remove unused CommentReplyState interface

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
                <div className="absolute bottom-full right-0 z-50 emoji-picker-container mb-2">
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

export function Comments({ postId, type = 'post', onCommentAdded }: CommentsProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTextarea, setActiveTextarea] = useState<{ type: 'new' | 'reply', id?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [signInOpen, setSignInOpen] = useState(false);
  const { token, user } = useAuth();
  
  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        getApiUrl(`api/${type}/${postId}/comments`)
      );
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId, type]);

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
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply._id === commentId) {
                const newLikeCount = reply.likeCount + (likedComments.has(commentId) ? -1 : 1);
                return { ...reply, likeCount: newLikeCount };
              }
              return reply;
            })
          };
        }
        return comment;
      });
    });

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}/like`,
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
      
      // Update comment like count directly instead of refetching all comments
      setComments(prevComments => 
        updateCommentLikeCount(prevComments, commentId, data.likeCount)
      );
      
      // Show appropriate toast message
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
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply._id === commentId) {
                  const newLikeCount = reply.likeCount + (likedComments.has(commentId) ? 1 : -1);
                  return { ...reply, likeCount: newLikeCount };
                }
                return reply;
              })
            };
          }
          return comment;
        });
      });
    }
  };
  
  // Helper function to update like count in nested comments structure
  const updateCommentLikeCount = (comments: CommentData[], commentId: string, newLikeCount: number): CommentData[] => {
    return comments.map(comment => {
      if (comment._id === commentId) {
        return { ...comment, likeCount: newLikeCount };
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikeCount(comment.replies, commentId, newLikeCount)
        };
      }
      
      return comment;
    });
  };

  const handleSubmitComment = async (content: string, parentCommentId: string | null) => {
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
      post: postId,
      parentComment: parentCommentId,
      level: parentCommentId ? 1 : 0,
      likes: [],
      likeCount: 0,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add the comment to the UI
    setComments(prevComments => {
      if (parentCommentId) {
        // Add as a reply
        return prevComments.map(comment => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), tempComment],
            };
          }
          return comment;
        });
      } else {
        // Add as a top-level comment
        return [tempComment, ...prevComments];
      }
    });

    try {
      const response = await axios.post(
        getApiUrl(`api/${type}/${postId}/comments`),
        { content, parentCommentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Replace the temporary comment with the real one
      setComments(prevComments => {
        if (parentCommentId) {
          return prevComments.map(comment => {
            if (comment._id === parentCommentId) {
              return {
                ...comment,
                replies: comment.replies?.map(reply => 
                  reply._id === tempComment._id ? response.data.data.comment : reply
                ) || [],
              };
            }
            return comment;
          });
        } else {
          return prevComments.map(comment => 
            comment._id === tempComment._id ? response.data.data.comment : comment
          );
        }
      });

      setActiveTextarea(null);
      toast.success(parentCommentId ? "Reply posted successfully" : "Comment posted successfully");
      onCommentAdded?.();
    } catch (error) {
      // Remove the temporary comment on error
      setComments(prevComments => {
        if (parentCommentId) {
          return prevComments.map(comment => {
            if (comment._id === parentCommentId) {
              return {
                ...comment,
                replies: comment.replies?.filter(reply => reply._id !== tempComment._id) || [],
              };
            }
            return comment;
          });
        } else {
          return prevComments.filter(comment => comment._id !== tempComment._id);
        }
      });

      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Close any open textarea when component unmounts
  useEffect(() => {
    return () => {
      setActiveTextarea(null);
    };
  }, []);

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => {
    const { user } = useAuth();
    const canReply = comment.level < 6;
    const isReplyOpen = activeTextarea?.type === 'reply' && activeTextarea?.id === comment._id;
    const hasLiked = likedComments.has(comment._id);
    const borderColors = [
      "border-primary/30", 
      "border-blue-400/30", 
      "border-purple-400/30",
      "border-green-400/30",
      "border-orange-400/30",
      "border-pink-400/30"
    ];
    const bgColors = [
      "bg-primary/5", 
      "bg-blue-400/5", 
      "bg-purple-400/5",
      "bg-green-400/5",
      "bg-orange-400/5",
      "bg-pink-400/5"
    ];
    
    const handleReplyClick = () => {
      if (!user) {
        toast.error("Please log in to reply to comments");
        setSignInOpen(true);
        return;
      }
      setActiveTextarea(isReplyOpen ? null : { type: 'reply', id: comment._id });
    };
    
    return (
      <div 
        className={cn(
          "border-l-2 pl-2 sm:pl-4 rounded-l",
          borderColors[depth % borderColors.length],
          depth > 0 ? "mt-3 sm:mt-4" : "mt-4 sm:mt-6"
        )}
      >
        <div className={cn(
          "p-2 sm:p-4 rounded", 
          bgColors[depth % bgColors.length]
        )}>
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 ring-1 ring-primary/20">
              <AvatarImage src={comment.author.avatar} alt={comment.author.username} />
              <AvatarFallback className="text-xs">{comment.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-2">
              <Link 
                href={comment.author._id === user?._id ? '/profile' : `/profile/${comment.author._id}`} 
                className="text-xs sm:text-sm font-medium hover:text-primary transition-colors"
              >
                {comment.author.username}
              </Link>
              <span className="text-xs text-muted-foreground hidden xs:inline">•</span>
              <span className="text-[10px] xs:text-xs text-muted-foreground">
                {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true })}
                {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
              </span>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm mb-2 sm:mb-3 whitespace-pre-wrap">{comment.content}</p>
          
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
            <button 
              onClick={() => handleLikeComment(comment._id)}
              className={cn(
                "flex items-center gap-1 hover:text-primary transition-colors",
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
            
            {canReply && (
              <button 
                onClick={handleReplyClick}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Reply className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Reply</span>
              </button>
            )}
          </div>
          
          {isReplyOpen && (
            <div className="mt-3 sm:mt-4">
              <CommentTextarea
                onSubmit={(content) => handleSubmitComment(content, comment._id)}
                onCancel={() => setActiveTextarea(null)}
                submitting={submitting}
                placeholder="Write a thoughtful reply..."
              />
            </div>
          )}
        </div>
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-1">
            {comment.replies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
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
          {activeTextarea?.type !== 'new' ? (
            <Button
              onClick={() => setActiveTextarea({ type: 'new' })}
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
                onSubmit={(content) => handleSubmitComment(content, null)}
                onCancel={() => setActiveTextarea(null)}
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
          <div className="space-y-3 sm:space-y-6">
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
