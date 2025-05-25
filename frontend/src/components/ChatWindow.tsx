import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

interface ChatMessage {
  _id: string;
  content: string;
  timestamp: string;
  community: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
}

interface ChatWindowProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
  isChangingCommunity: boolean;
  autoScroll: boolean;
}

export function ChatWindow({
  messages,
  currentUserId,
  isLoading,
  isChangingCommunity,
  autoScroll,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [messages, autoScroll]);

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate: string | null = null;
    let currentGroup: ChatMessage[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const formattedDate = formatMessageDate(messageDate);

      if (formattedDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate!, messages: currentGroup });
        }
        currentDate = formattedDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate!, messages: currentGroup });
    }

    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isChangingCommunity) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef}>
      <div className="space-y-6">
        {messageGroups.map((group) => (
          <div key={group.date} className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {group.date}
              </div>
            </div>
            {group.messages.map((message) => (
              <div
                key={message._id}
                className={cn(
                  "flex items-start gap-3",
                  message.user._id === currentUserId ? "flex-row-reverse" : ""
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.user.avatar} alt={message.user.username} />
                  <AvatarFallback>{message.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[70%]",
                    message.user._id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {format(new Date(message.timestamp), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
} 