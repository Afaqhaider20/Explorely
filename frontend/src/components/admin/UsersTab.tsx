"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  isBanned: boolean;
  reportCount: number;
  reports: {
    reason: string;
  }[];
}

interface UserListResponse {
  users: User[];
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}

export default function UsersTab() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userTab, setUserTab] = useState("active");
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [unbanningUserId, setUnbanningUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'reported'>('all');

  const fetchUsers = useCallback(async (page: number, search?: string) => {
    if (!token) return;
    setUserLoading(true);

    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users`;
      const url = search
        ? `${baseUrl}/search?query=${encodeURIComponent(search)}&page=${page}&filter=${filter}`
        : `${baseUrl}?page=${page}&filter=${filter}`;

      const response = await axios.get<UserListResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setUsers(response.data.users);
      setTotalUserPages(response.data.totalPages);
      setTotalUsers(response.data.totalUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setUserLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    fetchUsers(userPage, userSearchQuery);
  }, [userPage, userSearchQuery, fetchUsers, filter]);

  const handleFilterChange = (value: 'all' | 'reported') => {
    setFilter(value);
    setUserPage(1);
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers(1, userSearchQuery);
  };

  const handleBanUser = async (userId: string) => {
    if (!token) return;
    setBanningUserId(userId);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}/ban`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('User banned successfully');
      fetchUsers(userPage, userSearchQuery);
    } catch (err) {
      console.error('Error banning user:', err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to ban user');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setBanningUserId(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!token) return;
    setUnbanningUserId(userId);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}/unban`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('User unbanned successfully');
      fetchUsers(userPage, userSearchQuery);
    } catch (err) {
      console.error('Error unbanning user:', err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to unban user');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setUnbanningUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    setDeletingUserId(userId);

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('User deleted successfully');
      fetchUsers(userPage, userSearchQuery);
    } catch (err) {
      console.error('Error deleting user:', err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to delete user');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage and search through all users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={userTab} onValueChange={setUserTab} className="mb-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="active" className="flex-1 sm:flex-none">Active Users</TabsTrigger>
            <TabsTrigger value="banned" className="flex-1 sm:flex-none">Banned Users</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <form onSubmit={handleUserSearch} className="flex-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users by username or email..."
                className="flex-1 px-4 py-2 border rounded-md"
              />
              <Button type="submit" className="w-full sm:w-auto">Search</Button>
            </div>
          </form>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="reported">Reported Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {userLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col p-4 border rounded-lg gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link 
                          href={`/profile/${user._id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          @{user.username}
                        </Link>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="text-xs text-gray-400">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-sm text-gray-500">
                        {user.reportCount} reports
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {user.reportCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedUserId(expandedUserId === user._id ? null : user._id)}
                            className="flex-1 sm:flex-none gap-2"
                          >
                            {expandedUserId === user._id ? 'Hide Reports' : 'View Reports'}
                          </Button>
                        )}
                        {userTab === "active" ? (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={banningUserId === user._id}
                                  className="flex-1 sm:flex-none gap-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-200"
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                  Ban User
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban User</AlertDialogTitle>
                                  <div className="text-sm text-muted-foreground">
                                    Are you sure you want to ban this user? This action will:
                                    <ul className="list-disc list-inside mt-2">
                                      <li>Prevent the user from logging in</li>
                                      <li>Hide all their posts and comments</li>
                                      <li>Remove them from all communities</li>
                                    </ul>
                                    <p className="mt-2">This action can be reversed later.</p>
                                  </div>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleBanUser(user._id)}
                                    className="bg-yellow-600 text-white hover:bg-yellow-700"
                                  >
                                    Ban User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingUserId === user._id}
                                  className="flex-1 sm:flex-none gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete User
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <div className="text-sm text-muted-foreground">
                                    Are you sure you want to delete this user? This action will:
                                    <ul className="list-disc list-inside mt-2">
                                      <li>Delete the user account</li>
                                      <li>Delete all their posts</li>
                                      <li>Delete all their comments</li>
                                    </ul>
                                    <p className="mt-2">This action cannot be undone.</p>
                                  </div>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={unbanningUserId === user._id}
                            onClick={() => handleUnbanUser(user._id)}
                            className="flex-1 sm:flex-none gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          >
                            Unban User
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedUserId === user._id && user.reports.length > 0 && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {user.reports.map((report, index) => (
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
                {totalUsers > 0 ? (
                  `Showing ${users.length} of ${totalUsers} users`
                ) : (
                  "No users found"
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  disabled={userPage === 1 || totalUsers === 0}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                  disabled={userPage === totalUserPages || totalUsers === 0}
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