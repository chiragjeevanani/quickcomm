import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, ArrowLeft, TrendingUp,
  ChefHat, ChevronRight, Bookmark, X, Star,
  Package, Clock, Sparkles
} from 'lucide-react';
import ProductCard from './components/ProductCard';
import { getProducts } from '../../services/api/customerProductService';
import { getHomeContent } from '../../services/api/customerHomeService';
import { Product } from '../../types/domain';
import { useLocation } from '../../hooks/useLocation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location } = useLocation();
  const searchQuery = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [cookingIdeas, setCookingIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);

  // Fetch products based on search query
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const params: any = { search: searchQuery };
        // Include user location for seller service radius filtering
        if (location?.latitude && location?.longitude) {
          params.latitude = location.latitude;
          params.longitude = location.longitude;
        }
        const response = await getProducts(params);
        setSearchResults(response.data as unknown as Product[]);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, location]);

  // Fetch trending/home content for initial view
  useEffect(() => {
    const fetchInitialContent = async () => {
      try {
        const response = await getHomeContent(
          undefined,
          location?.latitude,
          location?.longitude
        );
        if (response.success && response.data) {
          setTrendingItems(response.data.trending || []);
          setCookingIdeas(response.data.cookingIdeas || []);
        }
      } catch (error) {
        console.error("Error fetching search initial content", error);
      } finally {
        setContentLoading(false);
      }
    };

    if (!searchQuery.trim()) {
      fetchInitialContent();
    }
  }, [searchQuery, location?.latitude, location?.longitude]);

  return (
    <div className="min-h-screen bg-neutral-50/30 pb-24">
      {/* Dynamic Header */}
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
          <div className="flex-1 relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-green-600 transition-colors" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => navigate(`/search?q=${e.target.value}`)}
              placeholder="Search for groceries, snacks..."
              className="w-full h-12 pl-12 pr-4 bg-neutral-50 border-none rounded-2xl font-bold text-sm focus-visible:ring-2 focus-visible:ring-green-500/10 placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">
                Results {searchResults.length > 0 && `(${searchResults.length})`}
              </h2>
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Filter</Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square rounded-[2rem]" />
                    <div className="space-y-2 px-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-1/2 mt-4" />
                      <Skeleton className="h-10 w-full rounded-xl mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {searchResults.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      layout
                    >
                      <ProductCard
                        product={product}
                        categoryStyle={true}
                        showBadge={true}
                        showPackBadge={false}
                        showStockInfo={true}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-100 flex items-center justify-center text-neutral-300 mb-8">
                  <SearchIcon size={40} />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter mb-2">No results found</h2>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8">Try searching for something else</p>
              </div>
            )}
          </div>
        )}

        {/* Initial View */}
        {!searchQuery.trim() && (
          <div className="space-y-12">
            {/* Trending Section */}
            {contentLoading ? (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="p-4 rounded-[2rem] border-neutral-100 bg-white">
                      <Skeleton className="aspect-square rounded-2xl mb-4" />
                      <Skeleton className="h-3 w-2/3 mx-auto" />
                    </Card>
                  ))}
                </div>
              </section>
            ) : trendingItems.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <TrendingUp size={20} />
                  </div>
                  <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">Trending in your city</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {trendingItems.map((item) => (
                    <motion.div
                      key={item.id || item._id}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        className="p-4 rounded-[2rem] border-neutral-100 bg-white cursor-pointer hover:shadow-xl hover:shadow-neutral-200/50 transition-all text-center group"
                        onClick={() => navigate(item.type === 'category' ? `/category/${item.id || item._id}` : `/product/${item.id || item._id}`)}
                      >
                        <div className="aspect-square rounded-2xl bg-neutral-50 mb-4 overflow-hidden flex items-center justify-center p-3">
                          {item.image || item.imageUrl ? (
                            <img src={item.image || item.imageUrl} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="text-2xl">🔥</span>
                          )}
                        </div>
                        <h3 className="text-[10px] font-black text-neutral-900 uppercase tracking-tight line-clamp-2">
                          {item.name || item.title}
                        </h3>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Categories */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">Kitchen Hacks</h2>
                </div>
                <Button variant="ghost" onClick={() => navigate('/category/all')} className="text-[10px] font-black uppercase tracking-widest text-neutral-400">View All</Button>
              </div>

              {!contentLoading && cookingIdeas.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {cookingIdeas.map((idea, idx) => (
                    <motion.div
                      key={idea.id || idea._id || idx}
                      className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] bg-neutral-100 cursor-pointer group"
                      onClick={() => navigate(`/product/${idea.productId || idea.id}`)}
                      whileHover={{ scale: 1.02 }}
                    >
                      {idea.image && (
                        <img
                          src={idea.image}
                          alt={idea.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <Badge className="bg-white/20 backdrop-blur-md border-white/10 text-white text-[8px] font-black uppercase tracking-widest mb-2">Recipe</Badge>
                        <h3 className="text-white text-sm font-black uppercase tracking-tight leading-tight line-clamp-2">{idea.title}</h3>
                      </div>
                      <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-neutral-900 transition-all">
                        <Bookmark size={18} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
