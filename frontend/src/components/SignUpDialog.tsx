"use client"

import { useState } from "react"
import Image from "next/image"
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
import axios from 'axios';
import type { RegisterCredentials, ApiResponse, AuthResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SignUpDialogProps {
  trigger: React.ReactNode;
  onSwitchToSignIn?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void; // Add this line
}

export function SignUpDialog({ 
  trigger, 
  onSwitchToSignIn, 
  open, 
  onOpenChange,
  onSuccess 
}: SignUpDialogProps) {
  const { setAuth } = useAuth();
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: "",
    name: "",
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const { data } = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/api/users/register`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          withCredentials: true
        }
      );

      if (data.status === 'success' && data.data) {
        setAuth(data.data.user, data.data.token);
        if (onOpenChange) onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message || "Registration failed"
        : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSignIn = () => {
    onOpenChange?.(false);
    onSwitchToSignIn?.();
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
                  height={100}
                  className="w-32 h-auto brightness-0 invert"
                  priority
                />
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <blockquote className="max-w-md text-center">
                  <h3 className="text-4xl font-semibold mb-6 text-white tracking-tight">
                    &ldquo;Start Your Journey Today&rdquo;
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    Join our community of explorers sharing their Pakistan adventures
                  </p>
                </blockquote>
              </div>
            </div>
          </div>

          {/* Right side - Sign up form */}
          <div className="p-12 flex flex-col h-full">
            <DialogHeader className="space-y-3 text-left mb-6">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Create your account
              </DialogTitle>
              <DialogDescription className="text-base">
                Join Explorely to start sharing your experiences
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johnexplorer"
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={formData.name}  // Changed from fullName to name
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}  // Changed from fullName to name
                  placeholder="John Doe"
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hello@explorely.com"
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="mt-auto space-y-6 pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Button 
                      variant="link" 
                      className="px-0 text-sm font-medium hover:text-primary transition-colors"
                      onClick={handleSwitchToSignIn}
                    >
                      Sign in
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
