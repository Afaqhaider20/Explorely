"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/store/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Remove unused Textarea import
import { Reply, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
}

// Remove unused CommentReplyState interface

export function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const { token, user } = useAuth();
  
  // Use refs for direct DOM access
  const newCommentRef = useRef<HTMLTextAreaElement>(null);
  const replyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const url = `${baseUrl}/api/post/${postId}/comments`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.data || !Array.isArray(data.data.comments)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setComments(data.data.comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError(err instanceof Error ? err.message : "Error loading comments");
    } finally {
      setLoading(false);
    }
  }, [postId, token]);

  useEffect(() => {
    if (token) {
      fetchComments();
    } else {
      setLoading(false);
      setError("Authentication required to view comments");
    }
  }, [token, fetchComments]);

  const handleLikeComment = async (commentId: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      // Updated URL to match the correct endpoint format
      const url = `${baseUrl}/api/comments/${commentId}/like`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      const data = await response.json();
      
      // Update local state based on the response
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (data.data.hasLiked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });
      
      // Update comment like count directly instead of refetching all comments
      setComments(prevComments => 
        updateCommentLikeCount(prevComments, commentId, data.data.likeCount)
      );
      
      // Show appropriate toast message
      toast.success(data.data.hasLiked ? "Comment liked" : "Comment unliked");
      
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like status");
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

  const handleSubmitReply = async (parentId: string) => {
    const replyTextarea = replyRefs.current[parentId];
    if (!replyTextarea || !replyTextarea.value.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    const content = replyTextarea.value;
    setSubmitting(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${baseUrl}/api/post/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: content,
            parentCommentId: parentId
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit reply");
      }

      setReplyToComment(null);
      toast.success("Reply posted successfully");
      fetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNewComment = async () => {
    if (!newCommentRef.current || !newCommentRef.current.value.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const content = newCommentRef.current.value;
    setSubmitting(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${baseUrl}/api/post/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: content,
            parentCommentId: null
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit comment");
      }

      // Clear the textarea
      if (newCommentRef.current) {
        newCommentRef.current.value = '';
      }
      
      toast.success("Comment posted successfully");
      fetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Close any open reply when component unmounts
  useEffect(() => {
    return () => {
      setReplyToComment(null);
    };
  }, []);

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => {
    const canReply = comment.level < 3;
    const isReplyOpen = replyToComment === comment._id;
    const hasLiked = likedComments.has(comment._id);
    const borderColors = ["border-primary/30", "border-blue-400/30", "border-purple-400/30"];
    const bgColors = ["bg-primary/5", "bg-blue-400/5", "bg-purple-400/5"];
    
    // Fix ref assignment for the textarea
    const setTextAreaRef = useCallback((el: HTMLTextAreaElement | null) => {
      if (comment._id) {
        replyRefs.current[comment._id] = el;
      }
    }, [comment._id]);
    
    // Focus the textarea when reply opens
    useEffect(() => {
      if (isReplyOpen && replyRefs.current[comment._id]) {
        setTimeout(() => {
          replyRefs.current[comment._id]?.focus();
        }, 50);
      }
    }, [isReplyOpen, comment._id]);
    
    return (
      <div 
        className={cn(
          "border-l-2 pl-4 rounded-l",
          borderColors[depth % borderColors.length],
          depth > 0 ? "mt-4" : "mt-6"
        )}
      >
        <div className={cn(
          "p-4 rounded", 
          bgColors[depth % bgColors.length]
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-7 w-7 ring-1 ring-primary/20">
              <AvatarImage src={comment.author.avatar} alt={comment.author.username} />
              <AvatarFallback className="text-xs">{comment.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
              <span className="text-sm font-medium">{comment.author.username}</span>
              <span className="text-xs text-muted-foreground hidden xs:inline">•</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true })}
                {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
              </span>
            </div>
          </div>
          
          <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button 
              onClick={() => handleLikeComment(comment._id)}
              className={cn(
                "flex items-center gap-1 hover:text-primary transition-colors",
                hasLiked && "text-primary"
              )}
              disabled={hasLiked}
            >
              <Heart className={cn(
                "h-3.5 w-3.5",
                hasLiked && "fill-current"
              )} />
              <span>{comment.likeCount || 0}</span>
            </button>
            
            {canReply && (
              <button 
                onClick={() => setReplyToComment(isReplyOpen ? null : comment._id)}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Reply className="h-3.5 w-3.5" />
                <span>Reply</span>
              </button>
            )}
          </div>
          
          {isReplyOpen && (
            <div className="mt-4 border rounded-md p-3 bg-background">
              <textarea
                ref={setTextAreaRef}
                placeholder="Write a thoughtful reply..."
                className="w-full min-h-[100px] mb-2 bg-transparent p-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                defaultValue=""
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setReplyToComment(null);
                    // Clear the ref when canceling
                    if (replyRefs.current[comment._id]) {
                      replyRefs.current[comment._id]!.value = '';
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleSubmitReply(comment._id)}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Reply"}
                </Button>
              </div>
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
    <Card className="p-6 shadow-md">
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Comments</h2>
        {comments.length > 0 && (
          <span className="text-sm text-muted-foreground">({comments.length})</span>
        )}
      </div>
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {user && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback>{user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
          )}
          <span className="text-sm font-medium">Add a comment</span>
        </div>
        
        <textarea
          ref={newCommentRef}
          placeholder="What are your thoughts?"
          className="w-full min-h-[120px] mb-3 resize-y p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          defaultValue=""
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitNewComment}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {comments.length > 0 ? (
        <>
          <Separator className="mb-6" />
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-4 opacity-20" />
          <p>No comments yet. Be the first to join the conversation!</p>
        </div>
      )}
    </Card>
  );
}
