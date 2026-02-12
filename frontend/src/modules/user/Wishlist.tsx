import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, ShoppingCart, Trash2,
  Package, ShoppingBag, Star, ChevronRight
} from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../../services/api/customerWishlistService';
import { Product } from '../../types/domain';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../hooks/useLocation';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { calculateProductPrice } from '../../utils/priceUtils';
import { cn } from '@/lib/utils';

export default function Wishlist() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlist({
        latitude: location?.latitude,
        longitude: location?.longitude
      });
      if (res.success && res.data) {
        setProducts(res.data.products.map(p => ({
          ...p,
          id: p._id || (p as any).id,
          name: p.productName || (p as any).name,
          imageUrl: p.mainImageUrl || p.mainImage || (p as any).imageUrl,
          price: (p as any).price || (p as any).variations?.[0]?.price || 0,
          pack: (p as any).pack || (p as any).variations?.[0]?.name || 'Standard'
        })) as any);
      }
    } catch (error: any) {
      console.error('Failed to fetch wishlist:', error);
      showToast(error.message || 'Failed to fetch wishlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [location?.latitude, location?.longitude]);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      setProducts(products.filter(p => (p.id !== productId && p._id !== productId)));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/30 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-neutral-100"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">My Wishlist</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-[2rem]" />
                <div className="space-y-2 px-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-1/2 mt-4" />
                  <Skeleton className="h-12 w-full rounded-2xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="rounded-[2rem] border-neutral-100 overflow-hidden bg-white hover:shadow-xl hover:shadow-neutral-200/50 transition-all group">
                    <div className="relative aspect-square bg-neutral-50 p-6 flex items-center justify-center">
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center text-red-500 shadow-sm hover:bg-white hover:scale-110 transition-all"
                      >
                        <Heart size={20} fill="currentColor" />
                      </button>

                      <Link to={`/product/${product.id}`} className="w-full h-full flex items-center justify-center">
                        {product.imageUrl || product.mainImage ? (
                          <img
                            src={product.imageUrl || product.mainImage}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <Package size={48} className="text-neutral-200" />
                        )}
                      </Link>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{product.pack}</p>
                        <h3 className="text-sm font-black text-neutral-900 line-clamp-2 uppercase tracking-tight h-10">{product.name}</h3>
                      </div>

                      <div className="flex flex-col gap-4 mt-auto">
                        {(() => {
                          const { displayPrice, mrp, hasDiscount } = calculateProductPrice(product);
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-neutral-900 tracking-tighter">₹{displayPrice}</span>
                              {hasDiscount && (
                                <span className="text-xs font-bold text-neutral-400 line-through">₹{mrp}</span>
                              )}
                            </div>
                          );
                        })()}

                        <Button
                          onClick={() => addToCart(product)}
                          className="w-full h-12 rounded-2xl bg-neutral-900 hover:bg-green-600 text-white font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          <ShoppingBag size={14} className="mr-2" />
                          To Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-100 flex items-center justify-center text-neutral-300 mb-8">
              <Heart size={40} />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter mb-2">Wishlist is empty</h2>
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8">Save items you love to find them later</p>
            <Button
              onClick={() => navigate('/')}
              className="h-16 px-12 rounded-3xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200"
            >
              Discover Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
