'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Bell, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useInView } from 'react-intersection-observer';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  type: 'POST_LIKE' | 'COMMENT_LIKE' | 'COMMENT_REPLY' | 'REVIEW_LIKE' | 'REVIEW_COMMENT' | 'REVIEW_COMMENT_LIKE' | 'POST_COMMENT' | 'COMMUNITY_POST' | 'COMMUNITY_ITINERARY';
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  post?: {
    _id: string;
    title: string;
  };
  comment?: {
    _id: string;
    content: string;
  };
  review?: {
    _id: string;
    title: string;
  };
  reviewComment?: {
    _id: string;
    content: string;
  };
  community?: {
    _id: string;
    name: string;
  };
  itinerary?: {
    _id: string;
    title: string;
  };
  isRead: boolean;
  isSeen: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { ref, inView } = useInView();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (pageNum: number) => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<{
        notifications: Notification[];
        hasMore: boolean;
      }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?page=${pageNum}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (pageNum === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setHasMore(response.data.hasMore);
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        // Handle unauthorized error silently
        setError(null);
      } else {
        setError('Failed to load notifications');
        console.error('Error fetching notifications:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!token && !isLoading) {
      router.push('/');
    }
  }, [token, isLoading, router]);

  // Fetch initial notifications only when token is available
  useEffect(() => {
    if (token) {
      fetchNotifications(1);
    }
  }, [token, fetchNotifications]);

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasMore && !isLoading && token) {
      const nextPage = page + 1;
      fetchNotifications(nextPage);
      setPage(nextPage);
    }
  }, [inView, hasMore, isLoading, token, fetchNotifications, page]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/mark-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }

    switch (notification.type) {
      case 'POST_LIKE':
      case 'POST_COMMENT':
      case 'COMMENT_LIKE':
      case 'COMMENT_REPLY':
        if (notification.post?._id) {
          router.push(`/posts/${notification.post._id}`);
        }
        break;
      case 'REVIEW_LIKE':
      case 'REVIEW_COMMENT':
      case 'REVIEW_COMMENT_LIKE':
        if (notification.review?._id) {
          router.push(`/reviews/${notification.review._id}`);
        }
        break;
      case 'COMMUNITY_POST':
        if (notification.post?._id) {
          router.push(`/posts/${notification.post._id}`);
        }
        break;
      case 'COMMUNITY_ITINERARY':
        if (notification.itinerary?._id) {
          router.push(`/community-itineraries/${notification.community?._id}/${notification.itinerary._id}`);
        }
        break;
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    return (
      <div 
        className={cn(
          "flex items-start gap-4 p-4 transition-all duration-200 cursor-pointer relative rounded-lg border",
          !notification.isRead 
            ? "bg-primary/5 hover:bg-primary/10 border-primary/20" 
            : "hover:bg-muted/60 border-border/50",
          "border-l-2",
          !notification.isRead ? "border-l-primary" : "border-l-transparent"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
          <AvatarImage src={notification.sender.avatar} alt={notification.sender.username} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {notification.sender.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <p className="text-sm leading-tight">
            <span className="font-semibold text-foreground">{notification.sender.username}</span>{' '}
            <span className="text-muted-foreground">
              {notification.type === 'POST_LIKE' && 'liked your post '}
              {notification.type === 'COMMENT_LIKE' && 'liked your comment'}
              {notification.type === 'COMMENT_REPLY' && 'replied to your comment'}
              {notification.type === 'POST_COMMENT' && 'commented on your post '}
              {notification.type === 'REVIEW_LIKE' && 'liked your review '}
              {notification.type === 'REVIEW_COMMENT' && 'commented on your review '}
              {notification.type === 'REVIEW_COMMENT_LIKE' && 'liked your comment on '}
              {notification.type === 'COMMUNITY_POST' && 'created a new post in '}
              {notification.type === 'COMMUNITY_ITINERARY' && 'created a new itinerary in '}
            </span>
            {notification.type === 'COMMUNITY_POST' && (
              <>
                <span className="font-medium text-foreground">
                  &ldquo;{notification.community?.name}&rdquo;
                </span>
                <span className="text-muted-foreground">: </span>
                <span className="font-medium text-foreground">
                  &ldquo;{notification.post?.title}&rdquo;
                </span>
              </>
            )}
            {notification.type === 'COMMUNITY_ITINERARY' && (
              <>
                <span className="font-medium text-foreground">
                  &ldquo;{notification.community?.name}&rdquo;
                </span>
                <span className="text-muted-foreground">: </span>
                <span className="font-medium text-foreground">
                  &ldquo;{notification.itinerary?.title}&rdquo;
                </span>
              </>
            )}
            {(notification.type === 'POST_LIKE' || notification.type === 'REVIEW_LIKE' || 
              notification.type === 'REVIEW_COMMENT' || notification.type === 'REVIEW_COMMENT_LIKE') && (
              <span className="font-medium text-foreground">
                &ldquo;{notification.post?.title || notification.review?.title}&rdquo;
              </span>
            )}
          </p>
          
          {(notification.type === 'COMMENT_LIKE' || notification.type === 'COMMENT_REPLY' || 
            notification.type === 'REVIEW_COMMENT' || notification.type === 'REVIEW_COMMENT_LIKE') && (
            <div className="text-sm bg-muted/70 p-3 rounded-md italic text-muted-foreground border border-border/50 max-h-[60px] overflow-hidden">
              &ldquo;{notification.comment?.content || notification.reviewComment?.content}&rdquo;
            </div>
          )}
          
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
            {timeAgo}
          </p>
        </div>
        
        {!notification.isRead && (
          <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>
    );
  };

  if (!token) {
    return null; // Don't render anything while checking authentication
  }

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stay updated with your latest activities
            </p>
          </div>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-4 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
            <Bell className="w-10 h-10 text-primary/70" />
          </div>
          <div>
            <p className="font-medium text-foreground text-lg mb-1">No notifications yet</p>
            <p className="text-sm">Your notifications will appear here when you receive them</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className="animate-in fade-in slide-in-from-right-3 duration-300"
            >
              {renderNotificationContent(notification)}
            </div>
          ))}
          
          {hasMore && (
            <div 
              ref={ref} 
              className="py-4 text-center"
            >
              <div className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading more...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 