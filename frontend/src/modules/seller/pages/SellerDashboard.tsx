import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Layers,
  Boxes,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  PackageSearch
} from 'lucide-react';

import StatCard from '../components/ui/StatCard';
import OrderChart from '../components/OrderChart';
import DataTable from '../components/ui/DataTable';
import { getSellerDashboardStats, DashboardStats, NewOrder } from '../../../services/api/dashboardService';
import { staggerContainer, fadeIn, slideUp } from '../lib/animations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newOrders, setNewOrders] = useState<NewOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getSellerDashboardStats();
        if (response.success) {
          setStats(response.data.stats);
          setNewOrders(response.data.newOrders);
        } else {
          setError(response.message || 'Failed to fetch dashboard data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: NewOrder['status']) => {
    switch (status) {
      case 'Out For Delivery':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Out For Delivery</Badge>;
      case 'Received':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Received</Badge>;
      case 'Payment Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Payment Pending</Badge>;
      case 'Cancelled':
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">{status}</Badge>;
    }
  };

  const columns = [
    { header: "Order ID", accessorKey: "id", cell: (order: NewOrder) => <span className="font-bold text-foreground">#{order.id}</span> },
    { header: "Date", accessorKey: "orderDate", cell: (order: NewOrder) => <span className="text-muted-foreground">{order.orderDate}</span> },
    { header: "Status", accessorKey: "status", cell: (order: NewOrder) => getStatusBadge(order.status) },
    { header: "Amount", accessorKey: "amount", cell: (order: NewOrder) => <span className="font-bold text-foreground">₹{order.amount}</span> },
    {
      header: "Action",
      accessorKey: "action",
      cell: (order: NewOrder) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/seller/orders/${order.id}`)}
          className="border-border hover:border-primary hover:text-primary"
        >
          View Details
        </Button>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-12 w-48 bg-muted rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px] bg-muted/50 rounded-xl"></div>
          <div className="h-[400px] bg-muted/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-bold text-foreground">Error Loading Dashboard</h3>
          <p className="text-rose-500 mt-1">{error || 'Stats not available'}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Store Analytics</h1>
        <p className="text-muted-foreground mt-1">Detailed performance metrics for your business</p>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <StatCard delay={0.1} icon={<Users className="w-5 h-5" />} title="Total Users" value={stats.totalUser.toLocaleString()} trend={{ value: 12, isUp: true }} />
        <StatCard delay={0.2} icon={<Layers className="w-5 h-5" />} title="Categories" value={stats.totalCategory} />
        <StatCard delay={0.3} icon={<PackageSearch className="w-5 h-5" />} title="Products" value={stats.totalProduct} />
        <StatCard delay={0.4} icon={<ShoppingBag className="w-5 h-5" />} title="Total Orders" value={stats.totalOrders} trend={{ value: 8, isUp: true }} />

        <StatCard delay={0.5} icon={<CheckCircle2 className="w-5 h-5" />} title="Completed" value={stats.completedOrders} />
        <StatCard delay={0.6} icon={<Clock className="w-5 h-5" />} title="Pending" value={stats.pendingOrders} />
        <StatCard delay={0.7} icon={<XCircle className="w-5 h-5" />} title="Cancelled" value={stats.cancelledOrders} trend={{ value: 2, isUp: false }} />
        <StatCard delay={0.8} icon={<TrendingUp className="w-5 h-5" />} title="Product Sold" value={stats.totalOrders - stats.cancelledOrders} />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderChart title="Daily Orders" data={stats.dailyOrderData} />
        <OrderChart title="Monthly Orders" data={stats.yearlyOrderData} />
      </div>

      {/* Low Stock Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tighter text-rose-500">Sold Out Products</p>
              <h3 className="text-2xl font-bold text-rose-500">{stats.soldOutProducts}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tighter text-amber-500">Low Stock Warning</p>
              <h3 className="text-2xl font-bold text-amber-500">{stats.lowStockProducts}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Orders Table */}
      <motion.div variants={slideUp} initial="initial" animate="animate">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground">Recent Orders</CardTitle>
            <Button variant="link" className="text-primary" onClick={() => navigate('/seller/orders')}>View All</Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={newOrders}
              onRowClick={(order) => navigate(`/seller/orders/${order.id}`)}
              emptyMessage="No new orders found"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
