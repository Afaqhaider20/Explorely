"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Loader2, X, Hash } from "lucide-react"
import { useAuth } from '@/store/AuthContext';
import { toast } from "sonner"
import Image from "next/image"
import { getApiUrl } from "@/lib/config"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
const MAX_TAGS = 5;

// Add orientation type
type ImageOrientation = 'portrait' | 'landscape' | 'square' | null;

export function CreatePostDialog({ communityId, communityName, trigger, onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const [orientation, setOrientation] = useState<ImageOrientation>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchValue, setTagSearchValue] = useState("");

  // Fetch travel keywords
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const response = await fetch(getApiUrl('api/posts/keywords'));
        if (!response.ok) throw new Error('Failed to fetch keywords');
        const data = await response.json();
        setAvailableKeywords(data.keywords);
      } catch (error) {
        console.error('Error fetching keywords:', error);
      }
    };
    fetchKeywords();
  }, []);

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

    // Read image dimensions to determine orientation
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      if (img.width > img.height) {
        setOrientation('landscape');
      } else if (img.width < img.height) {
        setOrientation('portrait');
      } else {
        setOrientation('square');
      }
      setPreviewUrl(url);
    };
    img.onerror = () => {
      setOrientation(null);
      setPreviewUrl(url);
    };
    img.src = url;
    setMedia(file);
  };

  const removeMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setMedia(null);
    setPreviewUrl(null);
    setOrientation(null);
  };

  const handleTagSelect = (tag: string) => {
    if (tags.length >= MAX_TAGS) {
      toast.error(`You can only add up to ${MAX_TAGS} tags`);
      return;
    }
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagSearchValue("");
    setTagSearchOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
      formData.append('tags', JSON.stringify(tags));
      
      if (media) {
        formData.append('media', media);
      }

      const response = await fetch(getApiUrl('api/posts'), {
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
      setTags([]);
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
      <DialogContent className="max-w-[95vw] w-full min-w-[320px] sm:max-w-md px-4 py-6 sm:px-8 sm:py-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Create Post in {communityName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <div className="relative">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder="Give your post a title"
                maxLength={MAX_TITLE_LENGTH}
                required
                className="pr-12 text-base w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-medium">Content</Label>
            <div className="relative">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                placeholder="What's on your mind?"
                className="min-h-[150px] resize-none pr-12 text-base w-full"
                maxLength={MAX_CONTENT_LENGTH}
                required
              />
              <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>

          {/* Tags section: always rendered */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tags (optional, up to {MAX_TAGS})</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={tags.length >= MAX_TAGS}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    {tags.length >= MAX_TAGS ? 'Maximum tags reached' : 'Add tags...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 z-50" align="start" forceMount>
                  <Command>
                    <CommandInput
                      placeholder="Search tags..."
                      value={tagSearchValue}
                      onValueChange={setTagSearchValue}
                    />
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {availableKeywords
                        .filter(keyword => 
                          !tags.includes(keyword) &&
                          keyword.toLowerCase().includes(tagSearchValue.toLowerCase())
                        )
                        .map((keyword) => (
                          <CommandItem
                            key={keyword}
                            onSelect={() => handleTagSelect(keyword)}
                            onClick={() => handleTagSelect(keyword)}
                          >
                            <Hash className="mr-2 h-4 w-4" />
                            {keyword}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="media" className="text-sm font-medium">Media (optional)</Label>
            {previewUrl ? (
              <div
                className={`relative w-full rounded-lg overflow-hidden border bg-muted/50
                  ${orientation === 'portrait' ? 'aspect-[3/4] max-h-[400px]' : ''}
                  ${orientation === 'landscape' ? 'aspect-video' : ''}
                  ${orientation === 'square' ? 'aspect-square' : ''}
                  ${!orientation ? 'aspect-video' : ''}
                `}
              >
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                  onClick={removeMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Label
                htmlFor="media"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors duration-200"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground text-center px-4">
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

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 w-full">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto"
            >
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
