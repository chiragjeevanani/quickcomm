import { useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Mic, ChevronDown, Home, Star, MapPin } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getTheme } from '@/utils/themes';
import { useLocation } from '@/hooks/useLocation';
import { appConfig } from '@/services/configService';
import { getCategories } from '@/services/api/customerProductService';
import { Category } from '@/types/domain';
import { getHeaderCategoriesPublic } from '@/services/api/headerCategoryService';
import { getIconByName } from '@/utils/iconLibrary';

gsap.registerPlugin(ScrollTrigger);

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const ALL_TAB: Tab = {
  id: 'all',
  label: 'All',
  icon: <Home size={20} />,
};

export default function HomeHero({ activeTab = 'all', onTabChange }: HomeHeroProps) {
  const [tabs, setTabs] = useState<Tab[]>([ALL_TAB]);

  useEffect(() => {
    const fetchHeaderCategories = async () => {
      try {
        const cats = await getHeaderCategoriesPublic();
        if (cats && cats.length > 0) {
          const mapped = cats.map(c => ({
            id: c.slug,
            label: c.name,
            icon: getIconByName(c.iconName)
          }));
          setTabs([ALL_TAB, ...mapped]);
        }
      } catch (error) {
        console.error('Failed to fetch header categories', error);
      }
    };
    fetchHeaderCategories();
  }, []);
  const navigate = useNavigate();
  const { location: userLocation } = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [, setIsSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Format location display text - only show if user has provided location
  const locationDisplayText = useMemo(() => {
    if (userLocation?.address) {
      // Use the full address if available
      return userLocation.address;
    }
    // Fallback to city, state format if available
    if (userLocation?.city && userLocation?.state) {
      return `${userLocation.city}, ${userLocation.state}`;
    }
    // Fallback to city only
    if (userLocation?.city) {
      return userLocation.city;
    }
    // No default - return empty string if no location provided
    return '';
  }, [userLocation]);

  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for search suggestions
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data.map((c: any) => ({
            ...c,
            id: c._id || c.id
          })));
        }
      } catch (error) {
        console.error("Error fetching categories for suggestions:", error);
      }
    };
    fetchCategories();
  }, []);

  // Search suggestions based on active tab or fetched categories
  const searchSuggestions = useMemo(() => {
    if (activeTab === 'all' && categories.length > 0) {
      // Use real category names for 'all' tab suggestions
      return categories.slice(0, 8).map(c => c.name.toLowerCase());
    }

    switch (activeTab) {
      case 'wedding':
        return ['gift packs', 'dry fruits', 'sweets', 'decorative items', 'wedding cards', 'return gifts'];
      case 'winter':
        return ['woolen clothes', 'caps', 'gloves', 'blankets', 'heater', 'winter wear'];
      case 'electronics':
        return ['chargers', 'cables', 'power banks', 'earphones', 'phone cases', 'screen guards'];
      case 'beauty':
        return ['lipstick', 'makeup', 'skincare', 'kajal', 'face wash', 'moisturizer'];
      case 'grocery':
        return ['atta', 'milk', 'dal', 'rice', 'oil', 'vegetables'];
      case 'fashion':
        return ['clothing', 'shoes', 'accessories', 'watches', 'bags', 'jewelry'];
      case 'sports':
        return ['cricket bat', 'football', 'badminton', 'fitness equipment', 'sports shoes', 'gym wear'];
      default: // 'all'
        return ['atta', 'milk', 'dal', 'coke', 'bread', 'eggs', 'rice', 'oil'];
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        hero,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        }
      );
    }, hero);

    return () => ctx.revert();
  }, []);

  // Animate search suggestions
  useEffect(() => {
    setCurrentSearchIndex(0);
    const interval = setInterval(() => {
      setCurrentSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [searchSuggestions.length, activeTab]);

  // Handle scroll to detect when "LOWEST PRICES EVER" section is out of view
  useEffect(() => {
    const handleScroll = () => {
      if (topSectionRef.current && stickyRef.current) {
        // Find the "LOWEST PRICES EVER" section
        const lowestPricesSection = document.querySelector('[data-section="lowest-prices"]');

        if (lowestPricesSection) {
          const sectionBottom = lowestPricesSection.getBoundingClientRect().bottom;
          // When the section has scrolled up past the viewport, transition to white
          const progress = Math.min(Math.max(1 - (sectionBottom / 200), 0), 1);
          setScrollProgress(progress);
          setIsSticky(sectionBottom <= 100);
        } else {
          // Fallback to original logic if section not found
          const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
          const topSectionHeight = topSectionRef.current.offsetHeight;
          const progress = Math.min(Math.max(1 - (topSectionBottom / topSectionHeight), 0), 1);
          setScrollProgress(progress);
          setIsSticky(topSectionBottom <= 0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding indicator position when activeTab changes and scroll to active tab
  useEffect(() => {
    const updateIndicator = (shouldScroll = true) => {
      const activeTabButton = tabRefs.current.get(activeTab);
      const container = tabsContainerRef.current;

      if (activeTabButton && container) {
        try {
          // Use offsetLeft for position relative to container (not affected by scroll)
          // This ensures the indicator stays aligned even when container scrolls
          const left = activeTabButton.offsetLeft;
          const width = activeTabButton.offsetWidth;

          // Ensure valid values
          if (width > 0) {
            setIndicatorStyle({ left, width });
          }

          // Scroll the container to bring the active tab into view (only when tab changes)
          if (shouldScroll) {
            const containerScrollLeft = container.scrollLeft;
            const containerWidth = container.offsetWidth;
            const buttonLeft = left;
            const buttonWidth = width;
            const buttonRight = buttonLeft + buttonWidth;

            // Calculate scroll position to center the button or keep it visible
            const scrollPadding = 20; // Padding from edges
            let targetScrollLeft = containerScrollLeft;

            // If button is on the left side and partially or fully hidden
            if (buttonLeft < containerScrollLeft + scrollPadding) {
              targetScrollLeft = buttonLeft - scrollPadding;
            }
            // If button is on the right side and partially or fully hidden
            else if (buttonRight > containerScrollLeft + containerWidth - scrollPadding) {
              targetScrollLeft = buttonRight - containerWidth + scrollPadding;
            }

            // Smooth scroll to the target position
            if (targetScrollLeft !== containerScrollLeft) {
              container.scrollTo({
                left: Math.max(0, targetScrollLeft),
                behavior: 'smooth'
              });
            }
          }
        } catch (error) {
          console.warn('Error updating indicator:', error);
        }
      }
    };

    // Update immediately with scroll
    updateIndicator(true);

    // Also update after delays to handle any layout shifts and ensure smooth animation
    const timeout1 = setTimeout(() => updateIndicator(true), 50);
    const timeout2 = setTimeout(() => updateIndicator(true), 150);
    const timeout3 = setTimeout(() => updateIndicator(false), 300); // Last update without scroll to avoid conflicts

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [activeTab, tabs]);

  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
    // Don't scroll - keep page at current position
  };

  const theme = getTheme(activeTab || 'all');
  const heroGradient = `linear-gradient(to bottom right, ${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;

  // Helper to convert RGB to RGBA
  const rgbToRgba = (rgb: string, alpha: number) => {
    return rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  };

  return (
    <div
      ref={heroRef}
      className="relative overflow-hidden"
      style={{
        background: heroGradient,
        paddingBottom: 0,
        marginBottom: 0,
      }}
    >
      {/* Decorative background elements for premium feel */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none" />

      {/* Top section with delivery info - VERY COMPACT */}
      <div className="relative z-10">
        <div ref={topSectionRef} className="px-4 md:px-6 lg:px-8 pt-2 pb-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <h1 className="text-neutral-900 font-black text-xl md:text-2xl tracking-tight leading-none">
                  {appConfig.estimatedDeliveryTime}
                </h1>
                <span className="text-neutral-900 font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-60">
                  Dhakad Snazzy
                </span>
              </div>

              <div
                className="flex items-start gap-1 cursor-pointer group/loc"
                title={locationDisplayText}
              >
                <MapPin size={12} className="text-neutral-900 mt-0.5 flex-shrink-0 opacity-80" />
                <span className="text-neutral-900 text-[11px] md:text-xs font-semibold leading-snug break-words">
                  {locationDisplayText || 'Select Location'}
                </span>
                <ChevronDown size={14} className="text-neutral-900 mt-0.5 flex-shrink-0 transition-transform group-hover/loc:translate-y-0.5 opacity-60" />
              </div>
            </div>

            <button className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all active:scale-90 shadow-sm">
              <Star size={16} className="text-neutral-800" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky section: Search Bar and Category Tabs */}
      <div
        ref={stickyRef}
        className="sticky top-0 z-50 transition-all duration-500 ease-in-out"
        style={{
          background: scrollProgress > 0.1
            ? `rgba(255, 255, 255, ${Math.min(scrollProgress * 1.2, 1)})`
            : 'transparent',
          backdropFilter: scrollProgress > 0.1 ? `blur(${scrollProgress * 20}px)` : 'none',
          boxShadow: scrollProgress > 0.5 ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
          borderBottom: scrollProgress > 0.8 ? '1px solid rgba(0,0,0,0.05)' : 'none',
        }}
      >
        <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
          {/* Search Bar - Glassmorphism feel */}
          <div
            onClick={() => navigate('/search')}
            className={cn(
              "w-full md:w-auto md:max-w-xl md:mx-auto rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-300 group",
              scrollProgress > 0.1
                ? "bg-neutral-100/80 border border-neutral-200/50"
                : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            )}
          >
            <div className="p-1 rounded-lg bg-neutral-100 group-hover:bg-white transition-colors">
              <Search size={20} className="text-neutral-500 group-hover:text-neutral-900 transition-colors" />
            </div>
            <div className="flex-1 relative h-5 overflow-hidden">
              {searchSuggestions.map((suggestion, index) => {
                const isActive = index === currentSearchIndex;
                const prevIndex = (currentSearchIndex - 1 + searchSuggestions.length) % searchSuggestions.length;
                const isPrev = index === prevIndex;

                return (
                  <div
                    key={suggestion}
                    className={cn(
                      "absolute inset-0 flex items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                      isActive ? "translate-y-0 opacity-100" : isPrev ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"
                    )}
                  >
                    <span className="text-sm font-medium text-neutral-500">
                      Search <span className="text-neutral-400 font-normal">"{suggestion}"</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <Mic size={20} className="text-neutral-400 hover:text-neutral-900 transition-colors" />
          </div>
        </div>

        {/* Category Tabs Section */}
        <div className="relative">
          <div
            ref={tabsContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8 pb-3 md:justify-center scroll-smooth no-scrollbar relative"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  ref={(el) => { if (el) tabRefs.current.set(tab.id, el); }}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 relative z-10",
                    isActive
                      ? "text-neutral-900"
                      : scrollProgress > 0.5 ? "text-neutral-500 hover:text-neutral-900" : "text-neutral-800 hover:text-neutral-900"
                  )}
                  type="button"
                >
                  <span className={cn(
                    "transition-transform duration-300",
                    isActive ? "scale-105" : "scale-100"
                  )}>
                    {tab.icon}
                  </span>
                  <span className={cn(
                    "text-[10px] md:text-xs whitespace-nowrap transition-all duration-300",
                    isActive ? "font-bold" : "font-medium"
                  )}>
                    {tab.label}
                  </span>
                </button>
              )
            })}

            {/* Selector bar now inside the scrollable container to stay 'fixed' under category */}
            {indicatorStyle.width > 0 && (
              <div
                className="absolute bottom-0 h-1 bg-neutral-900 rounded-full transition-all duration-200 ease-out pointer-events-none z-20"
                style={{
                  left: `${indicatorStyle.left + (indicatorStyle.width * 0.1)}px`,
                  width: `${indicatorStyle.width * 0.8}px`,
                }}
              />
            )}
          </div>

          {/* Subtle bottom border for sticky state */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-px bg-neutral-200/50 transition-opacity duration-300",
            scrollProgress > 0.5 ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </div>
    </div>
  );
}

