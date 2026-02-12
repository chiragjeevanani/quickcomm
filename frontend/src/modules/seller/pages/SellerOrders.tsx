import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Download,
  Filter,
  Calendar,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { getOrders, Order, GetOrdersParams } from '../../../services/api/orderService';
import { fadeIn, slideUp } from '../lib/animations';
import DataTable from '../components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SellerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [entriesPerPage, setEntriesPerPage] = useState('10');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: GetOrdersParams = {
          limit: parseInt(entriesPerPage),
          search: searchQuery,
          status: statusFilter === 'All' ? undefined : statusFilter,
        };
        const response = await getOrders(params);
        if (response.success) {
          setOrders(response.data);
        } else {
          setError(response.message || 'Failed to fetch orders');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchQuery, statusFilter, entriesPerPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none">Delivered</Badge>;
      case 'Pending':
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-none">Pending</Badge>;
      case 'Cancelled':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none">Cancelled</Badge>;
      case 'Accepted':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none">Accepted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns = [
    { header: "Order ID", accessorKey: "orderId", cell: (order: Order) => <span className="font-bold text-foreground">{order.orderId}</span> },
    { header: "Order Date", accessorKey: "orderDate", cell: (order: Order) => <span className="text-muted-foreground">{order.orderDate}</span> },
    { header: "Delivery Date", accessorKey: "deliveryDate", cell: (order: Order) => <span className="text-muted-foreground">{order.deliveryDate}</span> },
    { header: "Status", accessorKey: "status", cell: (order: Order) => getStatusBadge(order.status) },
    { header: "Amount", accessorKey: "amount", cell: (order: Order) => <span className="font-bold text-foreground">₹{order.amount.toFixed(2)}</span> },
    {
      header: "Action",
      accessorKey: "action",
      cell: (order: Order) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/seller/orders/${order.id}`)}
          className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
        >
          View <ChevronRight className="w-4 h-4" />
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border bg-card text-foreground gap-2 hover:bg-accent">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </motion.div>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-1 items-center bg-background border border-border rounded-lg px-3 py-1.5 gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all max-w-md">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by ID, Status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 border-border bg-background text-foreground focus:ring-primary/20">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Show:</span>
                <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                  <SelectTrigger className="w-[80px] h-9 border-border bg-background text-foreground focus:ring-primary/20">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            onRowClick={(order) => navigate(`/seller/orders/${order.id}`)}
            emptyMessage="No orders found matching your filters"
          />
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  );
}
