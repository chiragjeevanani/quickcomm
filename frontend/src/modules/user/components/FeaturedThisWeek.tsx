import { useState, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../../services/api/customerProductService';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Zap, Cake, ShoppingBag } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FeaturedCard {
  id: string;
  type: 'newly-launched' | 'price-drop' | 'plum-cakes' | 'featured';
  title?: string;
  categoryId?: string;
  bgColor: string;
  textColor: string;
  icon: any;
}

const featuredCards: FeaturedCard[] = [
  {
    id: 'newly-launched',
    type: 'newly-launched',
    bgColor: 'bg-amber-50',
    textColor: 'text-orange-900',
    icon: Sparkles,
  },
  {
    id: 'price-drop',
    type: 'price-drop',
    title: 'OFFERS',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    icon: Zap,
  },
  {
    id: 'plum-cakes',
    type: 'plum-cakes',
    title: 'Cakes',
    bgColor: 'bg-rose-600',
    textColor: 'text-white',
    icon: Cake,
  },
  {
    id: 'fresh-arrivals',
    type: 'featured',
    title: 'Bags',
    categoryId: 'fruits-veg', // Using fruit-veg placeholder as before
    bgColor: 'bg-emerald-600',
    textColor: 'text-white',
    icon: ShoppingBag,
  },
];

const FeaturedThisWeek = memo(() => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [newlyLaunchedProducts, setNewlyLaunchedProducts] = useState<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts({ limit: 6 });
        if (res.success && res.data) {
          setNewlyLaunchedProducts(res.data);
        }
      } catch (e) {
        const fruitList = [
          { id: '1', name: 'Papaya', emoji: '🥭' },
          { id: '2', name: 'Apple', emoji: '🍎' },
          { id: '3', name: 'Banana', emoji: '🍌' },
        ];
        setNewlyLaunchedProducts(fruitList);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (newlyLaunchedProducts.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentProductIndex((prev) => (prev + 1) % newlyLaunchedProducts.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [newlyLaunchedProducts.length]);

  return (
    <div className="mb-8 md:mb-12">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-neutral-900 tracking-tight">
          Featured this week
        </h2>
      </div>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {/* Newly Launched Card */}
          <div className="flex-shrink-0 w-[120px] md:w-[150px]">
            <div className="h-44 md:h-56 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden relative shadow-sm">
              <div className="bg-orange-500 text-white text-[8px] md:text-[9px] font-bold uppercase py-1.5 text-center tracking-wider">
                New Arrivals
              </div>

              <div className="h-full pt-4 pb-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentProductIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {newlyLaunchedProducts[currentProductIndex]?.imageUrl ? (
                      <img
                        src={newlyLaunchedProducts[currentProductIndex].imageUrl}
                        alt=""
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-4xl md:text-5xl">
                        {newlyLaunchedProducts[currentProductIndex]?.emoji || '🍎'}
                      </span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {newlyLaunchedProducts.slice(0, 4).map((_, i) => (
                  <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === currentProductIndex ? "w-3 bg-orange-600" : "w-1 bg-orange-200")} />
                ))}
              </div>
            </div>
          </div>

          {/* Static Cards */}
          {featuredCards.slice(1).map((card) => (
            <Link
              key={card.id}
              to={card.categoryId ? `/category/${card.categoryId}` : '/offers'}
              className={cn(
                "flex-shrink-0 w-[120px] md:w-[150px] h-44 md:h-56 rounded-xl overflow-hidden relative shadow-sm border border-transparent hover:border-white/20 transition-all",
                card.bgColor
              )}
            >
              <div className="p-4 flex flex-col h-full">
                <card.icon size={20} className="text-white/40 mb-2" />
                <h3 className="text-white text-sm md:text-base font-bold leading-tight">
                  {card.title}
                </h3>
                <div className="mt-auto">
                  <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider">Tap to View</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
});

export default FeaturedThisWeek;
