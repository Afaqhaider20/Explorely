import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

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

export function Message({ message, currentUserId }: MessageProps) {
  const isCurrentUser = message.user?._id === currentUserId;

  const renderMessageContent = (content: string, isImage: boolean) => {
    if (isImage) {
      return (
        <div className="relative w-64 h-64 rounded-lg overflow-hidden group">
          <Image
            src={content}
            alt="Message image"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          >
            <ExternalLink className="w-6 h-6 text-white" />
          </a>
        </div>
      );
    }

    // Parse URLs and render as links
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)|(www\.[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
    const parts = content.split(urlRegex);
    
    return (
      <div className="space-y-1">
        {parts.map((part, i) => {
          if (!part) return null;
          if (urlRegex.test(part)) {
            const href = part.startsWith('http') ? part : `https://${part}`;
            return (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 text-sm break-all",
                  isCurrentUser ? "text-primary-foreground underline" : "text-blue-600 hover:text-blue-700"
                )}
              >
                {part}
                <ExternalLink className="w-3 h-3" />
              </a>
            );
          }
          return <span key={i} className="text-sm">{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 group",
        isCurrentUser ? "flex-row-reverse" : ""
      )}
    >
      <Avatar className={cn(
        "h-8 w-8 transition-transform duration-200",
        "group-hover:scale-110"
      )}>
        <AvatarImage src={message.user?.avatar} alt={message.user?.username || 'Deleted User'} />
        <AvatarFallback className={cn(
          "text-xs font-medium",
          isCurrentUser ? "bg-primary/20 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
        )}>
          {(message.user?.username || 'DU').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isCurrentUser ? "flex-row-reverse" : ""
        )}>
          <span className={cn(
            "text-xs font-medium",
            isCurrentUser ? "text-primary" : "text-muted-foreground"
          )}>
            {message.user?.username || 'Deleted User'}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {format(new Date(message.timestamp), "h:mm a")}
          </span>
        </div>
        
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 break-words shadow-sm transition-all duration-200",
            "hover:shadow-md",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {renderMessageContent(message.content, message.isImage)}
        </div>
      </div>
    </div>
  );
} 