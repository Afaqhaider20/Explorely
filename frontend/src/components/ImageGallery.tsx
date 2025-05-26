"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGallery({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);
  
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);
  
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, handlePrevious, handleNext, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-lg w-screen p-0 h-[90vh] md:h-[85vh] bg-black/95 border-none">
        <DialogTitle className="sr-only">Image Gallery</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute top-2 right-2 z-50 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
          
          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevious}
                className="absolute left-2 z-40 h-10 w-10 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                className="absolute right-2 z-40 h-10 w-10 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
          
          {/* Main image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-h-[80vh]">
              <Image
                src={images[currentIndex]}
                alt={`Full size image ${currentIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
