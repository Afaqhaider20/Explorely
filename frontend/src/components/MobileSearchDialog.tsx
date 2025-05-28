'use client';

import { useState, FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MobileSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSearchDialog({ isOpen, onOpenChange }: MobileSearchDialogProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      onOpenChange(false);
    }
  };

  const quickSearchTerms = [
    { label: 'Paris', icon: '🗼' },
    { label: 'Travel', icon: '✈️' },
    { label: 'Adventure', icon: '🏔️' },
    { label: 'Food', icon: '🍽️' },
    { label: 'Culture', icon: '🎭' },
    { label: 'Nature', icon: '🌿' },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-primary h-9 w-9"
        >
          <Search className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-full bg-transparent border-none shadow-none p-0"
        align="center" 
        sideOffset={5}
        side="bottom"
      >
        <div className="w-full flex justify-center items-center">
          <form onSubmit={handleSearch} className="w-full max-w-xs mx-auto relative">
            <div className={cn(
              "relative rounded-2xl overflow-hidden",
              "bg-white/90 border border-input shadow-md",
              "transition-all duration-300",
              searchFocused && "ring-2 ring-primary/20 shadow-lg"
            )}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search 
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    searchFocused ? "text-primary" : "text-muted-foreground/70"
                  )}
                />
              </div>
              <input
                type="search"
                placeholder="Search Explorely"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "block w-full py-3 pl-12 pr-12",
                  "bg-transparent border-none",
                  "text-base placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-0",
                  "transition-all duration-300"
                )}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <div className={cn(
                "absolute inset-y-0 right-0 flex items-center pr-4",
                "text-xs font-medium text-muted-foreground",
                "transition-opacity duration-200",
                searchFocused ? "opacity-100" : "opacity-0"
              )}>
                <kbd className="px-2 py-1 bg-muted border rounded-md text-xs font-mono">
                  Enter
                </kbd>
              </div>
            </div>

            {searchFocused && (
              <div className="absolute mt-3 w-full bg-background border rounded-xl shadow-xl py-4 px-5 text-sm animate-in fade-in z-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground">Quick Search</span>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    Popular Topics
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {quickSearchTerms.map((term) => (
                    <button
                      key={term.label}
                      type="button"
                      onClick={() => setSearchQuery(term.label)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    >
                      <span className="text-lg">{term.icon}</span>
                      <span className="font-medium">{term.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 