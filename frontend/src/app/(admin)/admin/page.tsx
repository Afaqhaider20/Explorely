"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Users2,
  Menu,
  X,
  LineChart,
  MessageSquare,
  Star
} from "lucide-react";
import OverviewTab from "@/components/admin/OverviewTab";
import CommunitiesTab from "@/components/admin/CommunitiesTab";
import UsersTab from "@/components/admin/UsersTab";
import ReportsTab from "@/components/admin/ReportsTab";
import ReportAnalyticsTab from "@/components/admin/ReportAnalyticsTab";
import PostsTab from "@/components/admin/PostsTab";
import ReviewsTab from "@/components/admin/ReviewsTab";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const AdminDashboard = () => {
  const router = useRouter();
  const { token, isAuthenticated, isInitialized, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  // Set default sidebar state to closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    const checkAdminAccess = async () => {
      if (!isAuthenticated || !token) {
        router.push('/');
        return;
      }

      try {
        const adminCheckResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/check-admin`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!adminCheckResponse.data.isAdmin) {
          router.push('/');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        router.push('/');
        return;
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, token, router, isInitialized]);

  if (!isInitialized || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading admin dashboard...</p>
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "report-analytics", label: "Report Analytics", icon: LineChart },
    { id: "users", label: "Users", icon: Users },
    { id: "communities", label: "Communities", icon: Users2 },
    { id: "posts", label: "Posts", icon: MessageSquare },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header with Hamburger Menu */}
      <div className="md:hidden bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-600 dark:text-slate-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Image
              src="/explorely.svg"
              alt="Explorely Logo"
              width={100}
              height={30}
              priority
              className="w-auto h-6"
            />
            <span className="text-base font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent ml-2">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar - Responsive */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
        transition-transform duration-300 ease-in-out
        fixed md:static
        top-0 left-0
        h-full
        z-40 md:z-0
        w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-sm
      `}>
        {/* Sidebar Header - Hidden on Mobile */}
        <div className="hidden md:block p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-6">
            <Image
              src="/explorely.svg"
              alt="Explorely Logo"
              width={130}
              height={40}
              priority
              className="w-auto h-7 mr-2"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Admin
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 w-full justify-start text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Button>
        </div>
        
        {/* Close button for mobile */}
        <div className="md:hidden p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-medium">Back</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-600 dark:text-slate-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-2 px-2 py-1.5">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dashboard
            </h2>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 py-6 ${
                  activeTab === item.id 
                    ? "bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20 text-primary font-medium"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary border border-transparent"
                } transition-all duration-200`}
                onClick={() => {
                  setActiveTab(item.id);
                  // Close sidebar on mobile when a tab is selected
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
              >
                <Icon className={`h-5 w-5 ${activeTab === item.id ? "text-primary" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/20">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-medium">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Afaq</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'admin@explorely.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 dark:bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Main Content - Responsive */}
      <div className="flex-1 w-full overflow-auto">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-4 md:py-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {getGreeting()}, Afaq The Admin
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Here&apos;s what&apos;s happening with your platform today
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-8">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardContent className="p-4 md:p-6">
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "reports" && <ReportsTab />}
              {activeTab === "report-analytics" && <ReportAnalyticsTab />}
              {activeTab === "users" && <UsersTab />}
              {activeTab === "communities" && <CommunitiesTab />}
              {activeTab === "posts" && <PostsTab />}
              {activeTab === "reviews" && <ReviewsTab />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;