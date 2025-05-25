"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Comments } from "@/components/Comments";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  community: {
    _id: string;
    name: string;
  };
  media: string | null;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  commentCount: number;
}

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch post data (unprotected route)
        const postResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
          }/api/posts/${resolvedParams.id}`
        );

        if (postResponse.status === 404) {
          setPost(null);
          setLoading(false);
          return;
        }

        if (!postResponse.ok) {
          throw new Error("Failed to fetch post");
        }

        const postData = await postResponse.json();
        setPost(postData.data.post);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load post data");
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto p-4 space-y-6">
        {/* Back button skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Post card skeleton */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>

            <div>
              <Skeleton className="h-7 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
            </div>

            {/* Image placeholder */}
            <Skeleton className="w-full h-64 rounded-md" />

            {/* Actions skeleton */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center">
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </Card>

        {/* Comments skeleton */}
        <Card className="p-6">
          <Skeleton className="h-7 w-32 mb-6" />

          <Skeleton className="h-24 w-full mb-6" />

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-l-2 border-muted pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-3xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="bg-background border rounded-xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-2">Oops! Post Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The post you&apos;re looking for doesn&apos;t exist or has been removed. Let&apos;s get you back on track!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button className="w-full sm:w-auto">
                  Go to Home
                </Button>
              </Link>
              <Link href="/communities">
                <Button variant="outline" className="w-full sm:w-auto">
                  Browse Communities
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <PostCard {...post} votes={{ upvotes: [], downvotes: [] }} isDetailView />

      <Comments postId={post._id} />
    </div>
  );
}
