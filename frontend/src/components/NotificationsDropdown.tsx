import { useState, useCallback, useEffect } from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import axios from 'axios';
import Link from 'next/link';

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

interface NotificationsDropdownProps {
  token: string | null;
  isMobile?: boolean;
}

export function NotificationsDropdown({ token, isMobile = false }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseenNotificationCount, setUnseenNotificationCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const router = useRouter();

  // Mark notifications as seen
  const markNotificationsAsSeen = useCallback(async () => {
    if (!token) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-seen`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUnseenNotificationCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isSeen: true })));
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  }, [token]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get<{
        notifications: Notification[];
        unseenCount: number;
      }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/recent`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setNotifications(response.data.notifications);
      setUnseenNotificationCount(response.data.unseenCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [token]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;

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
      console.error('Error marking notifications as read:', error);
    }
  };

  // Mark a single notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/mark-read`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setNotifications(prev => prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }

    setIsNotificationsOpen(false);

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

  // Render notification content
  const renderNotificationContent = (notification: Notification) => {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    return (
      <div 
        className={cn(
          "flex items-start gap-3 transition-all duration-200 cursor-pointer relative rounded-lg",
          !notification.isRead 
            ? "bg-primary/5 hover:bg-primary/10" 
            : "hover:bg-muted/60",
          "border-l-2",
          !notification.isRead ? "border-l-primary" : "border-l-transparent",
          isMobile ? "p-3 rounded-md" : "p-4 rounded-lg"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <Avatar className={cn(
          "ring-2 ring-background shadow-sm",
          isMobile ? "h-9 w-9" : "h-10 w-10"
        )}>
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
            <div className="text-sm bg-muted/70 p-2.5 rounded-md italic text-muted-foreground border border-border/50 max-h-[60px] overflow-hidden">
              &ldquo;{notification.comment?.content || notification.reviewComment?.content}&rdquo;
            </div>
          )}
          
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
            {timeAgo}
          </p>
        </div>
        
        {!notification.isRead && (
          <div className={cn(
            "absolute rounded-full bg-primary animate-pulse",
            isMobile ? "right-3 top-3 w-2 h-2" : "right-4 top-4 w-2 h-2"
          )} />
        )}
      </div>
    );
  };

  // Handle notification dropdown open
  const handleNotificationsOpen = (open: boolean) => {
    setIsNotificationsOpen(open);
    if (open && unseenNotificationCount > 0) {
      markNotificationsAsSeen();
    }
  };

  // Fetch initial notifications
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token, fetchNotifications]);

  return (
    <DropdownMenu onOpenChange={handleNotificationsOpen} open={isNotificationsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative text-muted-foreground hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unseenNotificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse">
              {unseenNotificationCount > 99 ? '99+' : unseenNotificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className={cn(
          "p-0 overflow-hidden rounded-xl border shadow-lg",
          isMobile ? "w-[calc(100vw-2rem)]" : "w-96"
        )}
        align={isMobile ? "center" : "end"}
        sideOffset={5}
        side="bottom"
      >
        <div className={cn(
          "flex items-center justify-between py-4 px-5 border-b",
          isMobile ? "bg-muted/30" : "bg-gradient-to-r from-primary/5 to-transparent"
        )}>
          <h4 className={cn(
            "font-semibold flex items-center gap-2",
            isMobile ? "text-sm" : "text-base"
          )}>
            <Bell className={cn(
              "text-primary",
              isMobile ? "h-4 w-4" : "h-4 w-4"
            )} />
            Notifications
          </h4>
          {notifications.some(n => !n.isRead) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 text-xs font-medium",
                isMobile 
                  ? "hover:bg-muted/80 hover:text-foreground"
                  : "hover:bg-primary/10 hover:text-primary transition-colors"
              )}
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="max-h-[calc(90vh-12rem)] overflow-y-auto py-2 px-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                isMobile ? "bg-muted/50" : "bg-primary/5"
              )}>
                <Bell className={cn(
                  "w-7 h-7",
                  isMobile ? "text-muted-foreground/70" : "text-primary/70"
                )} />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">No notifications yet</p>
                <p className="text-sm">Your notifications will appear here</p>
              </div>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification._id} className="animate-in fade-in slide-in-from-right-3 duration-300">
                {renderNotificationContent(notification)}
              </div>
            ))
          )}
        </div>
        
        <div className={cn(
          "p-3 border-t text-center hover:bg-primary/5 transition-colors",
          isMobile ? "bg-muted/30 hover:bg-muted/50" : "bg-gradient-to-r from-primary/5 to-transparent"
        )}>
          <Link 
            href="/notifications" 
            className={cn(
              "text-primary hover:underline font-medium py-1.5 flex items-center justify-center gap-2",
              isMobile ? "text-xs" : "text-sm"
            )}
            onClick={() => setIsNotificationsOpen(false)}
          >
            View all notifications
            {!isMobile && <ArrowRight className="h-4 w-4" />}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 