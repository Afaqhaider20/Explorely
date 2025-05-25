import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useAuth } from "@/store/AuthContext";
import axios from "axios";

const cardColors = [
  "bg-gradient-to-r from-indigo-500 to-blue-500",
  "bg-gradient-to-r from-yellow-400 to-yellow-500",
  "bg-gradient-to-r from-green-400 to-green-500",
  "bg-gradient-to-r from-red-400 to-red-500"
];

// Simple mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

const ReportAnalyticsTab = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthTotals, setMonthTotals] = useState({
    total: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchReportAnalytics = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setMonthTotals(response.data.monthTotals);
      } catch (err) {
        setError('Failed to fetch report analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchReportAnalytics();
  }, [token]);

  const monthBarData = [
    { name: "Total Reports", value: monthTotals.total, fill: "#6366f1" },
    { name: "Reviewed", value: monthTotals.reviewed, fill: "#f59e42" },
    { name: "Resolved", value: monthTotals.resolved, fill: "#10b981" },
    { name: "Dismissed", value: monthTotals.dismissed, fill: "#ef4444" },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-2">
        <Card className={`shadow-lg rounded-xl text-white ${cardColors[0]}`} style={{ minWidth: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthTotals.total}</div>
            <p className="text-xs opacity-80 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className={`shadow-lg rounded-xl text-white ${cardColors[1]}`} style={{ minWidth: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthTotals.reviewed}</div>
            <p className="text-xs opacity-80 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className={`shadow-lg rounded-xl text-white ${cardColors[2]}`} style={{ minWidth: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthTotals.resolved}</div>
            <p className="text-xs opacity-80 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className={`shadow-lg rounded-xl text-white ${cardColors[3]}`} style={{ minWidth: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Dismissed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthTotals.dismissed}</div>
            <p className="text-xs opacity-80 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="flex-1 bg-white dark:bg-slate-800 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Report Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[220px] md:h-[260px]">
          <div style={{ width: isMobile ? 340 : '100%', overflowX: isMobile ? 'auto' : 'visible' }}>
            <ResponsiveContainer width={isMobile ? 320 : 600} height={isMobile ? 180 : 220}>
              <BarChart
                data={monthBarData}
                layout="vertical"
                margin={{ top: 20, right: 20, left: isMobile ? 20 : 40, bottom: 20 }}
                barCategoryGap={isMobile ? 20 : 60}
                barSize={isMobile ? 18 : 28}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fill: '#6B7280', fontSize: isMobile ? 12 : 14 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: '#6B7280', fontSize: isMobile ? 13 : 16, fontWeight: 600 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={isMobile ? 100 : 140}
                />
                <Tooltip
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} minPointSize={8}>
                  {monthBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{
                      fill: '#111',
                      fontWeight: 700,
                      fontSize: isMobile ? 13 : 16
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportAnalyticsTab; 