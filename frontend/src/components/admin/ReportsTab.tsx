"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";
import ReportCard from "./ReportCard";
import { Report } from "@/types/report";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  reviewed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  resolved: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  dismissed: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
};

const ReportsTab = () => {
  const { token } = useAuth();
  const [activeReportTab, setActiveReportTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (activeReportTab !== 'all') {
        queryParams.append('type', activeReportTab);
      }
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setReports(response.data.reports);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Error fetching reports:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch reports');
      } else {
        setError('An unexpected error occurred');
      }
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [activeReportTab, statusFilter, currentPage, token]);

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    if (!token) return;
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports/${reportId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setReports(prevReports => 
        prevReports.map(report => 
          report._id === reportId ? response.data : report
        )
      );
      
      toast.success(`Report status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating report status:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to update report status');
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleUpdateNotes = async (reportId: string, notes: string) => {
    if (!token) return;
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports/${reportId}/notes`,
        { notes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setReports(prevReports => 
        prevReports.map(report => 
          report._id === reportId ? {
            ...report,
            adminNotes: response.data.adminNotes
          } : report
        )
      );
      
      toast.success('Report notes updated successfully');
    } catch (error) {
      console.error('Error updating report notes:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to update report notes');
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleDeleteNotes = async (reportId: string) => {
    if (!token) return;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports/${reportId}/notes`,
        { notes: '' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setReports(prevReports => 
        prevReports.map(report => 
          report._id === reportId ? {
            ...report,
            adminNotes: ''
          } : report
        )
      );
      
      toast.success('Report notes deleted successfully');
    } catch (error) {
      console.error('Error deleting report notes:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to delete report notes');
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={activeReportTab} onValueChange={setActiveReportTab}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="community">Communities</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="post">Posts</SelectItem>
            <SelectItem value="review">Reviews</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-muted-foreground">Loading reports...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-muted-foreground">No reports found matching the current filters.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                handleStatusChange={handleStatusChange}
                statusColors={statusColors}
                onUpdateNotes={handleUpdateNotes}
                onDeleteNotes={handleDeleteNotes}
              />
            ))}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;