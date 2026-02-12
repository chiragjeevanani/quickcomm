import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import SellerHeader from './SellerHeader';
import { getSellerProfile, toggleShopStatus } from '@/services/api/auth/sellerAuthService';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SellerLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await getSellerProfile();
      if (response.success) {
        setIsShopOpen(response.data.isShopOpen ?? true);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleShop = async () => {
    try {
      const response = await toggleShopStatus();
      if (response.success) {
        setIsShopOpen(response.data.isShopOpen);
        showToast(`Shop is now ${response.data.isShopOpen ? 'Open' : 'Closed'}`, 'success');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error toggling shop status', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans antialiased text-foreground">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block h-full border-r border-border">
        <SellerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 z-50"
            >
              <SellerSidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <SellerHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isShopOpen={isShopOpen}
          onToggleShop={handleToggleShop}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/20 dark:bg-background/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto w-full"
          >
            {children || <Outlet context={{ isShopOpen }} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
