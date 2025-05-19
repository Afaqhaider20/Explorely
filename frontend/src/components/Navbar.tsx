'use client';

import { useEffect, useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SignInDialog } from "@/components/SignInDialog";
import { SignUpDialog } from "@/components/SignUpDialog";
import { Search, MessageCircle, UserCircle, LogOut, Bell } from 'lucide-react';
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
import axios from 'axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, token } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
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
      );
      
      logout();
      toast.success("Successfully logged out", {
        description: "See you again soon!"
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error("Unable to log out", {
        description: "Please try again"
      });
    }
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
      "backdrop-blur-[12px] border-b"
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
            "relative rounded-md overflow-hidden",
            "shadow-sm hover:shadow transition-shadow duration-200",
            searchFocused && "shadow ring-2 ring-primary/10"
          )}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search 
                className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  searchFocused ? "text-primary" : "text-muted-foreground/70"
                )}
              />
            </div>
            <input
              type="search"
              placeholder="Search Explorely..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "block w-full py-2 pl-10 pr-12",
                "bg-background border border-input",
                "text-sm placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-0 focus:border-primary/30",
                "transition-colors duration-200"
              )}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            <div className={cn(
              "absolute inset-y-0 right-0 flex items-center pr-3",
              "text-xs font-medium text-muted-foreground",
              "transition-opacity duration-200",
              searchFocused ? "opacity-100" : "opacity-0"
            )}>
              <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px] font-mono">
                /
              </kbd>
            </div>
          </div>
          {searchFocused && (
            <div className="absolute mt-1 w-full bg-background border rounded-md shadow-md py-2 px-3 text-sm text-muted-foreground animate-in fade-in z-50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Quick Search</span>
                <span className="text-xs">Press Enter to search</span>
              </div>
              <div className="text-xs space-y-1.5 mt-2">
                <p className="text-muted-foreground">Try searching for:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSearchQuery('Paris')}
                    className="px-2 py-0.5 bg-muted rounded-sm hover:bg-muted/80 cursor-pointer"
                  >
                    Paris
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('Travel')}
                    className="px-2 py-0.5 bg-muted rounded-sm hover:bg-muted/80 cursor-pointer"
                  >
                    Travel
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('Adventure')}
                    className="px-2 py-0.5 bg-muted rounded-sm hover:bg-muted/80 cursor-pointer"
                  >
                    Adventure
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Auth Section with Messages and Avatar */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative text-muted-foreground hover:text-primary"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>

              <Link href="/messages">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative text-muted-foreground hover:text-primary"
                  aria-label="Messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  <Badge 
                    variant="default" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    2
                  </Badge>
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
