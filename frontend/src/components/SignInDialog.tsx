"use client"

import { useState } from "react"
import { useAuth } from '@/store/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import axios from 'axios';
import type { User } from '@/types/api';
import type { User as AuthUser } from '@/store/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SignInDialogProps {
  trigger: React.ReactNode;
  onSwitchToSignUp?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;  // Add this prop
}

interface SignInResponse {
  status: 'success' | 'error';
  data?: {
    user: User;
    token: string;
  };
  message?: string;
}

export function SignInDialog({ trigger, onSwitchToSignUp, open, onOpenChange, onSuccess }: SignInDialogProps) {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      const response = await axios.post<SignInResponse>(
        `${API_URL}/api/users/login`,
        { email, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        const { user: apiUser, token } = response.data.data;
        // Transform the user data to match the expected type
        const transformedUser: AuthUser = {
          ...apiUser,
          joinedCommunities: apiUser.joinedCommunities.map(community => ({
            _id: community._id,
            name: community.name,
            avatar: community.avatar,
            description: '',
            rules: []
          }))
        };
        setAuth(transformedUser, token);
        
        if (onOpenChange) {
          onOpenChange(false);
        }

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle specific error cases
        switch (error.response?.status) {
          case 403:
            setError("Oops! Looks like you've been temporarily grounded. Take a short break and come back soon! 😊");
            break;
          case 401:
            setError("Invalid email or password. Please try again!");
            break;
          case 429:
            setError("Too many attempts! Please wait a moment before trying again.");
            break;
          default:
            setError(error.response?.data?.message || "Something went wrong. Please try again!");
        }
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSignUp = () => {
    onSwitchToSignUp?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] h-[650px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="grid sm:grid-cols-[45fr,55fr] h-full">
          {/* Left side - Hero Image */}
          <div className="relative hidden sm:block h-full">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1470&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/50 to-black/90" />
            <div className="relative h-full flex flex-col">
              <div className="p-8">
                <Image
                  src="/explorely.svg"
                  alt="Explorely"
                  width={130}
                  height={40}
                  className="w-32 h-auto brightness-0 invert drop-shadow-lg"
                  priority
                />
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <blockquote className="max-w-md text-center space-y-6">
                  <h3 className="text-4xl font-bold mb-6 text-white tracking-tight leading-tight">
                    &ldquo;Your Journey, Their Stories&rdquo;
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    Discover Pakistan through the eyes of fellow travelers
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="h-1 w-12 bg-white/30 rounded-full" />
                    <div className="h-1 w-12 bg-white rounded-full" />
                    <div className="h-1 w-12 bg-white/30 rounded-full" />
                  </div>
                </blockquote>
              </div>
            </div>
          </div>

          {/* Right side - Sign in form */}
          <div className="p-12 flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DialogHeader className="space-y-3 text-left mb-8">
              <DialogTitle className="text-3xl font-bold tracking-tight">
                Welcome back
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Sign in to continue your journey
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hello@explorely.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-background/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-background/50 pr-12"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-6 pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Button 
                      variant="link" 
                      className="px-0 text-sm font-medium hover:text-primary transition-colors"
                      onClick={handleSwitchToSignUp}
                    >
                      Create one
                    </Button>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
