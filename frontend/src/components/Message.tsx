import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";
import Image from "next/image";

interface MessageProps {
  message: {
    _id: string;
    content: string;
    isImage: boolean;
    timestamp: string;
    user: {
      _id: string;
      username: string;
      avatar: string;
    };
  };
  currentUserId: string;
}

// Helper to parse URLs and render as links
function renderMessageContent(content: string) {
  const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)|(www\.[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
  const parts = content.split(urlRegex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (urlRegex.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline break-all"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function Message({ message, currentUserId }: MessageProps) {
  const isCurrentUser = message.user?._id === currentUserId;

  const renderMessageContent = (content: string, isImage: boolean) => {
    if (isImage) {
      return (
        <div className="relative w-64 h-64 rounded-lg overflow-hidden">
          <Image
            src={content}
            alt="Message image"
            fill
            className="object-cover"
          />
        </div>
      );
    }
    return <p className="text-sm">{content}</p>;
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isCurrentUser ? "flex-row-reverse" : ""
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.user?.avatar} alt={message.user?.username || 'Deleted User'} />
        <AvatarFallback>{(message.user?.username || 'DU').slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col max-w-[70%]">
        <span className="text-xs font-medium text-muted-foreground mb-1">
          {message.user?.username || 'Deleted User'}
        </span>
        <div
          className={cn(
            "rounded-lg px-4 py-2 break-words",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {renderMessageContent(message.content, message.isImage)}
          <p className="text-xs mt-1 opacity-70">
            {format(new Date(message.timestamp), "h:mm a")}
          </p>
        </div>
      </div>
    </div>
  );
} 