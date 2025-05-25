"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/store/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axios from 'axios';
import type { User } from '@/store/AuthContext';
import type { User as ApiUser } from '@/types/api';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SignInResponse {
  status: 'success' | 'error';
  data?: {
    user: ApiUser;
    token: string;
  };
  message?: string;
}

export default function LoginPage() {
  const { setAuth, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
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
        const transformedUser: User = {
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
        // Redirect to home page after successful login
        window.location.href = '/';
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
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

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1470&auto=format&fit=crop')",
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/50 to-black/90 z-0" />
      <div className="relative z-10 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 flex flex-col items-center bg-white/90">
        <Image
          src="/explorely.svg"
          alt="Explorely"
          width={130}
          height={40}
          className="w-32 h-auto mb-6 drop-shadow-lg"
          priority
        />
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Welcome back</h1>
        <p className="text-base text-gray-700 mb-6">Sign in to continue your journey</p>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-primary">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@explorely.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-white/90 text-black"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-primary">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-white/90 text-black"
                required
              />
              {error && (
                <p className="text-sm text-red-400 mt-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90"
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
        </form>
        <div className="text-center mt-6 w-full">
          <p className="text-sm text-gray-700">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
