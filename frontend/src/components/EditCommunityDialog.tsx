"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Plus, X, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useAuth } from '@/store/AuthContext';

interface Rule {
  id: string;
  content: string;
}

interface EditCommunityDialogProps {
  community: {
    _id: string;
    name: string;
    description: string;
    avatar: string;
    rules: {
      order: number;
      content: string;
      _id: string;
      createdAt: string;
    }[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_RULE_LENGTH = 200;
const MAX_RULES = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

type ErrorState = Partial<Record<string, string>>;

export function EditCommunityDialog({ community, open, onOpenChange, onUpdated }: EditCommunityDialogProps) {
  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description)
  const [avatar, setAvatar] = useState<File>()
  const [previewUrl, setPreviewUrl] = useState<string>(community.avatar)
  const [rules, setRules] = useState<Rule[]>(
    community.rules.map((rule) => ({
      id: rule._id,
      content: rule.content
    }))
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});
  const [rulesContainerRef, setRulesContainerRef] = useState<HTMLDivElement | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (open) {
      setName(community.name);
      setDescription(community.description);
      setPreviewUrl(community.avatar);
      setRules(community.rules.map((rule) => ({
        id: rule._id,
        content: rule.content
      })));
    }
  }, [open, community]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, avatar: "Please upload a JPG, PNG, or WebP image" }));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrors(prev => ({ ...prev, avatar: "Image must be less than 5MB" }));
      return;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.avatar;
      return newErrors;
    });
    setAvatar(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  const addRule = () => {
    if (rules.length >= MAX_RULES) {
      setErrors(prev => ({ ...prev, rules: `Maximum ${MAX_RULES} rules allowed` }));
      return;
    }
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.rules;
      return newErrors;
    });

    const newRule = {
      id: Date.now().toString(),
      content: "",
    };
    setRules([...rules, newRule]);

    setTimeout(() => {
      rulesContainerRef?.scrollTo({
        top: rulesContainerRef.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const updateRule = (id: string, content: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, content } : rule
    ));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }
    
    if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    const filledRules = rules.filter(rule => rule.content.trim());
    if (filledRules.length < 1) {
      newErrors.rules = "At least one rule is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      
      const formattedRules = rules
        .filter(rule => rule.content.trim())
        .map(rule => rule.content.trim());
      formData.append('rules', JSON.stringify(formattedRules));

      if (avatar) {
        formData.append('avatar', avatar);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communities/${community._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update community');
      }

      toast.success('Community updated successfully!');
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Community</DialogTitle>
          <DialogDescription>
            Make changes to your community&apos;s information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <Label>Community Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={previewUrl} alt={name} />
                <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  <ImagePlus className="h-4 w-4" />
                  Change Avatar
                </Label>
                {errors.avatar && (
                  <p className="text-sm text-destructive mt-1">{errors.avatar}</p>
                )}
              </div>
            </div>
          </div>

          {/* Name Section */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Enter community name"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{name.length}/{MAX_NAME_LENGTH} characters</span>
              {errors.name && <span className="text-destructive">{errors.name}</span>}
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="Describe your community"
              className="min-h-[100px]"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{description.length}/{MAX_DESCRIPTION_LENGTH} characters</span>
              {errors.description && <span className="text-destructive">{errors.description}</span>}
            </div>
          </div>

          {/* Rules Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Community Rules</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRule}
                disabled={rules.length >= MAX_RULES}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </div>

            <ScrollArea
              className="h-[200px] rounded-md border p-4"
              ref={setRulesContainerRef}
            >
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-2">
                    <Input
                      value={rule.content}
                      onChange={(e) => updateRule(rule.id, e.target.value)}
                      maxLength={MAX_RULE_LENGTH}
                      placeholder="Enter a rule"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(rule.id)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {errors.rules && (
              <p className="text-sm text-destructive">{errors.rules}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 