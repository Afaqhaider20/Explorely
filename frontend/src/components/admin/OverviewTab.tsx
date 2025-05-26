"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Building2 } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalCommunities: number;
  totalReports: number;
}

interface Community {
  id: string;
  name: string;
  memberCount: number;
  image?: string;
}

interface PostActivity {
  communityName: string;
  postCount: number;
  dates: { date: string; count: number }[];
}

interface AdminData {
  stats: AdminStats;
  topCommunities: Community[];
  postActivity: PostActivity[];
  recentActivity: {
    date: string;
    newUsers: number;
    newPosts: number;
    newCommunities: number;
    newReports: number;
  }[];
}

const ACTIVITY_COLORS = {
  newUsers: '#8b5cf6',    // Purple
  newPosts: '#10b981',    // Green
  newCommunities: '#f59e0b', // Yellow/Orange
  newReports: '#ef4444'   // Red
};

const COMMUNITY_COLORS = {
  bar: '#8b5cf6',  // Purple
  hover: '#7c3aed', // Darker purple
};

const POST_ACTIVITY_COLORS = {
  line1: '#3b82f6', // Blue
  line2: '#10b981', // Green
  line3: '#f59e0b', // Yellow
};

const defaultStats: AdminStats = {
  totalUsers: 0,
  totalPosts: 0,
  totalCommunities: 0,
  totalReports: 0
};

export default function OverviewTab() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminData>({
    stats: defaultStats,
    topCommunities: [],
    postActivity: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Ensure we have default values if any property is missing
        setData({
          stats: { ...defaultStats, ...response.data.stats },
          topCommunities: response.data.topCommunities || [],
          postActivity: response.data.postActivity || [],
          recentActivity: response.data.recentActivity || []
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || 'Failed to fetch admin statistics');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  // If there's no data to display in charts, show a message
  const hasChartData = data.topCommunities.length > 0 || data.postActivity.length > 0;
  if (!hasChartData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalPosts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Communities</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalCommunities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalReports}</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No community data available to display charts
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalCommunities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalReports}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Recent Platform Activity */}
        {data.recentActivity?.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Platform Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={data.recentActivity} 
                    margin={{ top: 20, right: 30, left: 10, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickFormatter={(dateStr) => {
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        // Check if date is valid before formatting
                        if (isNaN(date.getTime())) return dateStr;
                        return new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric'
                        }).format(date);
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#e5e7eb'
                      }}
                      labelFormatter={(label) => {
                        if (!label) return '';
                        const date = new Date(label);
                        // Check if date is valid before formatting
                        if (isNaN(date.getTime())) return label;
                        return new Intl.DateTimeFormat('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }).format(date);
                      }}
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        'Posts'
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{
                        fontSize: '12px',
                        color: '#6b7280',
                        paddingBottom: '15px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      name="New Users"
                      stroke={ACTIVITY_COLORS.newUsers}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newPosts"
                      name="New Posts"
                      stroke={ACTIVITY_COLORS.newPosts}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newCommunities"
                      name="New Communities"
                      stroke={ACTIVITY_COLORS.newCommunities}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newReports"
                      name="New Reports"
                      stroke={ACTIVITY_COLORS.newReports}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Communities by Members */}
        {data.topCommunities.length > 0 && (
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Communities by Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.topCommunities} 
                    margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#374151" 
                      opacity={0.2} 
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ 
                        fontSize: 12, 
                        fill: '#6b7280',
                        width: 100 
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis
                      tick={{ 
                        fontSize: 12, 
                        fill: '#6b7280' 
                      }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#e5e7eb'
                      }}
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        'Members'
                      ]}
                    />
                    <Bar 
                      dataKey="memberCount" 
                      fill={COMMUNITY_COLORS.bar}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                      name="Members"
                    >
                      {data.topCommunities.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fillOpacity={1 - (index * 0.15)}
                          cursor="pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Post Activity */}
        {data.postActivity.length > 0 && (
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Community Post Activity (Last Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#374151" 
                      opacity={0.2} 
                    />
                    <XAxis
                      dataKey="date"
                      type="category"
                      allowDuplicatedCategory={false}
                      tick={{ 
                        fontSize: 12, 
                        fill: '#6b7280' 
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickFormatter={(dateStr) => {
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        // Check if date is valid before formatting
                        if (isNaN(date.getTime())) return dateStr;
                        return new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric'
                        }).format(date);
                      }}
                    />
                    <YAxis
                      tick={{ 
                        fontSize: 12, 
                        fill: '#6b7280' 
                      }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#e5e7eb'
                      }}
                      labelFormatter={(label) => {
                        if (!label) return '';
                        const date = new Date(label);
                        // Check if date is valid before formatting
                        if (isNaN(date.getTime())) return label;
                        return new Intl.DateTimeFormat('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }).format(date);
                      }}
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        'Posts'
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{
                        fontSize: '12px',
                        color: '#6b7280',
                        paddingBottom: '15px'
                      }}
                    />
                    {data.postActivity.map((community, index) => {
                      // Sort dates chronologically and ensure proper formatting
                      const formattedDates = community.dates
                        .map(item => ({
                          ...item,
                          date: new Date(item.date).toISOString().split('T')[0]
                        }))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      
                      return (
                        <Line
                          key={community.communityName}
                          type="monotone"
                          data={formattedDates}
                          dataKey="count"
                          name={community.communityName}
                          stroke={Object.values(POST_ACTIVITY_COLORS)[index % 3]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ 
                            r: 6, 
                            strokeWidth: 2,
                            fill: Object.values(POST_ACTIVITY_COLORS)[index % 3]
                          }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 