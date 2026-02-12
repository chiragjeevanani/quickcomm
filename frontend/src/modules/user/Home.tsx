import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import HomeHero from "./components/HomeHero";
import PromoStrip from "./components/PromoStrip";
import LowestPricesEver from "./components/LowestPricesEver";
import CategoryTileSection from "./components/CategoryTileSection";
import FeaturedThisWeek from "./components/FeaturedThisWeek";
import ProductCard from "./components/ProductCard";
import HomeSkeleton from "./components/HomeSkeleton";
import { getHomeContent } from "../../services/api/customerHomeService";
import { getHeaderCategoriesPublic } from "../../services/api/headerCategoryService";
import { useLocation } from "../../hooks/useLocation";
import { useLoading } from "../../context/LoadingContext";
import { useThemeContext } from "../../context/ThemeContext";
import { cn } from "@/lib/utils";

// Animation variants for sections
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function Home() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { activeCategory, setActiveCategory } = useThemeContext();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const activeTab = activeCategory;
  const setActiveTab = setActiveCategory;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHandledRef = useRef(false);
  const SCROLL_POSITION_KEY = 'home-scroll-position';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>({
    bestsellers: [],
    categories: [],
    homeSections: [],
    shops: [],
    promoBanners: [],
    trending: [],
    lowestPrices: [],
  });

  const [products, setProducts] = useState<any[]>([]);

  const saveScrollPosition = () => {
    const mainElement = document.querySelector('main');
    const scrollPos = Math.max(
      mainElement ? mainElement.scrollTop : 0,
      window.scrollY || 0,
      document.documentElement.scrollTop || 0
    );
    if (scrollPos > 0) {
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPos.toString());
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        startRouteLoading();
        setLoading(true);
        setError(null);
        const response = await getHomeContent(
          undefined,
          location?.latitude,
          location?.longitude
        );
        if (response.success && response.data) {
          setHomeData(response.data);
          if (response.data.bestsellers) {
            setProducts(response.data.bestsellers);
          }
        } else {
          setError("Failed to load content. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch home content", error);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
        stopRouteLoading();
      }
    };

    fetchData();

    const preloadHeaderCategories = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const headerCategories = await getHeaderCategoriesPublic(true);
        const slugsToPreload = ['all', ...headerCategories.map(cat => cat.slug)];
        const batchSize = 2;
        for (let i = 0; i < slugsToPreload.length; i += batchSize) {
          const batch = slugsToPreload.slice(i, i + batchSize);
          await Promise.all(
            batch.map(slug =>
              getHomeContent(slug, location?.latitude, location?.longitude, true, 5 * 60 * 1000, true)
                .catch(err => console.debug(`Failed to preload data for ${slug}:`, err))
            )
          );
          if (i + batchSize < slugsToPreload.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.debug("Failed to preload header categories:", error);
      }
    };

    preloadHeaderCategories();
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    if (!loading && (homeData.shops || products.length)) {
      if (scrollHandledRef.current) return;
      scrollHandledRef.current = true;

      const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);
        const performScroll = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) mainElement.scrollTop = scrollY;
          window.scrollTo(0, scrollY);
        };
        requestAnimationFrame(() => {
          performScroll();
          requestAnimationFrame(() => {
            performScroll();
            setTimeout(performScroll, 100);
            setTimeout(performScroll, 300);
          });
        });
        setTimeout(() => sessionStorage.removeItem(SCROLL_POSITION_KEY), 1000);
      }
    }
  }, [loading, homeData.shops, products.length]);

  useEffect(() => {
    const handleNavigationEvent = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button') || target.closest('[role="button"]') || target.closest('.cursor-pointer')) {
        saveScrollPosition();
      }
    };
    window.addEventListener('click', handleNavigationEvent, { capture: true });
    window.addEventListener('touchstart', handleNavigationEvent, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleNavigationEvent, { capture: true });
      window.removeEventListener('touchstart', handleNavigationEvent, { capture: true });
    };
  }, []);

  const filteredProducts = useMemo(
    () => {
      if (activeTab === "all") return products;
      return products.filter(p => p.categoryId === activeTab || (p.category && (p.category._id === activeTab || p.category.slug === activeTab)));
    },
    [activeTab, products]
  );

  if (loading && !products.length) {
    return <HomeSkeleton />;
  }

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20 md:pb-0" ref={contentRef}>
      <HomeHero activeTab={activeTab} onTabChange={setActiveTab} />

      <PromoStrip activeTab={activeTab} />

      <LowestPricesEver activeTab={activeTab} products={homeData.lowestPrices} />

      <div className="bg-neutral-50 -mt-2 pt-1 pb-10 space-y-6 md:space-y-10">
        {activeTab !== "all" && (
          <div className="px-4 md:px-6 lg:px-8">
            <h2 className="text-lg md:text-2xl font-bold text-neutral-900 mb-4 md:mb-6 tracking-tight capitalize">
              {activeTab === "grocery" ? "Essential Grocery" : activeTab}
            </h2>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryStyle={true}
                    showBadge={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-400 bg-white rounded-2xl border border-dashed border-neutral-200">
                <p className="text-lg font-medium mb-1">No products found</p>
                <p className="text-sm">Try selecting a different category</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "all" && (
          <>
            <CategoryTileSection
              title="Bestsellers"
              tiles={
                homeData.bestsellers?.slice(0, 6).map((card: any) => ({
                  id: card.id,
                  categoryId: card.categoryId,
                  name: card.name || "Category",
                  productImages: card.productImages || [],
                  productCount: card.productCount || 0,
                })) || []
              }
              columns={3}
              showProductCount={true}
            />

            <FeaturedThisWeek />

            {homeData.homeSections?.map((section: any) => (
              <div key={section.id}>
                {section.displayType === "products" ? (
                  <div className="px-4 md:px-6 lg:px-8">
                    {section.title && (
                      <h2 className="text-lg md:text-2xl font-bold text-neutral-900 mb-4 md:mb-6 tracking-tight capitalize">
                        {section.title}
                      </h2>
                    )}
                    <div className={cn(
                      "grid gap-3 md:gap-4 lg:gap-6",
                      section.columns === 2 ? "grid-cols-2" :
                        section.columns === 3 ? "grid-cols-3" :
                          section.columns === 6 ? "grid-cols-3 md:grid-cols-6" :
                            "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                    )}>
                      {section.data?.map((product: any) => (
                        <ProductCard
                          key={product.id || product._id}
                          product={product}
                          categoryStyle={true}
                          showBadge={true}
                          compact={section.columns >= 4}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <CategoryTileSection
                    title={section.title}
                    tiles={section.data || []}
                    columns={section.columns}
                  />
                )}
              </div>
            ))}

            <div className="px-4 md:px-6 lg:px-8">
              <h2 className="text-lg md:text-2xl font-bold text-neutral-900 mb-4 md:mb-6 tracking-tight">
                Shop by Store
              </h2>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 lg:gap-6">
                {(homeData.shops || []).map((tile: any) => (
                  <div
                    key={tile.id}
                    className="group flex flex-col items-center"
                    onClick={() => {
                      saveScrollPosition();
                      navigate(`/store/${tile.slug || tile.id.replace("-store", "")}`);
                    }}
                  >
                    <div className="w-full aspect-square rounded-xl md:rounded-2xl bg-white shadow-sm border border-neutral-100 p-2 md:p-3 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center">
                      {tile.image || (tile.productImages?.length) ? (
                        <img
                          src={tile.image || tile.productImages[0]}
                          alt={tile.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-neutral-200 uppercase">
                          {tile.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="mt-2 text-[10px] md:text-xs font-semibold text-neutral-800 text-center line-clamp-2 px-1">
                      {tile.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
