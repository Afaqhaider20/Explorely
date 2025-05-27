"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";
import { Users, MessageSquare, Send, Search, ChevronLeft, Smile } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { ChatWindow } from "@/components/ChatWindow";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface JoinedCommunity {
  _id: string;
  name: string;
  avatar: string;
  description: string;
  unreadCount?: number;
}

interface ChatMessage {
  _id: string;
  content: string;
  isImage: boolean;
  timestamp: string;
  community: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
}

interface CommunityWithLastMessage {
  community: {
    _id: string;
    name: string;
    avatar: string;
    description: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    sender: {
      _id: string;
      username: string;
      avatar: string;
    };
  } | null;
  messageCount: number;
  unreadCount: number;
  lastRead: string;
}

export default function MessagesPage() {
  const { user, token, isInitialized } = useAuth();
  const { socket, isConnected } = useSocket();
  const [selectedCommunity, setSelectedCommunity] = useState<JoinedCommunity | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCommunitiesLoading, setIsCommunitiesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [communitiesWithLastMessage, setCommunitiesWithLastMessage] = useState<CommunityWithLastMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);
  const previousCommunityRef = useRef<string | null>(null);
  const [isChangingCommunity, setIsChangingCommunity] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track last processed message IDs for each community

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for auth context to be initialized
        if (!isInitialized) {
          return;
        }

        // If no token after initialization, show error
        if (!token) {
          toast.error("Authentication required", {
            description: "Please sign in to access messages"
          });
          setIsAuthLoading(false);
          return;
        }

        // Verify token is valid
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          if (response.data) {
            setIsAuthLoading(false);
          } else {
            throw new Error('Profile data not found');
          }
        } catch {
          toast.error("Authentication failed", {
            description: "Please try signing in again"
          });
          setIsAuthLoading(false);
        }
      } catch {
        toast.error("Authentication failed", {
          description: "Please try signing in again"
        });
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [token, isInitialized]);

  useEffect(() => {
    const fetchCommunitiesWithLastMessage = async () => {
      if (!token || isAuthLoading || !isInitialized) return;

      try {
        setIsCommunitiesLoading(true);
        const response = await axios.get<CommunityWithLastMessage[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/communities-last-messages`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setCommunitiesWithLastMessage(response.data);
      } catch (error) {
        console.error('Error fetching communities with last messages:', error);
        toast.error("Failed to fetch communities", {
          description: "Please try again later"
        });
      } finally {
        setIsCommunitiesLoading(false);
      }
    };

    fetchCommunitiesWithLastMessage();
  }, [token, isAuthLoading, isInitialized]);

  const fetchMessages = useCallback(async (communityId: string) => {
    if (!token) return;
    
    try {
      setIsLoading(true);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/community/${communityId}?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessages(response.data);
    } catch {
      toast.error("Failed to fetch messages", {
        description: "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Modify the socket initialization effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializeSocket = () => {
      if (socket && isConnected) {
        console.log('Socket is connected, setting initialized state');
        setIsSocketInitialized(true);
        retryCount = 0;
      } else {
        console.log('Socket not connected, attempting to connect');
        setIsSocketInitialized(false);
        
        if (retryCount < MAX_RETRIES) {
          // Try to reconnect after a short delay
          timeoutId = setTimeout(() => {
            if (socket) {
              console.log(`Attempting to connect (attempt ${retryCount + 1}/${MAX_RETRIES})`);
              socket.connect();
              retryCount++;
            }
          }, 1000);
        } else {
          console.log('Max retry attempts reached');
          // Force a new socket connection
          if (socket) {
            socket.disconnect();
          }
          retryCount = 0;
        }
      }
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (socket) {
        // Leave any joined community room
        if (previousCommunityRef.current) {
          socket.emit('leave_community', previousCommunityRef.current);
          previousCommunityRef.current = null;
        }
      }
    };
  }, [socket, isConnected]);

  // Separate effect for socket message listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('Setting up message listeners');

    const handleNewMessage = (message: ChatMessage) => {
      console.log('=== New message received for chat window ===');
      console.log('Message details:', {
        id: message._id,
        content: message.content,
        isImage: message.isImage,
        timestamp: message.timestamp,
        sender: {
          id: message.user._id,
          username: message.user.username
        },
        community: message.community
      });
      console.log('Is message from current user:', message.user._id === user?._id);

      // Update messages list, replacing temporary message if it exists
      setMessages(prev => {
        // If this is our own message
        if (message.user._id === user?._id) {
          console.log('Processing own message - replacing temporary message');
          // Check if we already have this message by ID
          const messageExists = prev.some(msg => 
            msg._id === message._id || 
            (msg._id.startsWith('temp-') && msg.content === message.content)
          );

          if (messageExists) {
            console.log('Message already exists in chat, skipping');
            return prev;
          }

          console.log('Replacing temporary message with real one');
          // Remove temporary message and add real one
          return prev.filter(msg => 
            !(msg._id.startsWith('temp-') && msg.content === message.content)
          ).concat(message);
        }

        console.log('Processing message from other user');
        // For messages from other users, only check message ID
        const messageExists = prev.some(msg => msg._id === message._id);

        if (messageExists) {
          console.log('Message already exists in chat, skipping');
          return prev;
        }

        console.log('Adding new message from other user to chat');
        return [...prev, message];
      });
      
      // Update communities sidebar with the new message
      setCommunitiesWithLastMessage(prev => {
        const communityIndex = prev.findIndex(
          comm => comm.community._id === message.community
        );
        
        if (communityIndex === -1) return prev;
        
        const updated = [...prev];
        updated[communityIndex] = {
          ...updated[communityIndex],
          lastMessage: {
            content: message.content,
            timestamp: message.timestamp,
            sender: message.user
          }
        };
        
        // Move the updated community to the top of the list
        const updatedCommunity = updated.splice(communityIndex, 1)[0];
        return [updatedCommunity, ...updated];
      });
    };

    const handleUnreadLastMessageUpdate = (data: { 
      communityId: string; 
      lastMessage: {
        _id: string;
        content: string;
        timestamp: string;
        sender: {
          _id: string;
          username: string;
          avatar: string;
        };
      };
    }) => {
      console.log('=== New message update received for sidebar ===');
      console.log('Community ID:', data.communityId);
      console.log('Last Message:', {
        _id: data.lastMessage._id,
        content: data.lastMessage.content,
        timestamp: data.lastMessage.timestamp,
        sender: {
          username: data.lastMessage.sender.username,
          id: data.lastMessage.sender._id
        }
      });
      console.log('Current User ID:', user?._id);
      console.log('Is message from current user:', data.lastMessage.sender._id === user?._id);
      
      setCommunitiesWithLastMessage(prev => {
        const communityIndex = prev.findIndex(msg => msg.community._id === data.communityId);
        console.log('Community found in list:', communityIndex !== -1);
        
        // Create updated community data
        const updatedCommunityData = {
          community: communityIndex !== -1 ? prev[communityIndex].community : { 
            _id: data.communityId, 
            name: '', 
            avatar: '', 
            description: '' 
          },
          lastMessage: {
            ...data.lastMessage,
            content: data.lastMessage.content === '' ? 'Image' : data.lastMessage.content
          },
          messageCount: communityIndex !== -1 ? prev[communityIndex].messageCount : 0,
          unreadCount: 0,
          lastRead: new Date().toISOString()
        };

        // Determine if we should increment unread count
        const shouldIncrement = data.lastMessage.sender._id !== user?._id && 
                              selectedCommunity?._id !== data.communityId;
        
        if (shouldIncrement) {
          updatedCommunityData.unreadCount = (communityIndex !== -1 ? prev[communityIndex].unreadCount : 0) + 1;
        } else {
          updatedCommunityData.unreadCount = communityIndex !== -1 ? prev[communityIndex].unreadCount : 0;
        }

        console.log('Updated community data:', {
          communityId: updatedCommunityData.community._id,
          unreadCount: updatedCommunityData.unreadCount,
          shouldIncrement,
          lastMessage: updatedCommunityData.lastMessage.content
        });

        // If community exists, remove it and add updated version at the beginning
        if (communityIndex !== -1) {
          const updated = [...prev];
          updated.splice(communityIndex, 1);
          return [updatedCommunityData, ...updated];
        }

        // If community doesn't exist, add it at the beginning
        return [updatedCommunityData, ...prev];
      });
    };

    const handleMessagesRead = (data: { userId: string; communityId: string }) => {
      // Only update if the messages were read by the current user
      if (data.userId === user?._id) {
        setCommunitiesWithLastMessage(prev => {
          const communityIndex = prev.findIndex(msg => msg.community._id === data.communityId);
          if (communityIndex === -1) return prev;
          
          const updated = [...prev];
          updated[communityIndex] = {
            ...updated[communityIndex],
            unreadCount: 0
          };
          return updated;
        });
      }
    };

    // Set up socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('unread_last_message_update', handleUnreadLastMessageUpdate);
    socket.on('messages_read', handleMessagesRead);

    // Cleanup function
    return () => {
      console.log('Cleaning up message listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('unread_last_message_update', handleUnreadLastMessageUpdate);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, user, selectedCommunity]);

  // Modify the community selection effect
  useEffect(() => {
    if (!selectedCommunity || !isSocketInitialized || !socket || !token || isAuthLoading || !isInitialized) {
      return;
    }

    // Only proceed if the community has changed
    if (previousCommunityRef.current === selectedCommunity._id) {
      return;
    }

    const joinCommunity = async () => {
      try {
        // Leave previous community room if any
        if (previousCommunityRef.current) {
          socket.emit('leave_community', previousCommunityRef.current);
        }

        // Update previous community reference
        previousCommunityRef.current = selectedCommunity._id;

        // Join new community room
        socket.emit('join_community', selectedCommunity._id);

        // Mark messages as read
        socket.emit('mark_messages_read', { communityId: selectedCommunity._id });

        // Fetch messages for the selected community
        await fetchMessages(selectedCommunity._id);
      } catch (error) {
        console.error('Error joining community:', error);
        toast.error("Failed to join community", {
          description: "Please try again"
        });
      } finally {
        setIsChangingCommunity(false);
      }
    };

    joinCommunity();
  }, [selectedCommunity, isSocketInitialized, socket, fetchMessages, token, isAuthLoading, isInitialized]);

  // Handle community selection with mobile responsiveness
  const handleCommunitySelect = useCallback((community: JoinedCommunity) => {
    if (community._id === selectedCommunity?._id) return;
    
    setIsChangingCommunity(true);
    setSelectedCommunity(community);
    setMessages([]); // Clear messages before loading new ones
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [selectedCommunity]);

  // Modified scroll behavior
  useEffect(() => {
    if (!messages.length) return;
    
    // Always scroll to bottom when messages are loaded or new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
  }, [messages]);
  
  // Handle scroll events to determine if user has scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If user is near bottom (within 100px), enable auto-scroll
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !selectedCommunity || !socket || !isConnected || !token || isAuthLoading || !isInitialized) {
      console.log('Cannot send message:', {
        hasMessage: !!newMessage.trim(),
        hasImage: !!selectedImage,
        hasCommunity: !!selectedCommunity,
        hasSocket: !!socket,
        isConnected,
        hasToken: !!token,
        isAuthLoading,
        isInitialized
      });
      return;
    }

    try {
      const messageContent = newMessage.trim();
      const isImage = !!selectedImage;
      
      // Create a temporary message object
      const tempMessage: ChatMessage = {
        _id: 'temp-' + Date.now(),
        content: isImage ? imagePreview || '' : messageContent,
        isImage,
        timestamp: new Date().toISOString(),
        community: selectedCommunity._id,
        user: {
          _id: user?._id || '',
          username: user?.username || '',
          avatar: user?.avatar || ''
        }
      };

      // Add the message to the local state immediately
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      setAutoScroll(true);

      // Emit the message to the server with acknowledgment
      socket.emit('send_message', {
        content: isImage ? imagePreview || '' : messageContent,
        isImage,
        communityId: selectedCommunity._id
      }, (error: Error | null) => {
        if (error) {
          // Remove the temporary message if there was an error
          setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
          toast.error("Failed to send message", {
            description: error.message || "Please try again"
          });
        }
      });
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast.error("Failed to send message", {
        description: "Please try again"
      });
    }
  };

  // Memoize the message input handler to prevent re-renders
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  }, []);

  // Prevent scrolling of body when sidebar is open on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Open sidebar by default on mobile when page loads
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Add click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  // Show loading state while checking authentication, loading communities, or initializing socket
  if (!isInitialized || isAuthLoading || isCommunitiesLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!user || !token) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-medium mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access messages</p>
        </div>
      </div>
    );
  }

  // Show reconnecting state if socket is not initialized
  if (!isSocketInitialized) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-medium mb-2">Connecting...</h2>
          <p className="text-muted-foreground">Please wait while we establish the connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background relative">
      {/* Sidebar Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Communities Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-screen bg-card border-r flex flex-col z-40 transition-transform duration-300 md:relative md:translate-x-0 md:w-80 md:z-0 md:flex md:h-auto md:border-r md:bg-card",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between md:justify-start">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </h2>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-auto"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              className="pl-8 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {communitiesWithLastMessage.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchQuery ? 'No communities found' : 'No communities joined yet'}
                </div>
              ) : (
                communitiesWithLastMessage
                  .filter(community => 
                    community.community.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((communityData) => (
                    <button
                      key={communityData.community._id}
                      onClick={() => handleCommunitySelect(communityData.community)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/30",
                        "hover:bg-muted/50",
                        selectedCommunity?._id === communityData.community._id ? "bg-muted/70" : ""
                      )}
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={communityData.community.avatar} alt={communityData.community.name} />
                        <AvatarFallback>{communityData.community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{communityData.community.name}</p>
                          <div className="flex flex-col items-end min-w-[3.5rem]">
                            {communityData.lastMessage && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(communityData.lastMessage.timestamp), 'h:mm a')}
                              </p>
                            )}
                            {communityData.unreadCount > 0 && (
                              <Badge variant="default" className="mt-1 text-xs scale-75 origin-right">
                                {communityData.unreadCount > 99 ? '99+' : communityData.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground truncate w-40">
                            {communityData.lastMessage 
                              ? `${communityData.lastMessage.sender.username}: ${communityData.lastMessage.content}`
                              : communityData.messageCount > 0
                                ? `${communityData.messageCount} message${communityData.messageCount === 1 ? '' : 's'}`
                                : "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        {selectedCommunity ? (
          <>
            {/* Community Header */}
            <div className="h-16 flex items-center px-6 border-b bg-card shrink-0 relative">
              {/* Hamburger menu in header for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden absolute left-0 top-1/2 -translate-y-1/2"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Avatar className="h-10 w-10 ring-1 ring-primary/10 border border-border mr-4 ml-8 md:ml-0">
                <AvatarImage src={selectedCommunity.avatar} alt={selectedCommunity.name} />
                <AvatarFallback>{selectedCommunity.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-lg truncate">{selectedCommunity.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="truncate">Group Chat</span>
                </p>
              </div>
            </div>

            {/* Messages */}
            <ChatWindow
              messages={messages}
              currentUserId={user?._id || ''}
              isLoading={isLoading}
              isChangingCommunity={isChangingCommunity}
              autoScroll={autoScroll}
            />

            {/* Message Input */}
            {(!isConnected && socket) && (
              <div className="mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-sm opacity-90">You can still type messages, but they will be sent when the connection is restored.</p>
                </div>
              </div>
            )}
            <div className="p-3 md:p-4 border-t bg-card shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder={`Message ${selectedCommunity?.name || ''}`}
                    value={newMessage}
                    onChange={handleMessageChange}
                    className="flex-1 bg-background pr-20"
                    disabled={!selectedCommunity || isChangingCommunity}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hidden md:flex"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={!selectedCommunity || isChangingCommunity}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute bottom-full right-0 mb-2 z-50"
                      >
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  className={cn(
                    "h-10 w-10",
                    isConnected ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
                  )}
                  disabled={(!newMessage.trim() && !selectedImage) || !selectedCommunity || isChangingCommunity}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a community</p>
            <p className="text-sm max-w-md">Choose a community from the sidebar to start chatting with other members</p>
          </div>
        )}
      </div>
    </div>
  );
}
