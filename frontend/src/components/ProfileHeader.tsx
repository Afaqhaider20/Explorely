'use client';

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Badge } from "@/components/ui/badge";

interface ProfileStats {
  posts: number;
  communities: number;
  joined: string;
  location?: string;
  karma: {
    total: number;
    postKarma: number;
    commentKarma: number;
    lastCalculated: string;
  };
}

interface ProfileHeaderProps {
  username: string;
  bio: string;
  avatar?: string;
  userTrustedScore: number;
  stats: ProfileStats;
}

export function ProfileHeader({ username, bio, avatar, userTrustedScore, stats }: ProfileHeaderProps) {
  const handleSaveProfile = (data: { username: string; bio: string; avatar?: File }) => {
    // Implement save logic here
    console.log('Saving profile:', data);
  };

  // Function to determine the trust level color and label
  const getTrustLevel = (score: number) => {
    if (score >= 100) return { color: "bg-green-100 text-green-800", label: "Trusted Expert" };
    if (score >= 50) return { color: "bg-blue-100 text-blue-800", label: "Trusted" };
    if (score >= 20) return { color: "bg-yellow-100 text-yellow-800", label: "Growing" };
    return { color: "bg-muted text-muted-foreground", label: "New" };
  };

  const trustLevel = getTrustLevel(userTrustedScore);

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl" />

      <div className="px-4">
        {/* Avatar and Edit Button */}
        <div className="flex justify-between items-start -mt-16">
          <Avatar className="h-32 w-32 rounded-xl border-4 border-background shadow-xl">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-2xl font-semibold">
              {username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <EditProfileDialog
            username={username}
            bio={bio}
            avatar={avatar}
            onSave={handleSaveProfile}
            trigger={<Button variant="outline" className="mt-16">Edit Profile</Button>}
          />
        </div>

        {/* Profile Info */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-secondary">@{username}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${trustLevel.color} flex items-center gap-1.5 px-2 py-1`}>
                <Shield className="h-3.5 w-3.5" />
                <span>TrustedScore {userTrustedScore}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">{trustLevel.label}</span>
            </div>
          </div>

          <p className="text-foreground/80 max-w-2xl">{bio}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {stats.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{stats.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {stats.joined}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <div className="text-sm">
              <span className="font-semibold text-foreground">{stats.posts}</span>
              <span className="text-muted-foreground"> Posts</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">{stats.communities}</span>
              <span className="text-muted-foreground"> Communities</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">{stats.karma.postKarma}</span>
              <span className="text-muted-foreground"> Post Score</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">{stats.karma.commentKarma}</span>
              <span className="text-muted-foreground"> Comment Score</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
