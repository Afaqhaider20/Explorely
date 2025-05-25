"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Plus, X, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';

interface Rule {
  id: string;
  content: string;
}

interface CreateCommunityData {
  name: string;
  description: string;
  rules: Rule[]; 
  avatar?: File;
}

interface CreateCommunityDialogProps {
  onSubmit: (data: CreateCommunityData) => void;
  trigger?: React.ReactNode;
}

interface CommunityResponse {
  status: string;
  data: {
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
      creator: {
        _id: string;
        username: string;
      };
      // ...other fields
    };
  };
}

const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_RULE_LENGTH = 200;
const MAX_RULES = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

type ErrorState = Partial<Record<string, string>>;

export function CreateCommunityDialog({ onSubmit, trigger }: CreateCommunityDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [avatar, setAvatar] = useState<File>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});
  const [rulesContainerRef, setRulesContainerRef] = useState<HTMLDivElement | null>(null);
  const { token, addJoinedCommunity } = useAuth();
  const [open, setOpen] = useState(false); // Change initial state to false
  const router = useRouter();

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

    // Scroll to bottom after new rule is added
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
      // Create FormData
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      
      // Add rules as JSON string
      const formattedRules = rules
        .filter(rule => rule.content.trim())
        .map(rule => rule.content.trim());
      formData.append('rules', JSON.stringify(formattedRules));

      // Add avatar if exists
      if (avatar) {
        formData.append('avatar', avatar);
      }

      // Send request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/communities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create community');
      }

      const { data } = await response.json() as CommunityResponse;
      
      // Add the new community to the sidebar
      addJoinedCommunity({
        _id: data.community._id,
        name: data.community.name,
        avatar: data.community.avatar,
        description: data.community.description,
        rules: data.community.rules
      });

      toast.success('Community created successfully!');
      setOpen(false);
      
      // Reset form
      setName('');
      setDescription('');
      setRules([]);
      setAvatar(undefined);
      setPreviewUrl(undefined);
      
      // Navigate to the new community page
      router.push(`/communities/${data.community._id}`);
      
      // Send only the required data to onSubmit
      onSubmit({
        name: data.community.name,
        description: data.community.description,
        rules: rules.filter(rule => rule.content.trim()),
        avatar: avatar
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle>Create a Community</DialogTitle>
          <DialogDescription>
            Create a new community to connect with others who share your interests
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4">
              {/* Avatar Upload - Made Smaller */}
              <div className="flex items-center gap-4 py-2">
                <div className="relative group">
                  <Avatar className="h-16 w-16 transition-transform duration-200 group-hover:scale-105">
                    <AvatarImage src={previewUrl} />
                    <AvatarFallback className="bg-muted">
                      {name ? name[0].toUpperCase() : 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label
                          htmlFor="community-avatar"
                          className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white cursor-pointer
                            hover:bg-primary/90 transition-all duration-200 hover:scale-110"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>Upload community avatar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input
                    id="community-avatar"
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Community Avatar</p>
                  {errors.avatar ? (
                    <p className="text-xs text-destructive">{errors.avatar}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Upload a JPG, PNG, or WebP image (max 5MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Community Name - More Compact */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Community Name</Label>
                  <span className="text-xs text-muted-foreground">
                    {name.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  placeholder="e.g., StreetFoodPK"
                  className={cn(
                    "focus-visible:ring-1 focus-visible:ring-offset-0",
                    errors.name && "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Description - Reduced Height */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <span className="text-xs text-muted-foreground">
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  placeholder="What's this community about?"
                  className={cn(
                    "resize-none focus-visible:ring-1 focus-visible:ring-offset-0",
                    errors.description && "border-destructive focus-visible:ring-destructive"
                  )}
                  rows={3}
                  required
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description}</p>
                )}
              </div>

              {/* Redesigned Rules Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Community Rules</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add guidelines ({rules.length}/{MAX_RULES})
                    </p>
                  </div>
                </div>

                <div 
                  className="rounded-lg border bg-gradient-to-b from-muted/50 to-muted/30"
                  ref={setRulesContainerRef}
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  {rules.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {rules.map((rule, index) => (
                        <div 
                          key={rule.id} 
                          className="flex items-center gap-2 p-3 group hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            {index + 1}.
                          </span>
                          <Input
                            value={rule.content}
                            onChange={(e) => updateRule(rule.id, e.target.value.slice(0, MAX_RULE_LENGTH))}
                            placeholder={`Rule ${index + 1}`}
                            className="flex-1 border-0 bg-transparent h-9 focus-visible:ring-0 px-0 
                              placeholder:text-muted-foreground/50"
                          />
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {rule.content.length}/{MAX_RULE_LENGTH}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRule(rule.id)}
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 flex flex-col items-center justify-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        No rules added yet
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addRule}
                        disabled={rules.length >= MAX_RULES}
                        className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        Add Your First Rule
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Add Rule Button - Always visible when rules exist */}
                {rules.length > 0 && rules.length < MAX_RULES && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRule}
                    className="w-full flex items-center gap-2 justify-center hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Rule
                  </Button>
                )}

                {errors.rules && (
                  <p className="text-xs text-destructive mt-2">{errors.rules}</p>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <DialogTrigger asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Community'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
