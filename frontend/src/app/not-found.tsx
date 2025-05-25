'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Compass } from 'lucide-react';
import Image from 'next/image';
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/explorely.svg"
            alt="Explorely Logo"
            width={200}
            height={56}
            priority
            className="w-auto h-12"
          />
        </div>

        {/* 404 Illustration */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-primary/10 rounded-full animate-pulse [animation-delay:200ms]" />
          <div className="absolute inset-8 bg-primary/15 rounded-full animate-pulse [animation-delay:400ms]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass className="w-24 h-24 text-primary/20 animate-spin-slow" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Page Not Found
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Oops! It seems you&apos;ve ventured off the beaten path. Let&apos;s get you back to exploring amazing destinations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => router.push('/')}
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
} 