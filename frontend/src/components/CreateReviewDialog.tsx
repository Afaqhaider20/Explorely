"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Star, ArrowLeft, ArrowRight, X, Upload, Loader2 } from "lucide-react"
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from '@/store/AuthContext'

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
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    category: "",
    title: "",
    content: "",
  });

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];
  const MAX_FILES = 10;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check if adding new files would exceed the limit
    if (previewUrls.length + files.length > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} photos`);
      return;
    }

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(file.name);
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (too large)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(
        `Some files were invalid:\n${invalidFiles.join('\n')}\n\nPlease upload only JPG or PNG files under 5MB.`
      );
    }

    if (validFiles.length > 0) {
      const newFiles = new DataTransfer();
      if (images) {
        Array.from(images).forEach(file => newFiles.items.add(file));
      }
      validFiles.forEach(file => newFiles.items.add(file));
      setImages(newFiles.files);

      const newUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newUrls);
    
    if (images) {
      const dt = new DataTransfer();
      Array.from(images).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      setImages(dt.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        rating,
        images: images || undefined,
      });
      // Reset form and close dialog on success
      setStep(1);
      setRating(0);
      setImages(null);
      setPreviewUrls([]);
      setFormData({
        location: "",
        category: "",
        title: "",
        content: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to create review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (step === 1 && (!formData.location || !formData.category || rating === 0)) {
      return;
    }
    if (step === 2 && (!formData.title || !formData.content)) {
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    setStep(prev => prev - 1);
  };

  const handleDialogOpen = (open: boolean) => {
    if (open && !isAuthenticated) {
      toast.error('Please login to create a review');
      return;
    }
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog is closed
      setStep(1);
      setRating(0);
      setImages(null);
      setPreviewUrls([]);
      setFormData({
        location: "",
        category: "",
        title: "",
        content: "",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Start with the basics" :
             step === 2 ? "Tell us about your experience" :
             "Add photos to your review"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Restaurant or place name"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  name="category" 
                  required
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Hotel">Hotel</SelectItem>
                    <SelectItem value="Attraction">Attraction</SelectItem>
                  </SelectContent>
                </Select>
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
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Sum up your experience"
                  value={formData.title}
                  onChange={handleInputChange}
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
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Add Photos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Upload up to {MAX_FILES} photos (JPG or PNG, max 5MB each)
                </p>
              </div>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG or PNG up to 5MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('images')?.click()}
                  >
                    Choose Photos
                  </Button>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {previewUrls.length} of {MAX_FILES} photos selected
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
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {previewUrls.map((url, i) => (
                      <div 
                        key={i} 
                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                      >
                        <Image
                          src={url}
                          alt={`Preview ${i + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Button 
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {step > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Review'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
