import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, RefreshCw, Phone, ChevronRight,
  MapPin, Home, MessageSquare, HelpCircle, Shield,
  ChefHat, Receipt, CircleSlash, X, CheckCircle2,
  AlertTriangle, Info, Package, Truck, Clock,
  Star, MoreVertical, Search
} from "lucide-react";
import { useOrders } from "../../hooks/useOrders";
import { OrderStatus } from "../../types/order";
import GoogleMapsTracking from "../../components/GoogleMapsTracking";
import { useDeliveryTracking } from "../../hooks/useDeliveryTracking";
import DeliveryPartnerCard from "../../components/DeliveryPartnerCard";
import { cancelOrder, updateOrderNotes, getSellerLocationsForOrder, refreshDeliveryOtp } from "../../services/api/customerOrderService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Animated checkmark component
const AnimatedCheckmark = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5, type: "spring" }}
    className="w-24 h-24 rounded-[2.5rem] bg-green-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200"
  >
    <CheckCircle2 size={48} className="text-white" />
  </motion.div>
);

// Promotional banner carousel
const PromoCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const promos = [
    {
      bank: "HDFC BANK",
      offer: "10% cashback on all orders",
      subtext: "Extraordinary Rewards | Zero Joining Fee | T&C apply",
      color: "from-blue-50 to-indigo-50",
    },
    {
      bank: "ICICI BANK",
      offer: "15% instant discount",
      subtext: "Valid on orders above ₹299 | Use code ICICI15",
      color: "from-orange-50 to-red-50",
    },
    {
      bank: "SBI CARD",
      offer: "Flat ₹75 off",
      subtext: "On all orders | No minimum order value",
      color: "from-purple-50 to-pink-50",
    },
    {
      bank: "AXIS BANK",
      offer: "20% cashback up to ₹100",
      subtext: "Valid on first order | T&C apply",
      color: "from-teal-50 to-cyan-50",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="bg-white rounded-xl p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}>
      <div className="overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r ${promos[currentSlide].color}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded">
                  {promos[currentSlide].bank}
                </span>
              </div>
              <p className="font-semibold text-gray-900">
                {promos[currentSlide].offer}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {promos[currentSlide].subtext}
              </p>
              <button className="text-green-700 font-medium text-sm mt-2 flex items-center gap-1">
                Apply now <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-3">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-green-600 w-4" : "bg-gray-300"
              }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Tip selection component
const TipSection = () => {
  const [selectedTip, setSelectedTip] = useState<number | "other" | null>(null);
  const [customTip, setCustomTip] = useState("");
  const tips = [20, 30, 50];

  return (
    <motion.div
      className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}>
      <p className="text-neutral-900 font-black uppercase tracking-tighter text-sm mb-4">
        Support the delivery partner
      </p>
      <div className="flex gap-3">
        {tips.map((tip) => (
          <motion.button
            key={tip}
            onClick={() => {
              setSelectedTip(tip);
              setCustomTip("");
            }}
            className={`flex-1 py-3 px-3 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${selectedTip === tip
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-neutral-50 bg-neutral-50 text-neutral-400 hover:border-neutral-200"
              }`}
            whileTap={{ scale: 0.95 }}>
            ₹{tip}
          </motion.button>
        ))}
        <motion.button
          onClick={() => {
            setSelectedTip("other");
          }}
          className={`flex-1 py-3 px-3 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${selectedTip === "other"
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-neutral-50 bg-neutral-50 text-neutral-400 hover:border-neutral-200"
            }`}
          whileTap={{ scale: 0.95 }}>
          Other
        </motion.button>
      </div>

      <AnimatePresence>
        {selectedTip === "other" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <input
              type="number"
              placeholder="Enter custom amount"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              className="mt-4 w-full h-12 px-4 rounded-xl border border-neutral-100 bg-neutral-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const { getOrderById, fetchOrderById, loading: contextLoading } = useOrders();
  const [order, setOrder] = useState<any>(id ? getOrderById(id) : undefined);
  const [loading, setLoading] = useState(!order);

  const [showConfirmation, setShowConfirmation] = useState(confirmed);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    order?.status || "Received"
  );
  const [estimatedTime, setEstimatedTime] = useState(29);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);

  // Form states
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  // Real-time delivery tracking via WebSocket
  const {
    deliveryLocation,
    isConnected,
    orderStatus: socketOrderStatus,
    lastUpdate,
  } = useDeliveryTracking(id);

  const [sellerLocations, setSellerLocations] = useState<any[]>([]);

  // Fetch order if not in context
  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      const existingOrder = getOrderById(id);
      if (existingOrder) {
        setOrder(existingOrder);
        setOrderStatus(existingOrder.status);
        setLoading(false);
        return;
      }
      setLoading(true);
      const fetchedOrder = await fetchOrderById(id);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        setOrderStatus(fetchedOrder.status);
      }
      setLoading(false);
    };
    loadOrder();
  }, [id, getOrderById, fetchOrderById]);

  // Fetch seller locations
  useEffect(() => {
    const fetchSellerLocations = async () => {
      if (!id || !order) return;
      const shouldFetch = order.status && !['Delivered', 'Cancelled', 'Picked up', 'Out for Delivery'].includes(order.status);
      if (shouldFetch) {
        try {
          const response = await getSellerLocationsForOrder(id);
          if (response.success && response.data) {
            setSellerLocations(response.data || []);
          }
        } catch (err) {
          console.error('Failed to fetch seller locations:', err);
        }
      }
    };
    fetchSellerLocations();
  }, [id, order?.status]);

  // WebSocket status updates
  useEffect(() => {
    if (socketOrderStatus && socketOrderStatus !== orderStatus) {
      setOrderStatus(socketOrderStatus as OrderStatus);
      if (id) fetchOrderById(id).then(fetched => fetched && setOrder(fetched));
    }
  }, [socketOrderStatus, orderStatus, id]);

  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    const fetchedOrder = await fetchOrderById(id);
    if (fetchedOrder) {
      setOrder(fetchedOrder);
      setOrderStatus(fetchedOrder.status);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRefreshOtp = async () => {
    if (!id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshDeliveryOtp(id);
      const fetchedOrder = await fetchOrderById(id);
      if (fetchedOrder) setOrder(fetchedOrder);
    } catch (error) {
      console.error("Failed to refresh OTP:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Order #${id?.split('-').pop()}`,
      text: `Track my order: #${id?.split('-').pop()}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      }
    } catch (err) { console.error(err); }
  };

  const handleCallStore = () => {
    const storeNumber = order?.seller?.phone || "1234567890";
    window.location.href = `tel:${storeNumber}`;
  };

  const handleCancelOrder = async () => {
    if (!id) return;
    try {
      await cancelOrder(id, cancellationReason || "User cancelled");
      setOrderStatus("Cancelled" as any);
      setShowCancelModal(false);
      handleRefresh();
    } catch (error) { console.error(error); }
  };

  const handleSaveInstructions = async () => {
    if (!id) return;
    try {
      await updateOrderNotes(id, { deliveryInstructions });
      setShowInstructionsModal(false);
      handleRefresh();
    } catch (error) { console.error(error); }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neutral-100 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/30 pb-24">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-neutral-100 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-48 rounded-[2.5rem]" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-[2rem]" />
            <Skeleton className="h-24 rounded-[2rem]" />
            <Skeleton className="h-24 rounded-[2rem]" />
          </div>
          <Skeleton className="h-64 rounded-[2.5rem]" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="flex items-start gap-4 p-6 rounded-[2rem] border border-neutral-100 bg-white">
              <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <Card className="p-8 text-center rounded-[2rem] border-neutral-100 shadow-sm">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-4">Order Not Found</h2>
          <Button onClick={() => navigate('/orders')}>Check Your History</Button>
        </Card>
      </div>
    );
  }

  const statusConfig: Record<string, { title: string; subtitle: string }> = {
    Received: { title: "Order received", subtitle: "Checking availability" },
    Accepted: { title: "Preparing", subtitle: `Arriving in ${estimatedTime} mins` },
    "On the way": { title: "Out for delivery", subtitle: "Your order is close!" },
    "Out for Delivery": { title: "Out for delivery", subtitle: "Your order is close!" },
    Delivered: { title: "Delivered", subtitle: "Hope you enjoy it!" },
    Cancelled: { title: "Cancelled", subtitle: "Order was cancelled" },
  };

  const currentStatus = statusConfig[orderStatus] || { title: orderStatus, subtitle: "Order status updated" };

  return (
    <div className="min-h-screen bg-neutral-50/30 pb-24">
      {/* Order Confirmed Overlay */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8"
          >
            <AnimatedCheckmark delay={0.2} />
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-black text-neutral-900 uppercase tracking-tighter text-center"
            >
              Order Placed!
            </motion.h2>
            <Button className="mt-8 h-16 px-12 rounded-3xl font-black uppercase tracking-widest text-xs" onClick={() => setShowConfirmation(false)}>Track Live</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Header */}
      <div className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/orders')}
              className="rounded-xl hover:bg-neutral-100"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">Order Detail</h1>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">#{id?.split('-').pop()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-xl">
              <Share2 size={18} className="text-neutral-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="rounded-xl group">
              <RefreshCw size={18} className={cn("text-neutral-500", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Real-time Status Banner */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="rounded-[2.5rem] border-none bg-green-600 text-white p-8 shadow-2xl shadow-green-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  {orderStatus === 'Delivered' ? <CheckCircle2 size={24} /> : <Clock size={24} className="animate-pulse" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{currentStatus.title}</h2>
                  <p className="text-sm font-bold opacity-80 mt-1 uppercase tracking-widest">{currentStatus.subtitle}</p>
                </div>
              </div>

              {(['Accepted', 'On the way', 'Out for Delivery'].includes(orderStatus)) && (
                <div className="mt-8 pt-8 border-t border-white/20">
                  <div className="flex justify-between items-end mb-4">
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Estimated arrival</p>
                    <p className="text-4xl font-black tracking-tighter">{estimatedTime} <span className="text-lg opacity-80">MINS</span></p>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Live Tracking Map */}
        {orderStatus !== ('Delivered' as any) && orderStatus !== ('Cancelled' as any) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-[2.5rem] overflow-hidden border-neutral-100 bg-white p-2 shadow-sm">
              <div className="h-64 rounded-[2rem] overflow-hidden bg-neutral-100 border border-neutral-50">
                <GoogleMapsTracking
                  customerLocation={{
                    lat: order.address?.latitude || 0,
                    lng: order.address?.longitude || 0
                  }}
                  deliveryLocation={deliveryLocation as any}
                  sellerLocations={sellerLocations}
                  isTracking={['Accepted', 'On the way', 'Out for Delivery', 'Picked up'].includes(orderStatus)}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Store', icon: Phone, onClick: handleCallStore },
            { label: 'Help', icon: HelpCircle, onClick: () => window.open('/help', '_blank') },
            { label: 'Bill', icon: Receipt, onClick: () => setShowItemsModal(true) }
          ].map((item, i) => (
            <Button
              key={i}
              variant="outline"
              onClick={item.onClick}
              className="h-auto py-6 flex-col gap-3 rounded-[2rem] border-neutral-100 hover:border-green-600 hover:bg-green-50/50 group h-32"
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-white group-hover:text-green-600 transition-all">
                <item.icon size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900">{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Order Details List */}
        <Card className="rounded-[2.5rem] border-neutral-100 overflow-hidden divide-y divide-neutral-50 bg-white shadow-sm">
          <button
            onClick={() => setShowItemsModal(true)}
            className="w-full p-6 flex items-center justify-between hover:bg-neutral-50/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.25rem] bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:text-green-600 group-hover:bg-white transition-all">
                <Package size={28} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">Order Breakdown</p>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">{order.totalItems} {order.totalItems === 1 ? 'Item' : 'Items'} • ₹{order.totalAmount.toFixed(0)}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
          </button>

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-[1.25rem] bg-neutral-50 flex items-center justify-center text-neutral-400">
                <MapPin size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">Delivery To</p>
                <p className="text-xs font-bold text-neutral-500 mt-1 leading-relaxed lowercase truncate max-w-[200px]">
                  {order.address?.street || order.address?.address}, {order.address?.city}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Security OTP Banner */}
        {order?.deliveryOtp && orderStatus !== 'Delivered' && orderStatus !== 'Cancelled' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-[2.5rem] border-none bg-neutral-900 text-white p-8 shadow-2xl shadow-neutral-200 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-white/10 transition-colors" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Handover OTP</span>
                  </div>
                  <div className="flex gap-2">
                    {order.deliveryOtp.split('').map((digit: string, i: number) => (
                      <div key={i} className="w-10 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-black border border-white/5">
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRefreshOtp} className="rounded-2xl hover:bg-white/10 text-white p-6">
                  <RefreshCw size={24} className={cn(isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <PromoCarousel />

        <TipSection />

        {/* Cancel Button */}
        {orderStatus !== 'Delivered' && orderStatus !== 'Cancelled' && (
          <Button
            variant="ghost"
            onClick={() => setShowCancelModal(true)}
            className="w-full h-18 rounded-[2rem] text-red-500 hover:text-red-600 hover:bg-red-50 font-black text-xs uppercase tracking-[0.2em] border-2 border-dashed border-red-100 hover:border-red-200"
          >
            <CircleSlash size={18} className="mr-2" />
            Cancel Order
          </Button>
        )}
      </div>

      {/* Item Details Sheet */}
      <Sheet open={showItemsModal} onOpenChange={setShowItemsModal}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-0 overflow-hidden border-none max-w-2xl mx-auto h-[80vh]">
          <div className="h-full flex flex-col bg-white">
            <div className="px-8 pt-10 pb-6 border-b border-neutral-100 flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter">Summary</h3>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Payment verified via UPI</p>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl bg-neutral-100"><X size={20} /></Button>
              </SheetClose>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-xs font-black text-neutral-400 border border-neutral-100">{item.quantity}x</div>
                    <div>
                      <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">{item.product?.name || item.productName}</p>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">UNIT: ₹{item.price || item.unitPrice}</p>
                    </div>
                  </div>
                  <p className="text-base font-black text-neutral-900 tracking-tight">₹{(item.price || item.unitPrice) * item.quantity}</p>
                </div>
              ))}

              <div className="pt-10 border-t border-neutral-100 space-y-4">
                <div className="flex justify-between text-neutral-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-black tracking-tight text-neutral-600">₹{order.totalAmount - (order.deliveryCharge || 0)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Delivery Partner Fee</span>
                  <span className="text-sm font-black tracking-tight text-neutral-600">₹{order.deliveryCharge || 0}</span>
                </div>
                <div className="flex justify-between items-center pt-8 border-t border-neutral-50">
                  <span className="text-xl font-black text-neutral-900 uppercase tracking-tighter">Order Total</span>
                  <span className="text-4xl font-black text-green-600 tracking-tighter">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
            <div className="p-8 bg-neutral-50">
              <Button className="w-full h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs" onClick={() => setShowItemsModal(false)}>Back to Tracking</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Modal */}
      <Sheet open={showCancelModal} onOpenChange={setShowCancelModal}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-0 overflow-hidden border-none max-w-2xl mx-auto">
          <div className="p-10 bg-white">
            <div className="text-center mb-12">
              <div className="w-24 h-24 rounded-[2.5rem] bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-8 shadow-2xl shadow-red-50">
                <CircleSlash size={40} />
              </div>
              <h3 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter mb-4">Cancel Order?</h3>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest leading-relaxed px-6">
                Restaurant has already started preparing. This may lead to cancellation charges.
              </p>
            </div>

            <div className="mb-10">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 block px-2">Reason for leaving</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Mention why..."
                className="w-full rounded-[2.5rem] border border-neutral-100 bg-neutral-50 p-8 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all h-36 resize-none"
              />
            </div>

            <div className="flex flex-col gap-4">
              <Button
                onClick={handleCancelOrder}
                className="h-18 rounded-[2rem] bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-200"
              >
                Cancel Anyways
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" className="h-18 rounded-[2rem] font-black text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900">
                  Mistake, Keep it
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
