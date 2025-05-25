import { type FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";

interface MessageProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    userId: string;
  };
  user: {
    id: string;
    name: string;
    avatar: string;
  };
}

export const Message: FC<MessageProps> = ({ message, user }) => {
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?._id === message.userId;

  return (
    <div
      className={cn(
        "flex w-full items-end mb-2",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      {/* Bubble and timestamp */}
      <div className={cn("flex flex-col items-start", isCurrentUser && "items-end")}> 
        <div
          className={cn(
            "max-w-[70%] min-w-[60px] px-4 py-2 rounded-2xl shadow-sm relative",
            isCurrentUser
              ? "bg-blue-600 text-white ml-2 rounded-br-md"
              : "bg-gray-100 text-gray-900 mr-2 rounded-bl-md border border-gray-200"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-xs font-semibold",
              isCurrentUser ? "text-white/80" : "text-gray-700"
            )}>{user.name}</span>
          </div>
          <div className="break-words text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] mt-1",
            isCurrentUser ? "text-right text-white/60 pr-2" : "text-left text-gray-500 pl-2"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      {/* Avatar for current user (right) */}
      {isCurrentUser && (
        <Avatar className="h-8 w-8 ml-2">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

interface CommunityIconProps {
  name: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

export const CommunityIcon: FC<CommunityIconProps> = ({
  name,
  icon,
  isSelected,
  onClick,
}) => (
  <div
    className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
      isSelected 
        ? "bg-blue-100 text-blue-600" 
        : "bg-white text-slate-600 hover:bg-slate-100"
    }`}
    onClick={onClick}
    title={name}
  >
    <span className="text-xl">{icon}</span>
  </div>
);

interface ChannelItemProps {
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

export const ChannelItem: FC<ChannelItemProps> = ({
  name,
  isSelected,
  onClick,
}) => (
  <li
    className={`px-2 py-1 rounded cursor-pointer flex items-center ${
      isSelected
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100"
    }`}
    onClick={onClick}
  >
    <span className="mr-1">#</span>
    {name}
  </li>
);
