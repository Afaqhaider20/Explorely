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
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import axios from 'axios';
import type { RegisterCredentials, ApiResponse, AuthResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Password strength validation regex pattern
const PASSWORD_PATTERN = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;

// Email validation regex pattern
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface SignUpDialogProps {
  trigger: React.ReactNode;
  onSwitchToSignIn?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
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
  });
  const [loading, setLoading] = useState(false);
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    if (!EMAIL_PATTERN.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const checkPasswordStrength = (password: string) => {
    setIsPasswordStrong(PASSWORD_PATTERN.test(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate email
    if (!validateEmail(formData.email)) {
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!isPasswordStrong) {
      setError('Please use a stronger password');
      setLoading(false);
      return;
    }

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
      if (axios.isAxiosError(error)) {
        // Handle specific error cases
        switch (error.response?.status) {
          case 403:
            setError("Looks like you're taking a little vacation from Explorely! Come back soon, we'll miss you! 🌟");
            break;
          case 409:
            setError("This email or username is already taken. Please try another one!");
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
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1421&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/50 to-black/90" />
            
            <div className="relative h-full flex flex-col">
              <div className="p-8">
                <Image
                  src="/explorely.svg"
                  alt="Explorely"
                  width={130}
                  height={100}
                  className="w-32 h-auto brightness-0 invert drop-shadow-lg"
                  priority
                />
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <blockquote className="max-w-md text-center space-y-6">
                  <h3 className="text-4xl font-bold mb-6 text-white tracking-tight leading-tight">
                    &ldquo;Start Your Journey Today&rdquo;
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    Join our community of explorers sharing their Pakistan adventures
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

          {/* Right side - Sign up form */}
          <div className="p-6 sm:p-8 flex flex-col">
            <DialogHeader className="space-y-3 text-left mb-8">
              <DialogTitle className="text-3xl font-bold tracking-tight">
                Create your account
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Join Explorely to start sharing your experiences
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johnexplorer"
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-background/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-background/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateEmail(e.target.value);
                  }}
                  placeholder="hello@explorely.com"
                  className={`h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-background/50 ${
                    emailError ? 'border-red-500' : ''
                  }`}
                  required
                />
                {emailError && (
                  <p className="text-sm text-red-500 mt-1">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      checkPasswordStrength(e.target.value);
                    }}
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                  {formData.password && (
                    <p className={`text-xs font-medium ${
                      isPasswordStrong ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPasswordStrong ? 'Strong' : 'Weak'}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90"
                disabled={loading || !isPasswordStrong || !!emailError}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
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
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
