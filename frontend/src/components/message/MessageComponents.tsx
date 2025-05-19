import { type FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Message as MessageType } from "@/data/demo-messages";

interface MessageProps {
  message: MessageType;
  user: User;
}

export const Message: FC<MessageProps> = ({ message, user }) => {
  return (
    <div className="flex items-start gap-3 py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-muted-foreground break-words">{message.content}</p>
      </div>
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
