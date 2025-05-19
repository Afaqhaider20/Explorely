"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Star } from "lucide-react"

interface CreateReviewDialogProps {
  onSubmit: (data: {
    title: string;
    content: string;
    location: string;
    category: string;
    rating: number;
    images?: FileList;
  }) => void;
  trigger: React.ReactNode;
}

export function CreateReviewDialog({ onSubmit, trigger }: CreateReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImages(files);
      const urls = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    onSubmit({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      location: formData.get('location') as string,
      category: formData.get('category') as string,
      rating,
      images: images || undefined,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience to help others discover great places
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Restaurant or place name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Restaurant, Hotel"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1 items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <Star
                    className={`h-5 w-5 ${
                      value <= rating 
                        ? "text-primary fill-primary" 
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2">
                {rating === 0 ? "Select rating" : 
                 rating === 5 ? "Excellent" :
                 rating === 4 ? "Very Good" :
                 rating === 3 ? "Good" :
                 rating === 2 ? "Fair" : "Poor"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Sum up your experience"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Review</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Tell us about your experience..."
              className="resize-none"
              rows={4}
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Add Photos
            </Label>
            
            <div className="border rounded-md p-4">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('images')?.click()}
              >
                Choose Photos
              </Button>
            </div>

            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {previewUrls.length} photos selected
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setImages(null);
                      setPreviewUrls([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-md overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Preview ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <Button 
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newUrls = previewUrls.filter((_, index) => index !== i);
                          setPreviewUrls(newUrls);
                          if (images) {
                            const dt = new DataTransfer();
                            Array.from(images).forEach((file, index) => {
                              if (index !== i) dt.items.add(file);
                            });
                            setImages(dt.files);
                          }
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit">Post Review</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
