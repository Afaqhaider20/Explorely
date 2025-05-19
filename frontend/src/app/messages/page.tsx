"use client";

import { useState, useEffect, useRef } from "react";
import { messages as initialMessages, users } from "@/data/demo-messages";
import { Message } from "@/components/message/MessageComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";
import { Users, MessageSquare, Send, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JoinedCommunity {
  _id: string;
  name: string;
  avatar: string;
  description: string;
}

export default function MessagesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [selectedCommunity, setSelectedCommunity] = useState<JoinedCommunity | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    // Set the first community as selected when user data is loaded
    if (user?.joinedCommunities && user.joinedCommunities.length > 0 && !selectedCommunity) {
      setSelectedCommunity(user.joinedCommunities[0]);
    }
  }, [user, token, router, selectedCommunity]);

  useEffect(() => {
    // Scroll to bottom of messages when they change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCommunity || !user) return;

    const newMsg = {
      id: `m${messages.length + 1}`,
      content: newMessage,
      timestamp: new Date().toISOString(),
      userId: user._id,
      communityId: selectedCommunity._id,
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  const filteredMessages = messages.filter((msg) => msg.communityId === selectedCommunity?._id);

  if (!user) {
    return null; // or a loading state
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* Communities Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </h2>
        </div>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              className="pl-8 bg-muted/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {user.joinedCommunities?.map((community) => (
                <button
                  key={community._id}
                  onClick={() => setSelectedCommunity(community)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                    "hover:bg-muted/50",
                    selectedCommunity?._id === community._id && "bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                    <AvatarImage src={community.avatar} alt={community.name} />
                    <AvatarFallback>{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{community.name}</p>
                      <Badge variant="secondary" className="ml-2">Group</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{community.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedCommunity ? (
          <>
            {/* Community Header */}
            <div className="h-16 flex items-center px-6 border-b bg-card shrink-0">
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 mr-4">
                <AvatarImage src={selectedCommunity.avatar} alt={selectedCommunity.name} />
                <AvatarFallback>{selectedCommunity.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-medium text-lg">{selectedCommunity.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Group Chat
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const messageUser = users.find((u) => u.id === msg.userId) || {
                      id: msg.userId,
                      name: user.username,
                      avatar: user.avatar
                    };
                    return <Message key={msg.id} message={msg} user={messageUser} />;
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder={`Message ${selectedCommunity.name}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a community</p>
            <p className="text-sm">to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
