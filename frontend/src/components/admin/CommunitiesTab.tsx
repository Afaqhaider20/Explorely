"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiUrl } from "@/lib/config";

interface Community {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  createdAt: string;
  creator: {
    username: string;
    avatar?: string;
  };
  memberCount: number;
  reportCount: number;
  reports: {
    reason: string;
  }[];
}

interface CommunityListResponse {
  communities: Community[];
  currentPage: number;
  totalPages: number;
  totalCommunities: number;
}

export default function CommunitiesTab() {
  const { token } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityPage, setCommunityPage] = useState(1);
  const [totalCommunityPages, setTotalCommunityPages] = useState(1);
  const [totalCommunities, setTotalCommunities] = useState(0);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [communityLoading, setCommunityLoading] = useState(false);
  const [deletingCommunityId, setDeletingCommunityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCommunityId, setExpandedCommunityId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'reported'>('all');

  const fetchCommunities = useCallback(async (page: number, search?: string) => {
    if (!token) return;
    setCommunityLoading(true);

    try {
      const baseUrl = getApiUrl('api/admin/communities');
      const url = search
        ? `${baseUrl}/search?query=${encodeURIComponent(search)}&page=${page}&filter=${filter}`
        : `${baseUrl}?page=${page}&filter=${filter}`;

      const response = await axios.get<CommunityListResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCommunities(response.data.communities);
      setTotalCommunityPages(response.data.totalPages);
      setTotalCommunities(response.data.totalCommunities);
      setError(null);
    } catch (err) {
      console.error('Error fetching communities:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch communities');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setCommunityLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    fetchCommunities(communityPage, communitySearchQuery);
  }, [communityPage, communitySearchQuery, fetchCommunities, filter]);

  const handleFilterChange = (value: 'all' | 'reported') => {
    setFilter(value);
    setCommunityPage(1);
  };

  const handleCommunitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCommunityPage(1);
    fetchCommunities(1, communitySearchQuery);
  };

  const handleDeleteCommunity = async (communityId: string) => {
    if (!token) return;
    setDeletingCommunityId(communityId);

    try {
      await axios.delete(
        getApiUrl(`api/admin/communities/${communityId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Community deleted successfully');
      fetchCommunities(communityPage, communitySearchQuery);
    } catch (err) {
      console.error('Error deleting community:', err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to delete community');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setDeletingCommunityId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Management</CardTitle>
        <CardDescription>
          Manage and search through all communities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <form onSubmit={handleCommunitySearch} className="flex-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
                placeholder="Search communities by name or description..."
                className="flex-1 px-4 py-2 border rounded-md"
              />
              <Button type="submit" className="w-full sm:w-auto">Search</Button>
            </div>
          </form>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter communities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Communities</SelectItem>
              <SelectItem value="reported">Reported Communities</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {communityLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <>
            <div className="space-y-4">
              {communities.map((community) => (
                <div
                  key={community._id}
                  className="flex flex-col p-4 border rounded-lg gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={community.avatar} />
                        <AvatarFallback>
                          {community.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link 
                          href={`/communities/${community._id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {community.name}
                        </Link>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {community.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          Created by @{community.creator.username} • {community.memberCount} members • Created {new Date(community.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-sm text-gray-500">
                        {community.reportCount} reports
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {community.reportCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedCommunityId(expandedCommunityId === community._id ? null : community._id)}
                            className="flex-1 sm:flex-none gap-2"
                          >
                            {expandedCommunityId === community._id ? 'Hide Reports' : 'View Reports'}
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingCommunityId === community._id}
                              className="flex-1 sm:flex-none gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Community
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Community</AlertDialogTitle>
                              <div className="text-sm text-muted-foreground">
                                Are you sure you want to delete this community? This action will:
                                <ul className="list-disc list-inside mt-2">
                                  <li>Delete the community</li>
                                  <li>Delete all posts in the community</li>
                                  <li>Delete all comments on those posts</li>
                                </ul>
                                <p className="mt-2">This action cannot be undone.</p>
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCommunity(community._id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete Community
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCommunityId === community._id && community.reports.length > 0 && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {community.reports.map((report, index) => (
                          <li key={index}>{report.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                {totalCommunities > 0 ? (
                  `Showing ${communities.length} of ${totalCommunities} communities`
                ) : (
                  "No communities found"
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setCommunityPage(p => Math.max(1, p - 1))}
                  disabled={communityPage === 1 || totalCommunities === 0}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCommunityPage(p => Math.min(totalCommunityPages, p + 1))}
                  disabled={communityPage === totalCommunityPages || totalCommunities === 0}
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