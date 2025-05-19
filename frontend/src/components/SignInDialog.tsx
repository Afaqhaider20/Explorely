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
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import axios from 'axios';
import type { User } from '@/types/api';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      console.log('Attempting to sign in...'); // Debug log
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

      console.log('Sign in response:', response.data); // Debug log

      if (response.data.status === 'success' && response.data.data) {
        const { user, token } = response.data.data;
        setAuth(user, token);
        
        if (onOpenChange) {
          onOpenChange(false);
        }

        console.log('Sign-in successful, calling onSuccess callback'); // Debug line
        // After successful sign in, call onSuccess if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Sign in error:', error); // Debug log
      
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Invalid credentials";
        setError(message);
      } else {
        setError("An unexpected error occurred");
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
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105"
              style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=1287&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
            <div className="relative h-full flex flex-col">
              <div className="p-8">
                <Image
                  src="/explorely.svg"
                  alt="Explorely"
                  width={130}
                  height={40}
                  className="w-32 h-auto brightness-0 invert"
                  priority
                />
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <blockquote className="max-w-md text-center">
                  <h3 className="text-4xl font-semibold mb-6 text-white tracking-tight">
                    &ldquo;Your Journey, Their Stories&rdquo;
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    Discover Pakistan through the eyes of fellow travelers
                  </p>
                </blockquote>
              </div>
            </div>
          </div>

          {/* Right side - Sign in form */}
          <div className="p-12 flex flex-col h-full">
            <DialogHeader className="space-y-3 text-left mb-6">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Welcome back
              </DialogTitle>
              <DialogDescription className="text-base">
                Sign in to continue your journey
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 flex-1">
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
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Button 
                    variant="link" 
                    className="px-0 text-sm font-normal text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <div className="mt-auto space-y-6 pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="h-4 w-4 ml-2" />
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
