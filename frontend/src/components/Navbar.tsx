'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SignInDialog } from "@/components/SignInDialog";
import { SignUpDialog } from "@/components/SignUpDialog";
import { Search, MessageCircle, UserCircle, LogOut} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import axios from 'axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function Navbar({ className }: { className?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const { user, token, logout, isInitialized } = useAuth();
  const router = useRouter();
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUnreadCounts = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get<{
        totalUnreadCount: number;
        hasUnread: boolean;
      }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/navbar-unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUnreadMessageCount(response.data.totalUnreadCount);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      // Don't set count to 0 on error to avoid flickering
    }
  }, [token]);

  // Fetch initial unread counts
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      // Try to call logout endpoint, but don't wait for it
      axios.post(
        `${API_URL}/api/users/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      ).catch(() => {
        // Ignore any errors from the logout endpoint
        console.log('Logout endpoint failed, proceeding with local logout');
      });
      
      // Always perform local logout regardless of API response
      logout();
      toast.success("Successfully logged out", {
        description: "See you again soon!"
      });
    } catch (error) {
      // If anything fails, still perform local logout
      console.error('Logout failed:', error);
      logout();
      toast.success("Logged out", {
        description: "See you again soon!"
      });
    }
  };

  const handleMessagesClick = () => {
    setUnreadMessageCount(0);
    router.push('/messages');
  };

  const handleSwitchToSignUp = () => {
    setSignInOpen(false);
    setSignUpOpen(true);
  };

  const handleSwitchToSignIn = () => {
    setSignUpOpen(false);
    setSignInOpen(true);
  };

  const handleSuccessfulSignIn = () => {
    setSignInOpen(false);
    toast.success("Welcome back!", {
      description: "Successfully signed in to your account"
    });
  };

  const handleSuccessfulSignUp = () => {
    setSignUpOpen(false);
    toast.success("Welcome to Explorely!", {
      description: "Your account has been created successfully"
    });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-background/95 shadow-lg" 
        : "bg-background/80",
      "backdrop-blur-[12px] border-b",
      className
    )}>
      <nav className="container px-4 h-16 max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 shrink-0 hover:scale-[0.98]"
        >
          <Image
            src="/explorely.svg"
            alt="Explorely Logo"
            width={500}
            height={140}
            priority
            className="w-auto h-10"
          />
        </Link>

        {/* Enhanced professional search bar */}
        <form onSubmit={handleSearch} className="relative max-w-md w-full mx-4">
          <div className={cn(
            "relative rounded-full overflow-hidden",
            "shadow-sm hover:shadow transition-all duration-200",
            searchFocused && "shadow-md ring-1 ring-primary/10"
          )}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search 
                className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  searchFocused ? "text-primary" : "text-muted-foreground/60"
                )}
              />
            </div>
            <input
              type="search"
              placeholder="Search Explorely..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "block w-full py-2.5 pl-10 pr-12",
                "bg-background/50 border border-input/50",
                "text-sm placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-0 focus:border-primary/20",
                "transition-all duration-200",
                "hover:bg-background/80"
              )}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
          </div>
          {searchFocused && (
            <div className="absolute mt-2 w-full bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg py-3 px-4 text-sm text-muted-foreground animate-in fade-in z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">Quick Search</span>
                <span className="text-xs text-muted-foreground/70">Press Enter to search</span>
              </div>
              <div className="text-xs space-y-2 mt-2">
                <p className="text-muted-foreground/70">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('Lahore');
                      router.push(`/search?query=${encodeURIComponent('Lahore')}`);
                      setSearchFocused(false);
                    }}
                    className="px-3 py-1 bg-muted/50 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    Lahore
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('Adventure');
                      router.push(`/search?query=${encodeURIComponent('Adventure')}`);
                      setSearchFocused(false);
                    }}
                    className="px-3 py-1 bg-muted/50 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    Adventure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('Solo Travel');
                      router.push(`/search?query=${encodeURIComponent('Solo Travel')}`);
                      setSearchFocused(false);
                    }}
                    className="px-3 py-1 bg-muted/50 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    Solo Travel
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Auth Section with Messages and Avatar */}
        <div className="flex items-center gap-3">
          {!isInitialized ? (
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              <NotificationsDropdown token={token} />

              <Link 
                href="/messages"
                onClick={handleMessagesClick}
              >
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative text-muted-foreground hover:text-primary"
                  aria-label="Messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  {unreadMessageCount > 0 && (
                    <Badge 
                      variant="default"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                      aria-label={`${unreadMessageCount} unread messages`}
                    >
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "relative h-10 w-10 rounded-full",
                      scrolled ? "ring-primary/20" : "ring-primary/10",
                      "hover:ring-2 transition-all duration-300"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      {user.avatar && user.avatar !== "default-avatar.png" ? (
                        <AvatarImage src={user.avatar} alt={user.username} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-1" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <SignInDialog
                trigger={
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "text-sm font-medium text-muted-foreground/90",
                      "hover:text-foreground hover:bg-primary/5",
                      "active:scale-95 transition-all duration-300"
                    )}
                  >
                    Sign In
                  </Button>
                }
                onSwitchToSignUp={handleSwitchToSignUp}
                open={signInOpen}
                onOpenChange={setSignInOpen}
                onSuccess={handleSuccessfulSignIn}
              />
              <SignUpDialog
                trigger={
                  <Button
                    size="sm"
                    className={cn(
                      "font-medium px-6 shadow-md hover:shadow-lg hover:scale-[0.98]", 
                      "bg-gradient-to-r from-primary to-primary/90",
                      "transition-all duration-300"
                    )}
                  >
                    Sign Up
                  </Button>
                }
                onSwitchToSignIn={handleSwitchToSignIn}
                open={signUpOpen}
                onOpenChange={setSignUpOpen}
                onSuccess={handleSuccessfulSignUp}
              />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
