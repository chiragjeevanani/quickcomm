import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Calendar, ChevronRight,
  ArrowLeft, Package, Clock, CheckCircle2,
  Truck, XCircle, MoreVertical, Search
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return { color: 'green', icon: CheckCircle2, label: 'Delivered' };
    case 'on the way':
    case 'shipped':
      return { color: 'blue', icon: Truck, label: 'On the way' };
    case 'accepted':
    case 'confirmed':
      return { color: 'orange', icon: Clock, label: 'Processing' };
    case 'cancelled':
      return { color: 'red', icon: XCircle, label: 'Cancelled' };
    default:
      return { color: 'neutral', icon: Package, label: status };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function Orders() {
  const { orders, loading } = useOrders();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50 pb-24">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-neutral-100 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-[2.5rem] border-neutral-100 bg-white p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-neutral-50">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 rounded-[2.5rem] bg-neutral-50 flex items-center justify-center mb-8"
        >
          <div className="relative">
            <ShoppingBag size={48} className="text-neutral-200" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 p-1 bg-white rounded-lg shadow-sm border border-neutral-100"
            >
              <XCircle size={16} className="text-neutral-300" />
            </motion.div>
          </div>
        </motion.div>
        <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter mb-2">No orders yet</h2>
        <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8">Your shopping bags are waiting to be filled</p>
        <Button
          onClick={() => navigate('/')}
          className="h-14 px-8 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200"
        >
          Start Exploring
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/account')}
              className="rounded-xl hover:bg-neutral-100"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">My Orders</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Search size={20} className="text-neutral-400" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {orders.map((order, idx) => {
            const shortId = order.id.split('-').slice(-1)[0];
            const config = getStatusConfig(order.status);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] border-neutral-100 p-6 bg-white overflow-hidden relative"
                >
                  {/* Status Indicator Bar */}
                  <div className={cn(
                    "absolute top-0 right-0 w-32 h-1",
                    `bg-${config.color}-500/20`
                  )} />

                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                          `bg-${config.color}-50 text-${config.color}-600`
                        )}>
                          <config.icon size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-0.5">Order #{shortId}</p>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-neutral-900 tracking-tight">{config.label}</h3>
                            <div className={cn("w-1.5 h-1.5 rounded-full", `bg-${config.color}-500 animate-pulse`)} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.1em] mb-0.5">Amount</p>
                        <p className="text-lg font-black text-neutral-900 tracking-tighter">₹{order.totalAmount.toFixed(0)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-neutral-50 group-hover:border-neutral-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-neutral-500">
                          <Calendar size={14} className="text-neutral-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-neutral-500">
                          <Package size={14} className="text-neutral-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{order.totalItems} {order.totalItems === 1 ? 'Item' : 'Items'}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900">
                        Details <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
