"use client"

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';
import type { Comment } from '@/data/comments';

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
}

export function CommentSection({ comments, postId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    // Using postId when submitting the comment
    const commentData = {
      postId,
      content: newComment,
      // Add other necessary data
    };
    
    console.log('Submitting comment:', commentData);
    setNewComment('');
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${!isReply ? 'py-6' : 'py-4'} animate-in fade-in-50`}>
      <div className="flex gap-4">
        <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm flex-shrink-0">
          <AvatarImage src={comment.author.image} />
          <AvatarFallback className="text-xs font-medium">
            {comment.author.name[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold hover:text-primary cursor-pointer">
              {comment.author.name}
            </span>
            <span className="text-sm text-muted-foreground">{comment.timeAgo}</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{comment.content}</p>
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1 bg-muted/50 rounded-full">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:text-primary">
                <ArrowBigUp className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[2rem] text-center">{comment.upvotes}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:text-destructive">
                <ArrowBigDown className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-sm rounded-full hover:bg-muted/50"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Reply
            </Button>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <div key={reply.id} className="pl-4 border-l-2 border-border/40">
                  {renderComment(reply, true)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-8 bg-card rounded-xl border">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-6">Comments ({comments.length})</h3>
        <div className="flex gap-4">
          <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What are your thoughts?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none border-muted/30 focus-visible:ring-1"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="px-6"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <div className="p-6">
        {comments.length > 0 ? (
          <div className="space-y-1 divide-y divide-border/40">
            {comments.map(comment => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}
