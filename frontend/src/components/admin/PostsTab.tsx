"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/store/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiUrl } from "@/lib/config";

// Post interface
interface Post {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    avatar?: string;
  };
  community: {
    name: string;
    _id: string;
  };
  voteCount: number;
  commentCount: number;
  reportCount: number;
  reports: {
    reason: string;
  }[];
}

interface PostListResponse {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

export default function PostsTab() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'reported'>('all');

  const fetchPosts = useCallback(async (page: number, search?: string) => {
    if (!token) return;
    setIsLoading(true);

    try {
      const baseUrl = getApiUrl('api/admin/posts');
      const url = search
        ? `${baseUrl}/search?query=${encodeURIComponent(search)}&page=${page}&filter=${filter}`
        : `${baseUrl}?page=${page}&filter=${filter}`;

      const response = await axios.get<PostListResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setPosts(response.data.posts);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalPosts(response.data.totalPosts);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch posts');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    fetchPosts(currentPage, postSearchQuery);
  }, [currentPage, postSearchQuery, fetchPosts, filter]);

  const handleFilterChange = (value: 'all' | 'reported') => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handlePostSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts(1, postSearchQuery);
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) return;
    setDeletingPostId(postId);

    try {
      await axios.delete(
        getApiUrl(`api/admin/posts/${postId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Post deleted successfully');
      fetchPosts(currentPage, postSearchQuery);
    } catch (err) {
      console.error('Error deleting post:', err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to delete post');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Management</CardTitle>
        <CardDescription>
          Manage and search through all posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <form onSubmit={handlePostSearch} className="flex-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={postSearchQuery}
                onChange={(e) => setPostSearchQuery(e.target.value)}
                placeholder="Search posts by title or content..."
                className="flex-1 px-4 py-2 border rounded-md"
              />
              <Button type="submit" className="w-full sm:w-auto">Search</Button>
            </div>
          </form>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter posts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="reported">Reported Posts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="flex flex-col p-4 border rounded-lg gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>
                          {post.author.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link 
                          href={`/posts/${post._id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                        <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                        <div className="text-xs text-gray-400">
                          Posted {new Date(post.createdAt).toLocaleDateString()}
                          {post.community && (
                            <span className="ml-2">
                              in <Link href={`/communities/${post.community._id}`} className="text-primary hover:underline">
                                r/{post.community.name}
                              </Link>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-sm text-gray-500">
                        {post.reportCount} reports
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {post.reportCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedPostId(expandedPostId === post._id ? null : post._id)}
                            className="flex-1 sm:flex-none gap-2"
                          >
                            {expandedPostId === post._id ? 'Hide Reports' : 'View Reports'}
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingPostId === post._id}
                              className="flex-1 sm:flex-none gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Post
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post</AlertDialogTitle>
                              <div className="text-sm text-muted-foreground">
                                Are you sure you want to delete this post? This action will:
                                <ul className="list-disc list-inside mt-2">
                                  <li>Delete the post permanently</li>
                                  <li>Delete all comments on this post</li>
                                </ul>
                                <p className="mt-2">This action cannot be undone.</p>
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePost(post._id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete Post
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  
                  {expandedPostId === post._id && post.reports.length > 0 && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {post.reports.map((report, index) => (
                          <li key={index}>{report.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No posts found
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                {totalPosts > 0 ? (
                  `Showing ${posts.length} of ${totalPosts} posts`
                ) : (
                  "No posts found"
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || totalPosts === 0}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPosts === 0}
                  className="flex-1 sm:flex-none"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 