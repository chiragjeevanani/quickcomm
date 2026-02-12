import { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '../../../services/api/customerProductService';

import { getTheme } from '../../../utils/themes';
import { useCart } from '../../../context/CartContext';
import { Product } from '@/types/domain';
import { useWishlist } from '../../../hooks/useWishlist';
import { calculateProductPrice } from '../../../utils/priceUtils';
import { cn } from "@/lib/utils";

interface LowestPricesEverProps {
  activeTab?: string;
  products?: Product[];
}

const ProductCard = memo(({
  product,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity
}: {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product, element?: HTMLElement | null) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}) => {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist(product.id);
  const { displayPrice, mrp, discount, hasDiscount } = calculateProductPrice(product);
  const inCartQty = cartQuantity;

  const productName = product.name || product.productName || '';

  return (
    <div className="flex-shrink-0 w-[140px] md:w-[160px]" style={{ scrollSnapAlign: 'start' }}>
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="group bg-white rounded-xl overflow-hidden flex flex-col relative h-full shadow-sm hover:shadow-md transition-all duration-300 border border-neutral-100"
      >
        <div className="relative aspect-square p-2 bg-white">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-300 text-2xl font-bold">
              {productName.charAt(0).toUpperCase()}
            </div>
          )}

          {discount > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              {discount}% OFF
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(e);
            }}
            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isWishlisted ? "#ef4444" : "none"}
              className={isWishlisted ? "text-red-500" : "text-neutral-400"}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-2.5 flex flex-col flex-1 bg-white">
          <span className="text-[10px] text-neutral-500 font-medium mb-0.5">{product.pack || '1 unit'}</span>
          <h3 className="text-xs font-bold text-neutral-800 line-clamp-2 leading-tight mb-2 h-8">
            {productName}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-1">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-900 leading-none">₹{displayPrice}</span>
              {hasDiscount && <span className="text-[10px] text-neutral-400 line-through font-medium">₹{mrp}</span>}
            </div>

            <div className="flex-shrink-0">
              <AnimatePresence mode="wait">
                {inCartQty === 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product, e.currentTarget);
                    }}
                    className="h-7 px-3 bg-white text-[hsl(var(--user-accent))] border border-[hsl(var(--user-accent))] rounded-lg text-[10px] font-bold hover:bg-[hsl(var(--user-accent))] hover:text-white transition-all shadow-sm"
                  >
                    ADD
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[hsl(var(--user-accent))] text-white h-7 px-1.5 rounded-lg">
                    <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, inCartQty - 1); }} className="w-4 h-4 flex items-center justify-center font-bold text-xs">-</button>
                    <span className="text-xs font-bold min-w-[10px] text-center">{inCartQty}</span>
                    <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, inCartQty + 1); }} className="w-4 h-4 flex items-center justify-center font-bold text-xs">+</button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function LowestPricesEver({ activeTab = 'all', products: adminProducts }: LowestPricesEverProps) {
  const theme = getTheme(activeTab);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { cart, addToCart, updateQuantity } = useCart();
  const [loading, setLoading] = useState(!adminProducts?.length);
  const [products, setProducts] = useState<Product[]>([]);

  const cartItemsMap = useMemo(() => {
    const map = new Map();
    cart.items.forEach(item => {
      if (item?.product) map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cart.items]);

  useEffect(() => {
    if (adminProducts && adminProducts.length > 0) {
      setProducts(adminProducts.map(p => ({
        ...p,
        id: p._id || p.id,
        imageUrl: p.mainImage || p.imageUrl,
        mrp: p.mrp || p.price,
      })));
      setLoading(false);
    } else {
      const fetchDiscountedProducts = async () => {
        try {
          const response = await getProducts({ limit: 12 });
          if (response.success && response.data) {
            setProducts(response.data.map((p: any) => ({
              ...p,
              id: p._id || p.id,
              imageUrl: p.mainImage || p.imageUrl,
              mrp: p.mrp || p.price,
            })));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchDiscountedProducts();
    }
  }, [adminProducts]);

  const handleAddToCart = useCallback((product: Product, element?: HTMLElement | null) => {
    addToCart(product, element);
  }, [addToCart]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  }, [updateQuantity]);

  return (
    <div className="bg-white px-4 md:px-6 lg:px-8 py-6 md:py-8 border-b border-neutral-100">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-neutral-900 tracking-tight">
          Lowest Prices Ever
        </h2>
        <button className="text-[hsl(var(--user-accent))] text-xs md:text-sm font-bold hover:underline">
          View All
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] md:w-[160px] h-[220px] bg-neutral-50 animate-pulse rounded-xl" />
          ))
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={cartItemsMap.get(product.id) || 0}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
            />
          ))
        )}
      </div>
    </div>
  );
}
