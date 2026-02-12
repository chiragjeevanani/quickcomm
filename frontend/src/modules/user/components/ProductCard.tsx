import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState, memo } from 'react';
import { Heart, Clock, Plus, Minus, Star, Zap } from 'lucide-react';
import { Product } from '@/types/domain';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/context/ToastContext';
import { addToWishlist, removeFromWishlist, getWishlist } from '@/services/api/customerWishlistService';
import { Button } from '@/components/ui/button';
import { calculateProductPrice } from '@/utils/priceUtils';
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
  badgeText?: string;
  showPackBadge?: boolean;
  showStockInfo?: boolean;
  showHeartIcon?: boolean;
  showRating?: boolean;
  compact?: boolean;
  categoryStyle?: boolean;
}

const ProductCard = memo(({
  product,
  showBadge = false,
  badgeText,
  showPackBadge = false,
  showStockInfo = false,
  showHeartIcon = true,
  showRating = true,
  compact = false,
  categoryStyle = false,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast();
  const imageRef = useRef<HTMLImageElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const isOperationPendingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsWishlisted(false);
      return;
    }

    const checkWishlist = async () => {
      try {
        const res = await getWishlist({
          latitude: location?.latitude,
          longitude: location?.longitude
        });
        if (res.success && res.data?.products) {
          const targetId = String((product as any).id || product._id);
          const exists = res.data.products.some(p => String(p._id || (p as any).id) === targetId);
          setIsWishlisted(exists);
        }
      } catch (e) {
        setIsWishlisted(false);
      }
    };
    checkWishlist();
  }, [product.id, product._id, isAuthenticated, location?.latitude, location?.longitude]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const targetId = String((product as any).id || product._id);
    const previousState = isWishlisted;

    try {
      if (isWishlisted) {
        setIsWishlisted(false);
        await removeFromWishlist(targetId);
        showToast('Removed from wishlist');
      } else {
        if (!location?.latitude || !location?.longitude) {
          showToast('Location required', 'error');
          return;
        }
        setIsWishlisted(true);
        await addToWishlist(targetId, location?.latitude, location?.longitude);
        showToast('Added to wishlist');
      }
    } catch (e: any) {
      setIsWishlisted(previousState);
      showToast(e.response?.data?.message || 'Failed to update wishlist', 'error');
    }
  };

  const cartItem = cart.items.find((item) => item?.product && (item.product.id === (product as any).id || item.product._id === (product as any).id || item.product.id === product._id));
  const inCartQty = cartItem?.quantity || 0;
  const { displayPrice, mrp, discount } = calculateProductPrice(product);

  const handleAction = async (e: React.MouseEvent, type: 'add' | 'inc' | 'dec') => {
    e.stopPropagation();
    e.preventDefault();

    if (product.isAvailable === false || isOperationPendingRef.current) return;

    isOperationPendingRef.current = true;
    try {
      if (type === 'add' || (type === 'inc' && inCartQty === 0)) {
        await addToCart(product, addButtonRef.current);
      } else if (type === 'inc') {
        await updateQuantity(((product as any).id || product._id) as string, inCartQty + 1);
      } else if (type === 'dec' && inCartQty > 0) {
        await updateQuantity(((product as any).id || product._id) as string, inCartQty - 1);
      }
    } finally {
      isOperationPendingRef.current = false;
    }
  };

  const productName = product.name || product.productName || '';
  const displayPack = product.variations?.[0]?.value || product.pack || '1 unit';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative bg-white rounded-xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full",
        categoryStyle && "bg-neutral-50/30"
      )}
    >
      {/* Top Image Section */}
      <div
        onClick={() => navigate(`/product/${((product as any).id || product._id)}`)}
        className="relative aspect-square w-full cursor-pointer overflow-hidden bg-white"
      >
        {product.imageUrl || product.mainImage ? (
          <img
            ref={imageRef}
            src={product.imageUrl || product.mainImage}
            alt={productName}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-neutral-200">
            {productName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Badges */}
        {(showBadge || discount > 0) && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              {discount}% OFF
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        {showHeartIcon && (
          <button
            onClick={toggleWishlist}
            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-neutral-100 flex items-center justify-center group/heart hover:bg-white transition-all"
          >
            <Heart
              size={14}
              className={cn("transition-all", isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-400 group-hover/heart:text-red-400")}
            />
          </button>
        )}

        {/* Delivery Time Badge */}
        {showStockInfo && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded-full border border-neutral-100 shadow-sm">
            <Clock size={10} className="text-[hsl(var(--user-accent))]" />
            <span className="text-[9px] font-bold text-neutral-700">14 MINS</span>
          </div>
        )}

        {/* Add/Stepper Overlay for fast Interaction */}
        <div className="absolute bottom-2 right-2 z-20">
          <AnimatePresence mode="wait">
            {inCartQty === 0 ? (
              <Button
                ref={addButtonRef}
                onClick={(e) => handleAction(e, 'add')}
                disabled={product.isAvailable === false}
                className={cn(
                  "h-7 px-3 rounded-lg font-bold text-[10px] uppercase shadow-sm",
                  product.isAvailable === false ? "bg-neutral-100 text-neutral-400 border-neutral-200" : "bg-white text-[hsl(var(--user-accent))] border border-[hsl(var(--user-accent))] hover:bg-[hsl(var(--user-accent))] hover:text-white"
                )}
              >
                {product.isAvailable === false ? 'SOLD' : 'ADD'}
              </Button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-[hsl(var(--user-accent))] rounded-lg h-7 px-1 shadow-sm"
              >
                <button
                  onClick={(e) => handleAction(e, 'dec')}
                  className="w-5 h-5 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <span className="text-xs font-bold text-white min-w-[10px] text-center">
                  {inCartQty}
                </span>
                <button
                  onClick={(e) => handleAction(e, 'inc')}
                  className="w-5 h-5 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Section */}
      <div
        onClick={() => navigate(`/product/${((product as any).id || product._id)}`)}
        className="p-2.5 flex flex-col flex-1 cursor-pointer bg-white"
      >
        <span className="text-[10px] font-medium text-neutral-500 mb-0.5">
          {displayPack}
        </span>

        <h3 className="text-xs font-bold text-neutral-800 line-clamp-2 leading-tight mb-2 h-8 group-hover:text-[hsl(var(--user-accent))] transition-colors">
          {productName}
        </h3>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-neutral-900 leading-none">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {mrp > displayPrice && (
              <span className="text-[10px] text-neutral-400 line-through font-medium">
                ₹{mrp.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {showRating && (product.rating || (product as any).rating) > 0 && (
            <div className="flex items-center gap-0.5 bg-green-50 px-1 py-0.5 rounded border border-green-100">
              <Star size={10} className="fill-green-600 text-green-600" />
              <span className="text-[10px] font-bold text-green-700">{(product.rating || (product as any).rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;
