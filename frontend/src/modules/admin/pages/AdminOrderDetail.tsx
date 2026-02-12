import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  User,
  MapPin,
  AlertTriangle,
  Mail,
  Phone,
  ArrowRight,
  Printer,
  Ban
} from 'lucide-react';
import { getOrderById, updateOrderStatus, Order } from '../../../services/api/admin/adminOrderService';
import { fadeIn, slideUp } from '../lib/animations';
import { useToast } from '../../../context/ToastContext';
import PageHeader from "../components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await getOrderById(id);
        if (response.success && response.data) {
          setOrder(response.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      const response = await updateOrderStatus(order._id, { status: newStatus });
      if (response.success && response.data) {
        setOrder(response.data);
        showToast('Order status updated successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update order', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Fetching Order Details...</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="p-8 text-center flex flex-col items-center gap-4">
      <AlertTriangle className="h-12 w-12 text-rose-500 opacity-20" />
      <h2 className="text-xl font-bold">Order Not Found</h2>
      <Button onClick={() => navigate('/admin/orders/all')}>Go Back to Orders</Button>
    </div>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 className="h-4 w-4" />;
      case 'Out for Delivery': return <Truck className="h-4 w-4" />;
      case 'Shipped': return <Package className="h-4 w-4" />;
      case 'Cancelled': return <Ban className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders/all')} className="h-8 w-8 hover:bg-accent text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`Order ${order.orderNumber}`}
          description={`Placed on ${new Date(order.orderDate).toLocaleString()}`}
        >
          <Button variant="outline" size="sm" className="gap-2 font-bold uppercase tracking-tighter">
            <Printer className="h-4 w-4" /> Print Invoice
          </Button>
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Current Progress</CardTitle>
              <Badge className={`gap-1.5 ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                {order.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Action: Move Status</span>
                  <Select value={order.status} onValueChange={handleStatusUpdate} disabled={updating}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Received', 'Pending', 'Processed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Rejected'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-sans">Shipment Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-6 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-xl bg-muted/50 flex items-center justify-center border border-border">
                        <Package className="h-8 w-8 text-primary/30" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{item.productName || 'Unnamed Product'}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-tighter mt-0.5">Seller: {item.seller?.storeName || 'Merchant'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{item.total?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} x ₹{item.unitPrice?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Shipping Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Home Address</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">
                    {order.deliveryAddress.address}, {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
                  </p>
                  {order.deliveryAddress.landmark && (
                    <Badge variant="outline" className="mt-2 text-[10px] bg-muted/30">Near {order.deliveryAddress.landmark}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Customer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{order.customerName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground leading-none">{order.customerName}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">Gold Tier Member</p>
                </div>
              </div>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" /> {order.customerEmail}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" /> {order.customerPhone}
                </div>
              </div>
              <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-tighter text-primary gap-2 mt-2">
                View History <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-primary/5 shadow-sm overflow-hidden relative">
            <div className="absolute bottom-0 right-0 h-24 w-24 bg-primary/5 rounded-full -mb-12 -mr-12 blur-2xl" />
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Handling & Tax</span>
                <span className="font-medium">₹{order.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping Fee</span>
                <span className="text-emerald-500 font-bold">₹{order.shipping?.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-rose-500 font-bold">
                  <span>Platform Discount</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="bg-primary/20" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold uppercase tracking-widest text-primary">Total Paid</span>
                <span className="text-2xl font-black text-primary">₹{order.total?.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                <CreditCard className="h-3 w-3" /> {order.paymentMethod} • {order.paymentStatus}
              </div>
            </CardContent>
          </Card>

          {order.deliveryBoy && (
            <Card className="border-border bg-card shadow-sm border-l-4 border-l-primary/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Logistics Operator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{(order.deliveryBoy as any).name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Assigned Hero</p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/20 text-primary">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
