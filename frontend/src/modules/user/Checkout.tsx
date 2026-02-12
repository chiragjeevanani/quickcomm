import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MapPin, Tag, Clock, Gift,
  Trash2, ShieldCheck, ChevronRight, Info, CheckCircle2,
  Phone, User as UserIcon, Mail, AlertTriangle, X, ArrowRight
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../hooks/useOrders';
import { useLocation as useLocationContext } from '../../hooks/useLocation';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

import { OrderAddress, Order } from '../../types/order';
import PartyPopper from './components/PartyPopper';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import WishlistButton from '../../components/WishlistButton';

import { getCoupons, validateCoupon, Coupon as ApiCoupon } from '../../services/api/customerCouponService';
import { appConfig } from '../../services/configService';
import { getAddresses, updateAddress } from '../../services/api/customerAddressService';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { getProducts } from '../../services/api/customerProductService';
import { addToWishlist } from '../../services/api/customerWishlistService';
import { updateProfile } from '../../services/api/customerService';
import { calculateProductPrice } from '../../utils/priceUtils';
import RazorpayCheckout from '../../components/RazorpayCheckout';
import { cn } from '@/lib/utils';

// const STORAGE_KEY = 'saved_address'; // Removed

// Similar products helper removed - using API


export default function Checkout() {
  const { cart, updateQuantity, clearCart, addToCart, removeFromCart, refreshCart, loading: cartLoading } = useCart();
  const { addOrder } = useOrders();
  const { location: userLocation } = useLocationContext();
  const { showToast: showGlobalToast } = useToast();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState<number>(0);
  const [showCustomTipInput, setShowCustomTipInput] = useState(false);
  const [savedAddress, setSavedAddress] = useState<OrderAddress | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<OrderAddress | null>(null);
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<ApiCoupon | null>(null);
  const [showPartyPopper, setShowPartyPopper] = useState(false);
  const [hasAppliedCouponBefore, setHasAppliedCouponBefore] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // Refresh cart delivery fee when selected address changes
  useEffect(() => {
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      refreshCart(selectedAddress.latitude, selectedAddress.longitude);
    }
  }, [selectedAddress]);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<ApiCoupon[]>([]);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatedDiscount, setValidatedDiscount] = useState<number>(0);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [showGstinSheet, setShowGstinSheet] = useState(false);
  const [gstin, setGstin] = useState<string>('');
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [giftPackaging, setGiftPackaging] = useState<boolean>(false);

  // Profile completion modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', email: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Map Picker State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapLocation, setMapLocation] = useState<{ lat: number, lng: number, address?: any } | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isMapSelected, setIsMapSelected] = useState(false);

  // Razorpay Payment State
  const [showRazorpayCheckout, setShowRazorpayCheckout] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);


  // Check if user has placeholder data (needs profile completion)
  const isPlaceholderUser = user?.name === 'User' || user?.email?.endsWith('@dhakadsnazzy.temp');

  // Redirect if empty
  useEffect(() => {
    if (!cartLoading && cart.items.length === 0 && !showOrderSuccess) {
      navigate('/');
    }
  }, [cart.items.length, cartLoading, navigate, showOrderSuccess]);

  // Load addresses and coupons
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [addressResponse, couponResponse] = await Promise.all([
          getAddresses(),
          getCoupons()
        ]);

        if (addressResponse.success && Array.isArray(addressResponse.data) && addressResponse.data.length > 0) {
          const defaultAddr = addressResponse.data.find((a: any) => a.isDefault) || addressResponse.data[0];
          const mappedAddress: OrderAddress = {
            name: defaultAddr.fullName,
            phone: defaultAddr.phone,
            flat: '',
            street: defaultAddr.address,
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode,
            landmark: defaultAddr.landmark || '',
            latitude: defaultAddr.latitude,
            longitude: defaultAddr.longitude,
            id: defaultAddr._id,
            _id: defaultAddr._id
          };
          setSavedAddress(mappedAddress);
          setSelectedAddress(mappedAddress);
        }

        if (couponResponse.success) {
          setAvailableCoupons(couponResponse.data);
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch similar products dynamically
  useEffect(() => {
    const fetchSimilar = async () => {
      const items = (cart?.items || []).filter(item => item && item.product);
      if (items.length === 0) return;

      const cartItem = items[0];
      try {
        let response;
        if (cartItem && cartItem.product) {
          // Try to fetch by category of the first item
          let catId = '';
          const product = cartItem.product;

          if (product.categoryId) {
            catId = typeof product.categoryId === 'string'
              ? product.categoryId
              : (product.categoryId as any)._id || (product.categoryId as any).id;
          }

          if (catId) {
            response = await getProducts({ category: catId, limit: 10 });
          } else {
            response = await getProducts({ limit: 10, sort: 'popular' });
          }
        } else {
          response = await getProducts({ limit: 10, sort: 'popular' });
        }

        if (response && response.data) {
          // Filter out items already in cart
          const itemsInCartIds = new Set((cart?.items || []).map(i => i.product?.id || i.product?._id).filter(Boolean));
          const filtered = response.data
            .filter((p: any) => !itemsInCartIds.has(p.id || p._id))
            .map((p: any) => {
              const { displayPrice, mrp } = calculateProductPrice(p);
              return {
                ...p,
                id: p._id || p.id,
                name: p.productName || p.name || 'Product',
                imageUrl: p.mainImage || p.imageUrl || p.mainImageUrl || '',
                price: displayPrice,
                mrp: mrp,
                pack: p.pack || p.variations?.[0]?.title || p.variations?.[0]?.name || 'Standard',
              };
            })
            .slice(0, 6);
          setSimilarProducts(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch similar products", err);
      }
    };
    fetchSimilar();
  }, [cart?.items?.length]);

  if (cartLoading || ((cart?.items?.length || 0) === 0 && !showOrderSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium text-neutral-600">
            {cartLoading ? 'Loading checkout...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  const displayItems = (cart?.items || []).filter(item => item && item.product);
  const displayCart = {
    ...cart,
    items: displayItems,
    itemCount: displayItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    total: displayItems.reduce((sum, item) => {
      const { displayPrice } = calculateProductPrice(item.product, item.variant);
      return sum + displayPrice * (item.quantity || 0);
    }, 0)
  };

  const freeDeliveryThreshold = cart.freeDeliveryThreshold ?? appConfig.freeDeliveryThreshold;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - (displayCart.total || 0));
  const cartItem = displayItems[0];

  /* DEBUG: Display Backend Configuration */
  const dbgConfig = (cart as any).debug_config;

  const itemsTotal = displayItems.reduce((sum, item) => {
    if (!item?.product) return sum;
    const { mrp } = calculateProductPrice(item.product, item.variant);
    return sum + (mrp * (item.quantity || 0));
  }, 0);

  const discountedTotal = displayCart.total;
  const savedAmount = itemsTotal - discountedTotal;
  const handlingCharge = cart.platformFee ?? appConfig.platformFee;

  // Use dynamic delivery fee if available (and valid), otherwise fallback to static config
  const deliveryCharge = (displayCart.estimatedDeliveryFee !== undefined)
    ? displayCart.estimatedDeliveryFee
    : (displayCart.total >= freeDeliveryThreshold ? 0 : appConfig.deliveryFee);

  // Recalculate or use validated discount
  // If we have a selected coupon, we should re-validate if cart total changes,
  // but for simplicity, we'll re-calculate locally if possible or trust the previous validation if acceptable (better to re-validate)
  const subtotalBeforeCoupon = discountedTotal + handlingCharge + deliveryCharge;

  // Local calculation for immediate feedback, relying on backend validation on Apply
  let currentCouponDiscount = 0;
  if (selectedCoupon) {
    // Logic mirrors backend for UI update purposes
    if (selectedCoupon.minOrderValue && subtotalBeforeCoupon < selectedCoupon.minOrderValue) {
      // Invalid now
    } else {
      if (selectedCoupon.discountType === 'percentage') {
        currentCouponDiscount = Math.round((subtotalBeforeCoupon * selectedCoupon.discountValue) / 100);
        if (selectedCoupon.maxDiscountAmount && currentCouponDiscount > selectedCoupon.maxDiscountAmount) {
          currentCouponDiscount = selectedCoupon.maxDiscountAmount;
        }
      } else {
        currentCouponDiscount = selectedCoupon.discountValue;
      }
    }
  }

  // Calculate tip amount (use custom tip if custom tip input is shown, otherwise use selected tip)
  const finalTipAmount = showCustomTipInput ? customTipAmount : (tipAmount || 0);
  const giftPackagingFee = giftPackaging ? 30 : 0;
  const grandTotal = Math.max(0, discountedTotal + handlingCharge + deliveryCharge + finalTipAmount + giftPackagingFee - currentCouponDiscount);

  const handleApplyCoupon = async (coupon: ApiCoupon) => {
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(coupon.code, subtotalBeforeCoupon);
      if (result.success && result.data?.isValid) {
        const isFirstTime = !hasAppliedCouponBefore;
        setSelectedCoupon(coupon);
        setValidatedDiscount(result.data.discountAmount);
        setShowCouponSheet(false);
        if (isFirstTime) {
          setHasAppliedCouponBefore(true);
          setShowPartyPopper(true);
        }
      } else {
        setCouponError(result.message || 'Invalid coupon');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    setValidatedDiscount(0);
    setCouponError(null);
  };

  const handleMoveToWishlist = async (product: any) => {
    if (!product?.id && !product?._id) return;

    const productId = product.id || product._id;

    try {
      if (!userLocation?.latitude || !userLocation?.longitude) {
        showGlobalToast('Location is required to move items to wishlist', 'error');
        return;
      }

      // Add to wishlist
      await addToWishlist(productId, userLocation.latitude, userLocation.longitude);
      // Remove from cart
      await removeFromCart(productId);
      // Show success message
      showGlobalToast('Item moved to wishlist');
    } catch (error: any) {
      console.error('Failed to move to wishlist:', error);
      const msg = error.response?.data?.message || 'Failed to move item to wishlist';
      showGlobalToast(msg, 'error');
    }
  };

  const handlePlaceOrder = async (arg?: any) => {
    // Only bypass if explicitly passed true (handles event objects from onClick)
    const bypassProfileCheck = arg === true;

    if (!selectedAddress || cart.items.length === 0) {
      return;
    }

    // Check if user needs to complete their profile first
    if (!bypassProfileCheck && isPlaceholderUser) {
      setProfileFormData({ name: user?.name === 'User' ? '' : (user?.name || ''), email: user?.email?.endsWith('@dhakadsnazzy.temp') ? '' : (user?.email || '') });
      setShowProfileModal(true);
      return;
    }

    // Validate required address fields
    if (!selectedAddress.city || !selectedAddress.pincode) {
      console.error("Address is missing required fields (city or pincode)");
      alert("Please ensure your address has city and pincode.");
      return;
    }

    // Use user's current location as fallback if address doesn't have coordinates
    const finalLatitude = selectedAddress.latitude ?? userLocation?.latitude;
    const finalLongitude = selectedAddress.longitude ?? userLocation?.longitude;

    // Validate that we have location data (either from address or user's current location)
    if (finalLatitude == null || finalLongitude == null) {
      console.error("Address is missing location data (latitude/longitude) and user location is not available");
      alert("Location is required for delivery. Please ensure your address has location data or enable location access.");
      return;
    }

    // Create address object with location data (use fallback if needed)
    const addressWithLocation: OrderAddress = {
      ...selectedAddress,
      latitude: finalLatitude,
      longitude: finalLongitude,
    };

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order: Order = {
      id: orderId,
      items: cart.items,
      totalItems: cart.itemCount || 0,
      subtotal: discountedTotal,
      fees: {
        platformFee: handlingCharge,
        deliveryFee: deliveryCharge,
      },
      totalAmount: grandTotal,
      address: addressWithLocation,
      status: 'Pending', // Changed from 'Placed' to 'Pending' until payment is complete
      createdAt: new Date().toISOString(),
      tipAmount: finalTipAmount,
      gstin: gstin || undefined,
      couponCode: selectedCoupon?.code || undefined,
      giftPackaging: giftPackaging,
    };

    try {
      // Create the order first (with Pending status)
      const placedId = await addOrder(order);
      if (placedId) {
        // Set the pending order ID and trigger Razorpay payment
        setPendingOrderId(placedId);
        setShowRazorpayCheckout(true);
        // Note: Cart will be cleared and success shown only after successful payment
        // See the RazorpayCheckout onSuccess handler (lines 1840-1846)
      }
    } catch (error: any) {
      console.error("Order placement failed", error);
      // Show user-friendly error message
      const errorMessage = error.message || error.response?.data?.message || "Failed to place order. Please try again.";
      alert(errorMessage);
    }
  };



  const handleGoToOrders = () => {
    if (placedOrderId) {
      navigate(`/orders/${placedOrderId}`);
    } else {
      navigate('/orders');
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedAddress?.id || !mapLocation) return;
    setIsUpdatingLocation(true);
    try {
      // Prepare update payload
      const updatePayload: any = {
        latitude: mapLocation.lat,
        longitude: mapLocation.lng
      };

      // If address details are available from map, update them too
      if (mapLocation.address) {
        if (mapLocation.address.street) updatePayload.address = mapLocation.address.street;
        if (mapLocation.address.city) updatePayload.city = mapLocation.address.city;
        if (mapLocation.address.state) updatePayload.state = mapLocation.address.state;
        if (mapLocation.address.pincode) updatePayload.pincode = mapLocation.address.pincode;
        if (mapLocation.address.landmark) updatePayload.landmark = mapLocation.address.landmark;
      }

      // Update the address in backend
      await updateAddress(selectedAddress.id, updatePayload);

      // Update local state
      const updated = {
        ...selectedAddress,
        latitude: mapLocation.lat,
        longitude: mapLocation.lng,
        street: mapLocation.address?.street || selectedAddress.street,
        city: mapLocation.address?.city || selectedAddress.city,
        state: mapLocation.address?.state || selectedAddress.state,
        pincode: mapLocation.address?.pincode || selectedAddress.pincode,
        landmark: mapLocation.address?.landmark || selectedAddress.landmark,
      };
      setSelectedAddress(updated);
      setSavedAddress(updated); // Sync
      setShowMapPicker(false);
      setIsMapSelected(true); // Mark map as selected
      showGlobalToast('Location and address updated successfully!');
    } catch (err) {
      console.error(err);
      // showGlobalToast('Failed to update location');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Handle profile completion submission
  const handleProfileSubmit = async () => {
    if (!profileFormData.name.trim() || !profileFormData.email.trim()) {
      setProfileError('Please enter both name and email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileFormData.email)) {
      setProfileError('Please enter a valid email address');
      return;
    }

    setIsUpdatingProfile(true);
    setProfileError(null);

    try {
      const response = await updateProfile({
        name: profileFormData.name.trim(),
        email: profileFormData.email.trim(),
      });

      if (response.success) {
        // Update local user data
        updateUser({
          ...user,
          id: user?.id || '',
          name: response.data.name,
          email: response.data.email,
        });

        setShowProfileModal(false);
        showGlobalToast('Profile updated successfully!');

        // Directly trigger order placement, bypassing the profile check
        handlePlaceOrder(true);
      }
    } catch (error: any) {
      setProfileError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };


  return (
    <div
      className="bg-white min-h-screen flex flex-col opacity-100"
      style={{ opacity: 1, height: '1250px' }}
    >


      {/* Party Popper Animation */}
      <PartyPopper
        show={showPartyPopper}
        onComplete={() => setShowPartyPopper(false)}
      />

      {/* Profile Completion Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-4">
                <Button variant="ghost" size="icon" onClick={() => setShowProfileModal(false)} className="rounded-full">
                  <X size={20} />
                </Button>
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-[hsl(var(--user-accent))]/10 rounded-full flex items-center justify-center mb-4">
                  <UserIcon size={32} className="text-[hsl(var(--user-accent))]" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Complete Profile</h2>
                <p className="text-sm text-neutral-500 font-medium">
                  Just a few details to get your order moving
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={profileFormData.name}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="pl-10 h-12 rounded-2xl bg-neutral-50 border-neutral-100 focus:bg-white transition-all font-semibold"
                      disabled={isUpdatingProfile}
                    />
                    <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={profileFormData.email}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="pl-10 h-12 rounded-2xl bg-neutral-50 border-neutral-100 focus:bg-white transition-all font-semibold"
                      disabled={isUpdatingProfile}
                    />
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>

                {profileError && (
                  <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-2xl flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {profileError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="user"
                    size="lg"
                    className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-[hsl(var(--user-accent))]/20"
                    onClick={handleProfileSubmit}
                    disabled={isUpdatingProfile || !profileFormData.name.trim() || !profileFormData.email.trim()}
                  >
                    {isUpdatingProfile ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : 'Save & Continue'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMapPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowMapPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-neutral-100 rounded-xl text-neutral-600">
                    <MapPin size={20} />
                  </div>
                  <h3 className="font-black text-neutral-900 uppercase tracking-tight">Set Delivery Location</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowMapPicker(false)} className="rounded-full">
                  <X size={20} />
                </Button>
              </div>

              <div className="relative">
                <GoogleMapsLocationPicker
                  initialLat={mapLocation?.lat || userLocation?.latitude || selectedAddress?.latitude || 0}
                  initialLng={mapLocation?.lng || userLocation?.longitude || selectedAddress?.longitude || 0}
                  onLocationSelect={(lat, lng, address) => setMapLocation({ lat, lng, address })}
                  height="350px"
                />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/50 z-10">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Drag the map to pinpoint your location
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-neutral-100">
                <div className="mb-6">
                  {mapLocation?.address ? (
                    <div className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-2 bg-[hsl(var(--user-accent))]/10 rounded-xl text-[hsl(var(--user-accent))] mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-neutral-900 line-clamp-2">
                          {mapLocation.address.street || "Unknown Street"}
                        </p>
                        <p className="text-xs font-medium text-neutral-400">
                          {mapLocation.address.city}, {mapLocation.address.pincode}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 flex items-center justify-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Select a point on the map</p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleUpdateLocation}
                  disabled={isUpdatingLocation}
                  variant="user"
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-[hsl(var(--user-accent))]/20"
                >
                  {isUpdatingLocation ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    <>Confirm Location</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showOrderSuccess && (
        <div
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center h-screen w-screen overflow-hidden"
        >
          {/* Confetti Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(60)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  scale: Math.random() * 0.5 + 0.5,
                  rotate: Math.random() * 360
                }}
                animate={{
                  top: `120%`,
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  ease: "linear",
                  delay: Math.random() * 10,
                  repeat: Infinity
                }}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="relative mb-12"
            >
              <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="w-40 h-40 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden group">
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <CheckCircle2 size={96} className="text-white relative z-10" strokeWidth={1.5} />
                </motion.div>
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rotate-45" />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <h2 className="text-4xl font-black text-neutral-900 uppercase tracking-tight mb-2">Order Confirmed!</h2>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mb-12">Your food is on its way</p>

              <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 mb-12 flex items-start gap-4 text-left">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm mb-1">Delivering to</h3>
                  <p className="text-neutral-500 text-xs font-semibold leading-relaxed">
                    {selectedAddress ? `${selectedAddress.flat ? selectedAddress.flat + ', ' : ''}${selectedAddress.street}, ${selectedAddress.city}` : "Your tagged location"}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="w-full"
            >
              <Button
                onClick={handleGoToOrders}
                variant="user"
                className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-[hsl(var(--user-accent))]/30 flex items-center justify-center gap-3"
              >
                Track Your Order
                <ArrowRight size={24} />
              </Button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 text-neutral-400 font-bold uppercase tracking-widest text-xs mt-4 hover:text-neutral-900 transition-colors"
              >
                Back to Home
              </button>
            </motion.div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-100 backdrop-blur-md bg-white/80">
        <div className="px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-neutral-100"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </Button>

          <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Checkout</h1>

          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Ordering for someone else */}
        <div className="px-4 md:px-6 lg:px-8 py-3 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-[hsl(var(--user-accent))]" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ordering for someone else?</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/checkout/address', {
                state: {
                  editAddress: savedAddress
                }
              })}
              className="text-xs font-bold text-[hsl(var(--user-accent))] hover:bg-[hsl(var(--user-accent))]/10 px-2 py-1 h-auto"
            >
              Add details
            </Button>
          </div>
        </div>

        <div className="px-4 md:px-6 lg:px-8 py-6 border-b border-neutral-100">
          <div className="max-w-5xl mx-auto">
            <div className="mb-4">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Delivery Address</h3>
              <p className="text-xs font-medium text-neutral-400">Select or edit your saved address</p>
            </div>

            <Card
              className={cn(
                "p-4 cursor-pointer transition-all duration-300 border-2 rounded-3xl",
                selectedAddress && !isMapSelected
                  ? "border-[hsl(var(--user-accent))] bg-[hsl(var(--user-accent))]/5 shadow-lg shadow-[hsl(var(--user-accent))]/5"
                  : "border-neutral-100 bg-white hover:border-neutral-200"
              )}
              onClick={() => {
                setSelectedAddress(savedAddress);
                setIsMapSelected(false);
              }}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-colors",
                  selectedAddress && !isMapSelected ? "bg-[hsl(var(--user-accent))] text-white" : "bg-neutral-100 text-neutral-400"
                )}>
                  <MapPin size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-neutral-900 uppercase tracking-tight">Default Address</span>
                    {selectedAddress && !isMapSelected && (
                      <Badge variant="user" className="rounded-full h-5 px-1.5 flex items-center justify-center">
                        <CheckCircle2 size={12} />
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-neutral-400 hover:text-[hsl(var(--user-accent))] hover:bg-[hsl(var(--user-accent))]/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/checkout/address', { state: { editAddress: savedAddress } });
                  }}
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            </Card>

            {/* Set Location on Map Button */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMapLocation({
                    lat: userLocation?.latitude || selectedAddress?.latitude || 0,
                    lng: userLocation?.longitude || selectedAddress?.longitude || 0
                  });
                  setShowMapPicker(true);
                }}
                className={cn(
                  "w-full h-14 rounded-2xl font-bold gap-3 transition-all",
                  isMapSelected
                    ? "text-[hsl(var(--user-accent))] bg-[hsl(var(--user-accent))]/5 border-[hsl(var(--user-accent))] shadow-lg shadow-[hsl(var(--user-accent))]/5"
                    : "text-neutral-600 border-neutral-100 hover:bg-neutral-50"
                )}
              >
                {isMapSelected ? (
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                ) : (
                  <MapPin size={24} />
                )}
                {isMapSelected
                  ? 'Precise Location Selected'
                  : (selectedAddress?.latitude ? 'Update Precise Location on Map' : 'Set Exact Location on Map')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Product Card */}
        <div className="px-4 md:px-6 lg:px-8 py-6 bg-white border-b border-neutral-100">
          <Card className="max-w-5xl mx-auto border-neutral-100 shadow-xl shadow-neutral-100/50 rounded-3xl overflow-hidden">
            <div className="p-4 md:p-6">
              {/* Delivery info */}
              <div className="flex items-center gap-2 mb-6 text-[hsl(var(--user-accent))] bg-[hsl(var(--user-accent))]/5 px-4 py-3 rounded-2xl border border-[hsl(var(--user-accent))]/10 w-fit">
                <Clock size={18} className="animate-pulse" />
                <span className="text-sm font-black uppercase tracking-tight">Delivery in {appConfig.estimatedDeliveryTime}</span>
              </div>

              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Shipment ({displayCart.itemCount})</h3>
                <Badge variant="outline" className="rounded-full border-neutral-100 text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                  Standard Shipping
                </Badge>
              </div>

              {/* Cart Items */}
              <div className="space-y-4">
                {displayItems.filter(item => item.product).map((item) => {
                  const { displayPrice } = calculateProductPrice(item.product, item.variant);
                  return (
                    <div key={item.product?.id || Math.random()} className="flex gap-4 p-3 rounded-2xl hover:bg-neutral-50 transition-colors group">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden border border-neutral-200 group-hover:scale-105 transition-transform">
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product?.imageUrl}
                            alt={item.product?.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300 font-bold text-xl">
                            {item.product?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1 group-hover:text-[hsl(var(--user-accent))] transition-colors">{item.product?.name}</h4>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{item.product?.pack}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-neutral-900">₹{displayPrice.toLocaleString('en-IN')} × {item.quantity}</span>
                          <span className="text-sm font-black text-neutral-900">₹{(displayPrice * item.quantity).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* You might also like */}
        <div className="px-4 md:px-6 lg:px-8 py-8 border-b border-neutral-100 bg-neutral-50/50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Complete Your Meal</h2>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--user-accent))]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
              </div>
            </div>
            <h2 className="text-sm font-semibold text-neutral-900 mb-2">You might also like</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 -mx-1 px-1">
              {similarProducts.map((product) => {
                const { displayPrice, discount, hasDiscount } = calculateProductPrice(product);
                return (
                  <Card
                    key={product.id}
                    className="flex-shrink-0 w-44 rounded-3xl border-neutral-100 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  >
                    <div className="p-3">
                      <div className="relative aspect-square mb-3 bg-neutral-100 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300 font-black text-3xl uppercase">
                            {product.name?.charAt(0)}
                          </div>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {discount}% OFF
                          </div>
                        )}
                        <WishlistButton
                          productId={product.id || product._id}
                          size="sm"
                          className="top-2 right-2 shadow-sm"
                        />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 line-clamp-1 mb-0.5 group-hover:text-[hsl(var(--user-accent))] transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
                        {product.pack}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-neutral-900">₹{displayPrice}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(product, e.currentTarget);
                          }}
                          className="h-8 rounded-xl border-[hsl(var(--user-accent))] text-[hsl(var(--user-accent))] hover:bg-[hsl(var(--user-accent))] hover:text-white font-bold"
                        >
                          ADD
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Get FREE delivery banner */}
        {deliveryCharge > 0 && (
          <div className="px-4 md:px-6 lg:px-8 py-6 bg-blue-50/50 border-b border-blue-100">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200/50 flex items-center justify-center text-white">
                  <ChevronRight className="rotate-180" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-blue-900 uppercase tracking-tight">Get FREE delivery</span>
                    <ChevronRight size={18} className="text-blue-400" />
                  </div>
                  <p className="text-xs font-bold text-blue-600 mt-0.5">Add products worth ₹{amountNeededForFreeDelivery} more</p>
                </div>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  style={{ width: `${Math.min(100, ((appConfig.freeDeliveryThreshold - amountNeededForFreeDelivery) / appConfig.freeDeliveryThreshold) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Coupon Section */}
        <div className="px-4 md:px-6 lg:px-8 py-6 border-b border-neutral-100">
          <div className="max-w-5xl mx-auto">
            {selectedCoupon ? (
              <div className="flex items-center justify-between bg-[hsl(var(--user-accent))]/5 rounded-3xl p-4 border border-[hsl(var(--user-accent))]/10 shadow-xl shadow-[hsl(var(--user-accent))]/5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--user-accent))] flex items-center justify-center shadow-lg shadow-[hsl(var(--user-accent))]/20">
                    <Tag size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[hsl(var(--user-accent))] uppercase tracking-widest mb-0.5">{selectedCoupon.code}</p>
                    <p className="text-sm font-bold text-neutral-900 truncate">₹{currentCouponDiscount} saved with this coupon</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-black text-red-600 hover:text-red-700 hover:bg-red-50 uppercase tracking-widest px-4"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowCouponSheet(true)}
                className="w-full h-16 rounded-3xl border-dashed border-2 border-neutral-200 hover:border-[hsl(var(--user-accent))] hover:bg-[hsl(var(--user-accent))]/5 transition-all group flex items-center justify-between px-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-[hsl(var(--user-accent))]/10 transition-colors">
                    <Tag size={20} className="text-neutral-400 group-hover:text-[hsl(var(--user-accent))]" />
                  </div>
                  <span className="text-sm font-bold text-neutral-600 group-hover:text-neutral-900">Apply Coupon</span>
                </div>
                <ChevronRight size={20} className="text-neutral-300 group-hover:text-[hsl(var(--user-accent))]" />
              </Button>
            )}
          </div>
        </div>

        {/* Bill details */}
        <div className="px-4 md:px-6 lg:px-8 py-8 border-b border-neutral-100 bg-neutral-50/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Order Summary</h2>

            <Card className="rounded-3xl border-neutral-100 overflow-hidden shadow-sm">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-600">Item Total</span>
                    {savedAmount > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-none rounded-full px-2 text-[10px] font-black uppercase tracking-tight">
                        Saved ₹{savedAmount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {itemsTotal > discountedTotal && (
                      <span className="text-xs text-neutral-400 line-through font-bold">₹{itemsTotal}</span>
                    )}
                    <span className="text-sm font-black text-neutral-900">₹{discountedTotal}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Info size={16} className="text-neutral-400" />
                    <span className="text-sm font-bold">Handling Fee</span>
                  </div>
                  <span className="text-sm font-black text-neutral-900">₹{handlingCharge}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin size={16} className="text-neutral-400" />
                    <span className="text-sm font-bold">Delivery Fee</span>
                  </div>
                  <span className={cn("text-sm font-black", deliveryCharge === 0 ? "text-green-600" : "text-neutral-900")}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>

                {selectedCoupon && currentCouponDiscount > 0 && (
                  <div className="flex items-center justify-between text-[hsl(var(--user-accent))]">
                    <div className="flex items-center gap-2">
                      <Tag size={16} />
                      <span className="text-sm font-black uppercase tracking-tight">Coupon ({selectedCoupon.code})</span>
                    </div>
                    <span className="text-sm font-black">-₹{currentCouponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {finalTipAmount > 0 && (
                  <div className="flex items-center justify-between text-blue-600">
                    <div className="flex items-center gap-2">
                      <Gift size={16} />
                      <span className="text-sm font-black italic">Kindness Tip</span>
                    </div>
                    <span className="text-sm font-black">₹{finalTipAmount}</span>
                  </div>
                )}

                {giftPackaging && (
                  <div className="flex items-center justify-between text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-neutral-400" />
                      <span className="text-sm font-bold">Gift Packaging</span>
                    </div>
                    <span className="text-sm font-black text-neutral-900">₹{giftPackagingFee}</span>
                  </div>
                )}

                <div className="pt-6 border-t border-neutral-100 mt-2 flex items-center justify-between">
                  <span className="text-lg font-black text-neutral-900 uppercase tracking-tighter">Grand Total</span>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-neutral-900 tracking-tighter">₹{Math.max(0, grandTotal)}</span>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Inclusive of all taxes</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* GSTIN and Optional Services */}
        <div className="px-4 md:px-6 lg:px-8 py-8 border-b border-neutral-100">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* GSTIN */}
            <Button
              variant="outline"
              onClick={() => setShowGstinSheet(true)}
              className="w-full h-auto p-6 rounded-3xl border-neutral-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group flex items-start justify-between"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <div className="text-blue-600 font-black text-lg">%</div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">Add GSTIN</p>
                  <p className="text-xs font-bold text-neutral-500 mt-1">
                    {gstin ? `GSTIN: ${gstin}` : 'Claim GST input credit up to 18% on your order'}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-neutral-300 group-hover:text-blue-600 mt-1" />
            </Button>

            {/* Tip Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gift className="text-blue-600" size={20} />
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">Tip your delivery partner</h3>
              </div>
              <p className="text-xs font-bold text-neutral-500 mb-4 leading-relaxed">
                Your kindness means a lot! 100% of your tip will go directly to your delivery partner.
              </p>

              <div className="grid grid-cols-4 gap-3">
                {[20, 30, 50].map((amount) => (
                  <Button
                    key={amount}
                    variant={tipAmount === amount && !showCustomTipInput ? "default" : "outline"}
                    onClick={() => {
                      setTipAmount(amount);
                      setShowCustomTipInput(false);
                    }}
                    className={cn(
                      "h-12 rounded-2xl font-black text-sm transition-all",
                      tipAmount === amount && !showCustomTipInput
                        ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                        : "border-neutral-100 hover:border-blue-200 hover:bg-blue-50"
                    )}
                  >
                    ₹{amount}
                  </Button>
                ))}
                <Button
                  variant={showCustomTipInput ? "default" : "outline"}
                  onClick={() => {
                    setShowCustomTipInput(true);
                    setTipAmount(null);
                  }}
                  className={cn(
                    "h-12 rounded-2xl font-black text-sm transition-all",
                    showCustomTipInput
                      ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                      : "border-neutral-100 hover:border-blue-200 hover:bg-blue-50"
                  )}
                >
                  Custom
                </Button>
              </div>

              {showCustomTipInput && (
                <div className="mt-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                  <Input
                    type="number"
                    value={customTipAmount || ''}
                    onChange={(e) => setCustomTipAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter amount"
                    className="h-12 rounded-2xl border-2 border-blue-600 focus-visible:ring-0 font-bold"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCustomTipInput(false);
                      setCustomTipAmount(0);
                    }}
                    className="text-neutral-400 font-bold"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Gift Packaging Toggle */}
            <Button
              variant="outline"
              onClick={() => setGiftPackaging(!giftPackaging)}
              className={cn(
                "w-full h-auto p-6 rounded-3xl border-2 transition-all group flex items-start justify-between",
                giftPackaging
                  ? "border-[hsl(var(--user-accent))] bg-[hsl(var(--user-accent))]/5 shadow-xl shadow-[hsl(var(--user-accent))]/5"
                  : "border-neutral-100 hover:border-neutral-200"
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg",
                  giftPackaging
                    ? "bg-[hsl(var(--user-accent))] text-white shadow-[hsl(var(--user-accent))]/20"
                    : "bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200"
                )}>
                  <Gift size={24} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">Gift Packaging</p>
                    {giftPackaging && <Badge className="bg-green-100 text-green-700 text-[8px] border-none font-black uppercase tracking-tighter">Selected</Badge>}
                  </div>
                  <p className="text-xs font-bold text-neutral-500 mt-1">
                    Add elegant packaging for just ₹{giftPackagingFee}
                  </p>
                </div>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center mt-3",
                giftPackaging ? "bg-[hsl(var(--user-accent))] border-[hsl(var(--user-accent))]" : "border-neutral-200"
              )}>
                {giftPackaging && <CheckCircle2 size={14} className="text-white" />}
              </div>
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 md:px-6 lg:px-8 py-12 bg-neutral-50/50">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <Button
                variant="ghost"
                onClick={() => setShowCancellationPolicy(true)}
                className="text-xs font-black text-neutral-400 hover:text-neutral-900 uppercase tracking-[0.2em] transition-colors"
              >
                Cancellation Policy
              </Button>

              <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-neutral-100">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Handcrafted with</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <CheckCircle2 size={16} className="text-red-500" fill="currentColor" />
                </motion.div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">by</span>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">KrishiKart Team</span>
              </div>
            </div>
          </div>
        </div>

        {/* GSTIN Sheet Modal */}
        <Sheet open={showGstinSheet} onOpenChange={setShowGstinSheet}>
          <SheetContent side="bottom" className="rounded-t-[3rem] p-0 overflow-hidden border-none max-w-2xl mx-auto h-[60vh]">
            <div className="h-full flex flex-col bg-white">
              <div className="px-8 pt-8 pb-4 border-b border-neutral-100">
                <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
                <SheetHeader className="text-left">
                  <SheetTitle className="text-2xl font-black text-neutral-900 uppercase tracking-tighter">GST Details</SheetTitle>
                  <p className="text-sm font-bold text-neutral-500 mt-1">Claim up to 18% GST input credit</p>
                </SheetHeader>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">GSTIN Number</label>
                    <Input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                      placeholder="27AAAAA0000A1Z5"
                      className="h-16 rounded-3xl border-2 border-neutral-100 focus-visible:border-blue-600 focus-visible:ring-0 text-lg font-black tracking-widest placeholder:text-neutral-200"
                    />
                    <p className="text-[10px] font-bold text-neutral-400 ml-1">Example: 27AAAAA0000A1Z5 (15 characters)</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-neutral-50 border-t border-neutral-100">
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      if (gstin.length === 15) setShowGstinSheet(false);
                      else alert('Please enter a valid 15-character GSTIN');
                    }}
                    className="w-full h-16 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200"
                  >
                    Save & Apply
                  </Button>
                  {gstin && (
                    <Button
                      variant="ghost"
                      onClick={() => { setGstin(''); setShowGstinSheet(false); }}
                      className="w-full h-12 rounded-2xl text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50"
                    >
                      Remove GSTIN
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Cancellation Policy Sheet Modal */}
        <Sheet open={showCancellationPolicy} onOpenChange={setShowCancellationPolicy}>
          <SheetContent side="bottom" className="rounded-t-[3rem] p-0 overflow-hidden border-none max-w-2xl mx-auto h-[70vh]">
            <div className="h-full flex flex-col bg-white">
              <div className="px-8 pt-8 pb-4 border-b border-neutral-100">
                <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
                <SheetHeader className="text-left">
                  <SheetTitle className="text-2xl font-black text-neutral-900 uppercase tracking-tighter">Cancellation Policy</SheetTitle>
                  <p className="text-sm font-bold text-neutral-500 mt-1">Please read before placing order</p>
                </SheetHeader>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <AlertTriangle size={18} />
                      </div>
                      <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">Order Cancellation</h3>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed font-bold">
                      Orders can only be cancelled before they are confirmed by our partner stores. Once confirmed, we are unable to cancel or modify the order.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Info size={18} />
                      </div>
                      <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">Refund Policy</h3>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "Refunds are processed within 5-7 business days",
                        "Original payment method will be credited",
                        "Delivery charges are generally non-refundable"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2" />
                          <span className="text-sm font-bold text-neutral-500">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-neutral-50 border-t border-neutral-100">
                <Button
                  onClick={() => setShowCancellationPolicy(false)}
                  className="w-full h-16 rounded-3xl bg-neutral-900 hover:bg-neutral-800 text-white font-black text-sm uppercase tracking-widest"
                >
                  I Understand
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Coupon Sheet Modal */}
        <Sheet open={showCouponSheet} onOpenChange={setShowCouponSheet}>
          <SheetContent side="bottom" className="rounded-t-[3rem] p-0 overflow-hidden border-none max-w-2xl mx-auto h-[85vh]">
            <div className="h-full flex flex-col bg-white">
              <div className="px-8 pt-8 pb-4 border-b border-neutral-100">
                <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
                <SheetHeader className="text-left">
                  <SheetTitle className="text-2xl font-black text-neutral-900 uppercase tracking-tighter">Available Coupons</SheetTitle>
                  <p className="text-sm font-bold text-neutral-500 mt-1">Unlock massive savings on your order</p>
                </SheetHeader>
              </div>

              <div className="p-8 flex-1 overflow-y-auto bg-neutral-50/50">
                <div className="space-y-4">
                  {availableCoupons.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-6">
                        <Tag size={40} className="text-neutral-300" />
                      </div>
                      <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">No coupons available</p>
                    </div>
                  ) : (
                    availableCoupons.map((coupon) => {
                      const subtotalBeforeCoupon = discountedTotal + handlingCharge + deliveryCharge;
                      const meetsMinOrder = !coupon.minOrderValue || subtotalBeforeCoupon >= coupon.minOrderValue;
                      const isSelected = selectedCoupon?._id === coupon._id;

                      return (
                        <Card
                          key={coupon._id}
                          className={cn(
                            "rounded-3xl border-2 transition-all p-6",
                            isSelected
                              ? "border-[hsl(var(--user-accent))] bg-[hsl(var(--user-accent))]/5 shadow-xl shadow-[hsl(var(--user-accent))]/5"
                              : meetsMinOrder
                                ? "border-neutral-100 hover:border-neutral-200 bg-white"
                                : "border-neutral-50 bg-neutral-50/50 opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-[hsl(var(--user-accent))] text-white border-none font-black px-3 py-1 rounded-lg">
                                  {coupon.code}
                                </Badge>
                                <span className="text-base font-black text-neutral-900 tracking-tight">{coupon.title}</span>
                              </div>
                              <p className="text-xs font-bold text-neutral-500 leading-relaxed mb-4">{coupon.description}</p>
                              {coupon.minOrderValue && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                  <Info size={12} />
                                  <span>Min. Order ₹{coupon.minOrderValue}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => meetsMinOrder && handleApplyCoupon(coupon)}
                              disabled={!meetsMinOrder || isValidatingCoupon || isSelected}
                              variant={isSelected ? "secondary" : "default"}
                              className={cn(
                                "h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                                isSelected
                                  ? "bg-green-100 text-green-700"
                                  : meetsMinOrder
                                    ? "bg-[hsl(var(--user-accent))] hover:bg-[hsl(var(--user-accent))]-700 text-white"
                                    : "bg-neutral-200 text-neutral-400"
                              )}
                            >
                              {isSelected ? "Applied" : isValidatingCoupon ? "..." : "Apply"}
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-8 bg-white border-t border-neutral-100">
                <SheetClose asChild>
                  <Button className="w-full h-16 rounded-3xl bg-neutral-900 hover:bg-neutral-800 text-white font-black text-sm uppercase tracking-widest">
                    Back to Checkout
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 bg-white/80 backdrop-blur-xl border-t border-neutral-100 z-[60] shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col min-w-[120px]">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">To Pay</span>
                <span className="text-2xl font-black text-neutral-900 tracking-tighter">₹{Math.max(0, grandTotal)}</span>
              </div>

              {selectedAddress ? (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={cart.items.length === 0}
                  className="flex-1 h-16 rounded-[2rem] bg-green-600 hover:bg-green-700 text-white shadow-2xl shadow-green-200 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center sm:hidden mr-2 pr-4 border-r border-white/20">
                      <span className="text-[8px] font-black uppercase opacity-70">Pay</span>
                      <span className="text-sm font-black tracking-tighter line-through decoration-white/30 text-white/50">₹{itemsTotal + handlingCharge + deliveryCharge}</span>
                      <span className="text-base font-black tracking-tighter">₹{Math.max(0, grandTotal)}</span>
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.1em]">Place Order</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/checkout/address', { state: { editAddress: savedAddress } })}
                  className="flex-1 h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-200 group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-black uppercase tracking-[0.1em]">Choose Delivery Address</span>
                    <MapPin size={20} className="group-hover:scale-110 transition-transform" />
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Animation Styles */}
        <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkDraw {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }

        @keyframes ringPulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0% {
            transform: rotate(var(--rotation, 0deg)) translateY(0) scale(0);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation, 0deg)) translateY(-80px) scale(1);
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }

        .check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
        }
      `}</style>

        {/* Razorpay Checkout Modal */}
        {
          showRazorpayCheckout && pendingOrderId && user && (
            <RazorpayCheckout
              orderId={pendingOrderId}
              amount={grandTotal}
              customerDetails={{
                name: user.name || 'Customer',
                email: user.email || '',
                phone: user.phone || '',
              }}
              onSuccess={(paymentId) => {
                setShowRazorpayCheckout(false);
                setPlacedOrderId(pendingOrderId);
                setPendingOrderId(null);
                clearCart();
                setShowOrderSuccess(true);
                showGlobalToast('Payment successful!', 'success');
              }}
              onFailure={(error) => {
                setShowRazorpayCheckout(false);
                setPendingOrderId(null);
                showGlobalToast(error || 'Payment failed. Please try again.', 'error');
              }}
            />
          )
        }
      </div >
    </div >
  );
}

