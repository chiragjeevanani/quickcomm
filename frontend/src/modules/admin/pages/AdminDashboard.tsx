import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Layers,
  Boxes,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  History,
  TrendingUp,
  MapPin,
  IndianRupee,
  Eye,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import OrderChart from "../components/OrderChart";
import SalesLineChart from "../components/SalesLineChart";
import GaugeChart from "../components/GaugeChart";
import RevenueBarChart from "../components/RevenueBarChart";
import TopStoresChart from "../components/TopStoresChart";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { useAuth } from "../../../context/AuthContext";
import {
  getDashboardStats,
  getSalesAnalytics,
  getOrderAnalytics,
  getTodaySales,
  getTopSellers,
  getRecentOrders,
  getSalesByLocation,
  type DashboardStats,
  type TopSeller,
  type RecentOrder,
  type SalesByLocation,
  type SalesAnalytics,
  type TodaySales,
} from "../../../services/api/admin/adminDashboardService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeIn, staggerContainer } from "../lib/animations";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newOrders, setNewOrders] = useState<RecentOrder[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [salesByLocation, setSalesByLocation] = useState<SalesByLocation[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<SalesAnalytics | null>(null);
  const [orderAnalyticsDaily, setOrderAnalyticsDaily] = useState<SalesAnalytics | null>(null);
  const [todaySales, setTodaySales] = useState<TodaySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          statsResponse,
          ordersResponse,
          sellersResponse,
          locationResponse,
          analyticsResponse,
          orderAnalyticsResponse,
          orderAnalyticsDailyResponse,
          todaySalesResponse,
        ] = await Promise.all([
          getDashboardStats(),
          getRecentOrders(10),
          getTopSellers(10),
          getSalesByLocation(),
          getSalesAnalytics("day"),
          getOrderAnalytics("month"),
          getOrderAnalytics("day"),
          getTodaySales(),
        ]);

        if (statsResponse.success) setStats(statsResponse.data);
        if (ordersResponse.success) setNewOrders(ordersResponse.data);
        if (sellersResponse.success) setTopSellers(sellersResponse.data);
        if (locationResponse.success) setSalesByLocation(locationResponse.data);
        if (analyticsResponse.success) setSalesAnalytics(analyticsResponse.data);
        if (orderAnalyticsResponse.success) setOrderAnalytics(orderAnalyticsResponse.data);
        if (orderAnalyticsDailyResponse.success) setOrderAnalyticsDaily(orderAnalyticsDailyResponse.data);
        if (todaySalesResponse.success) setTodaySales(todaySalesResponse.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, token]);

  const salesToday = todaySales?.salesToday || 0;
  const salesLastWeekSameDay = todaySales?.salesLastWeekSameDay || 0;
  const salesDifference = salesToday - salesLastWeekSameDay;
  const salesPercentChange = salesLastWeekSameDay > 0
    ? Math.abs(Number(((salesDifference / salesLastWeekSameDay) * 100).toFixed(0)))
    : salesToday > 0 ? 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-destructive mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="destructive">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const orderColumns = [
    { header: "ID", accessorKey: "orderNumber", cell: (o: RecentOrder) => <span className="font-bold underline cursor-pointer">{o.orderNumber || o.id}</span> },
    { header: "Customer", accessorKey: "customerName" },
    { header: "Date", accessorKey: "orderDate", cell: (o: RecentOrder) => new Date(o.orderDate).toLocaleDateString() },
    {
      header: "Status",
      accessorKey: "status",
      cell: (o: RecentOrder) => (
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          {o.status}
        </Badge>
      )
    },
    { header: "Amount", accessorKey: "amount", cell: (o: RecentOrder) => <span className="font-bold">₹{o.amount.toFixed(2)}</span> },
    {
      header: "Action",
      accessorKey: "id",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  const sellerColumns = [
    { header: "Seller ID", accessorKey: "sellerId" },
    { header: "Store Name", accessorKey: "storeName", cell: (s: TopSeller) => <span className="font-bold">{s.storeName}</span> },
    { header: "Revenue", accessorKey: "totalRevenue", cell: (s: TopSeller) => <span className="font-bold text-emerald-600 font-mono tracking-tighter">₹{s.totalRevenue.toLocaleString()}</span> },
    {
      header: "Action",
      accessorKey: "sellerId",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Admin Dashboard"
        description="Welcome back, admin! Here's what's happening today."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 font-bold uppercase tracking-tighter border-primary/20 bg-primary/5 text-primary">
            <Clock className="h-4 w-4" /> Live
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2 font-bold uppercase tracking-tighter">
            <Link to="/admin/orders">
              <History className="h-4 w-4" /> Reports
            </Link>
          </Button>
          <Button size="sm" asChild className="gap-2 font-bold uppercase tracking-tighter shadow-lg shadow-primary/20">
            <Link to="/admin/payments">
              <IndianRupee className="h-4 w-4" /> Payouts
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={<IndianRupee className="h-5 w-5" />}
          trend={{ value: salesPercentChange, isUp: salesDifference >= 0 }}
          description="Gross earnings"
          className="bg-emerald-500/5 border-emerald-500/10"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag className="h-5 w-5" />}
          trend={{ value: 12, isUp: true }}
          description="Completed orders"
          className="bg-blue-500/5 border-blue-500/10"
        />
        <StatCard
          title="Active Users"
          value={stats.totalUser}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 5, isUp: true }}
          description="Customer base"
          className="bg-violet-500/5 border-violet-500/10"
        />
        <StatCard
          title="Catalog Items"
          value={stats.totalProduct}
          icon={<Boxes className="h-5 w-5" />}
          description="Total active SKUs"
          className="bg-amber-500/5 border-amber-500/10"
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Delivered"
          value={stats.completedOrders}
          icon={<CheckCircle2 className="h-5 w-5" />}
          description="Directly fulfilled"
          className="bg-green-500/5 border-green-500/10"
        />
        <StatCard
          title="Pending"
          value={stats.pendingOrders}
          icon={<Clock className="h-5 w-5" />}
          description="Awaiting processing"
          className="bg-amber-500/5 border-amber-500/10"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelledOrders}
          icon={<XCircle className="h-5 w-5" />}
          description="User/Store cancellations"
          className="bg-rose-500/5 border-rose-500/10"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockProducts}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Needs replenishment"
          className="bg-slate-500/5 border-slate-500/10"
        />
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesLineChart data={salesAnalytics} title="Revenue Velocity" />
        </div>
        <div className="lg:col-span-1">
          <GaugeChart
            value={stats.avgCompletedOrderValue}
            maxValue={5000}
            label="Avg Order Value"
          />
        </div>
      </div>

      {/* Secondary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderChart data={orderAnalytics} title="Monthly Volume" />
        <OrderChart data={orderAnalyticsDaily} title="Weekly Volume" />
      </div>

      {/* Business Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RevenueBarChart data={salesByLocation} title="Revenue by Location" />
        </div>
        <div className="lg:col-span-2">
          <TopStoresChart data={topSellers} title="Top Store Performance" />
        </div>
      </div>

      {/* Actionable Data Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">
        <Card className="border-border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/20 border-b">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Recent Transactions
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tighter text-primary" onClick={() => navigate('/admin/orders/all')}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              <DataTable columns={orderColumns} data={newOrders} loading={loading} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/20 border-b">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Marketplace Performance
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tighter text-primary" onClick={() => navigate('/admin/manage-seller/list')}>
              Sellers
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              <DataTable columns={sellerColumns} data={topSellers} loading={loading} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
