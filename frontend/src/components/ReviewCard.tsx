"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MoreHorizontal, Flag, Share, ArrowBigUp, ArrowBigDown, MessageSquare } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ReportDialog } from '@/components/ReportDialog';

interface ReviewCardProps {
  title: string;
  content: string;
  rating: number;
  location: string;
  category: string;
  images?: string[];
  author: {
    name: string;
    image?: string;
  };
  likes: number;
  comments: number;
  timeAgo: string;
}

export function ReviewCard({
  title,
  content,
  rating,
  location,
  category,
  images,
  author,
  likes,
  comments,
}: ReviewCardProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const handleReport = (reason: string) => {
    console.log(`Reporting review "${title}" for: ${reason}`);
    setIsReportDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
              <AvatarImage src={author.image} />
              <AvatarFallback className="bg-primary/5">{author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/profile/${author.name}`} className="text-sm font-semibold hover:text-primary transition-colors">
                {author.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="font-medium">{location}</span>
                <span>•</span>
                <span className="text-primary/80">{category}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted/20 text-muted/20"
                  }`}
                />
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsReportDialogOpen(true);
                  }}
                >
                  <Flag className="h-4 w-4" />
                  <span>Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <h3 className="text-xl font-semibold leading-tight">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{content}</p>

        {images && images.length > 0 && (
          <div className={`grid ${
            images.length === 1 ? 'grid-cols-1' : 
            images.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 md:grid-cols-3'
          } gap-3 mt-4`}>
            {images.map((image, i) => (
              <div 
                key={i} 
                className={`relative ${
                  images.length === 1 ? 'aspect-video' : 'aspect-square'
                } rounded-lg overflow-hidden group cursor-pointer`}
              >
                <Image
                  src={image}
                  alt={`Review image ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-muted/50 rounded-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className="min-w-[2.5rem] text-center font-medium">{likes}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <ArrowBigDown className="h-5 w-5" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 rounded-full hover:bg-muted/50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {comments} Comments
          </Button>
        </div>
      </CardFooter>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReport}
      />
    </Card>
  );
}
