"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus } from "lucide-react"
import { UpdateProfileData } from "@/lib/services/userService"

interface EditProfileProps {
  username: string
  bio: string
  avatar?: string
  onSave: (data: UpdateProfileData) => Promise<void>
  trigger?: React.ReactNode
}

export function EditProfileDialog({ username, bio, avatar, onSave, trigger }: EditProfileProps) {
  const [open, setOpen] = useState(false)
  const [newUsername, setNewUsername] = useState(username)
  const [newBio, setNewBio] = useState(bio)
  const [newAvatar, setNewAvatar] = useState<File>()
  const [previewUrl, setPreviewUrl] = useState(avatar)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewAvatar(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const updateData: UpdateProfileData = {
        username: newUsername,
        bio: newBio,
      }
      
      if (newAvatar) {
        updateData.avatar = newAvatar
      }

      await onSave(updateData)
      setOpen(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Edit Profile</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl} />
                <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1 rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <ImagePlus className="h-4 w-4" />
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Click the plus icon to upload a new photo
            </span>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="resize-none"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
