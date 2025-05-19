"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useAuth } from '@/store/AuthContext';
import { toast } from "sonner"
import Image from "next/image"

interface CreatePostDialogProps {
  communityId: string;
  communityName: string;
  trigger?: React.ReactNode;
  onPostCreated?: () => void;
}

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png']; // Remove webp
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function CreatePostDialog({ communityId, communityName, trigger, onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Selected file type:', file.type); // Debug log

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG or PNG image only");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setMedia(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setMedia(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('communityId', communityId);
      
      if (media) {
        formData.append('media', media);
      }

      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      toast.success('Post created successfully!');
      setOpen(false);
      
      // Reset form
      setTitle('');
      setContent('');
      removeMedia();
      
      // Callback to refresh posts
      onPostCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Post in {communityName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="relative">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder="Give your post a title"
                maxLength={MAX_TITLE_LENGTH}
                required
              />
              <span className="absolute right-2 top-2 text-xs text-muted-foreground">
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <div className="relative">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                placeholder="What's on your mind?"
                className="min-h-[150px] resize-none"
                maxLength={MAX_CONTENT_LENGTH}
                required
              />
              <span className="absolute right-2 bottom-2 text-xs text-muted-foreground">
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="media" className="block">Media (optional)</Label>
            {previewUrl ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Label
                htmlFor="media"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload image (JPG or PNG only)
                </span>
                <Input
                  id="media"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleMediaChange}
                />
              </Label>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
