import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Boxes,
  Wallet,
  BarChart3,
  RotateCcw,
  ChevronDown,
  X,
  PlusCircle,
  Percent,
  List,
  PackageCheck,
  Tag,
  User,
  Users,
  Bell,
  HelpCircle,
  Truck,
  MapPin,
  Settings,
  CreditCard,
  MessageSquare,
  History,
  CheckCircle2,
  Clock,
  ClipboardList,
  Flag,
  Home,
  Star,
  Zap,
  ShoppingBasket,
  Smartphone,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SubMenuItem {
  label: string;
  path: string;
  icon: any;
}

interface MenuItem {
  label: string;
  path: string;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
  icon: any;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface AdminSidebarProps {
  onClose?: () => void;
}

const menuSections: MenuSection[] = [
  {
    title: "Product Section",
    items: [
      {
        label: "Category",
        path: "/admin/category",
        hasSubmenu: true,
        icon: Layers,
        submenuItems: [
          { label: "Category", path: "/admin/category", icon: Layers },
          { label: "Header Category", path: "/admin/category/header", icon: ClipboardList },
        ],
      },
      { label: "Brand", path: "/admin/brand", icon: Tag },
      {
        label: "Product",
        path: "/admin/product",
        hasSubmenu: true,
        icon: Boxes,
        submenuItems: [
          { label: "Product List", path: "/admin/product/list", icon: List },
          { label: "Taxes", path: "/admin/product/taxes", icon: Percent },
        ],
      },
      {
        label: "Manage Seller",
        path: "/admin/manage-seller",
        hasSubmenu: true,
        icon: Users,
        submenuItems: [
          { label: "Manage Seller List", path: "/admin/manage-seller/list", icon: List },
          { label: "Seller Transaction", path: "/admin/manage-seller/transaction", icon: History },
        ],
      },
    ],
  },
  {
    title: "Delivery Section",
    items: [
      {
        label: "Manage Location",
        path: "/admin/manage-location",
        hasSubmenu: true,
        icon: MapPin,
        submenuItems: [
          { label: "Seller Location", path: "/admin/manage-location/seller-location", icon: MapPin },
        ],
      },
      { label: "Coupon", path: "/admin/coupon", icon: Tag },
      {
        label: "Delivery Boy",
        path: "/admin/delivery-boy",
        hasSubmenu: true,
        icon: Truck,
        submenuItems: [
          { label: "Manage Delivery Boy", path: "/admin/delivery-boy/manage", icon: List },
          { label: "Fund Transfer", path: "/admin/delivery-boy/fund-transfer", icon: CreditCard },
          { label: "Cash Collection", path: "/admin/delivery-boy/cash-collection", icon: Wallet },
        ],
      },
    ],
  },
  {
    title: "Miscellaneous",
    items: [
      { label: "Users", path: "/admin/users", icon: User },
      { label: "Notification", path: "/admin/notification", icon: Bell },
      { label: "FAQ", path: "/admin/faq", icon: HelpCircle },
    ],
  },
  {
    title: "Order Section",
    items: [
      {
        label: "Order List",
        path: "/admin/orders",
        hasSubmenu: true,
        icon: ShoppingBag,
        submenuItems: [
          { label: "All Order", path: "/admin/orders/all", icon: List },
          { label: "Pending Order", path: "/admin/orders/pending", icon: Clock },
          { label: "Received Order", path: "/admin/orders/received", icon: CheckCircle2 },
          { label: "Processed Order", path: "/admin/orders/processed", icon: PackageCheck },
          { label: "Shipped Order", path: "/admin/orders/shipped", icon: Truck },
          { label: "Out For Delivery", path: "/admin/orders/out-for-delivery", icon: MapPin },
          { label: "Delivered Order", path: "/admin/orders/delivered", icon: CheckCircle2 },
          { label: "Cancelled Order", path: "/admin/orders/cancelled", icon: X },
          { label: "Return", path: "/admin/return", icon: RotateCcw },
        ],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Wallet & Earnings", path: "/admin/wallet", icon: Wallet },
    ],
  },
  {
    title: "Promotion",
    items: [
      { label: "Home Section", path: "/admin/home-section", icon: Home },
      { label: "Bestseller Cards", path: "/admin/bestseller-cards", icon: Star },
      { label: "Promo Strip", path: "/admin/promo-strip", icon: Zap },
      { label: "Lowest Prices", path: "/admin/lowest-prices", icon: Tag },
      { label: "Shop by Store", path: "/admin/shop-by-store", icon: ShoppingBasket },
    ],
  },
  {
    title: "Setting",
    items: [
      { label: "Billing & Charges", path: "/admin/billing-settings", icon: CreditCard },
      { label: "Payment List", path: "/admin/payment-list", icon: List },
      { label: "SMS Gateway", path: "/admin/sms-gateway", icon: MessageSquare },
      { label: "System User", path: "/admin/system-user", icon: UserPlus },
      { label: "Customer App Policy", path: "/admin/customer-app-policy", icon: ShieldCheck },
      { label: "Delivery App Policy", path: "/admin/delivery-app-policy", icon: ShieldCheck },
    ],
  },
];

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  const isSubmenuActive = (submenuItems?: SubMenuItem[]) => {
    if (!submenuItems) return false;
    return submenuItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/")
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose && window.innerWidth < 1024) onClose();
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };

  const isExpanded = (path: string) => {
    const sectionItem = menuSections
      .flatMap((s) => s.items)
      .find((i) => i.path === path);
    return expandedMenus.has(path) || (sectionItem?.submenuItems && isSubmenuActive(sectionItem.submenuItems));
  };

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">Admin Panel</span>
        </Link>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground lg:hidden">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Menu..."
            className="w-full px-3 py-2 pl-9 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
          <LayoutDashboard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-1">
          <button
            onClick={() => handleNavigation("/admin")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive("/admin")
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
          >
            <LayoutDashboard className={`w-5 h-5 transition-colors ${isActive("/admin") ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span className="text-sm font-semibold">Dashboard</span>
          </button>

          {filteredSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="pt-4">
              <h3 className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const expanded = isExpanded(item.path);
                  const active = isActive(item.path) || isSubmenuActive(item.submenuItems);
                  const Icon = item.icon;

                  return (
                    <div key={item.path}>
                      <div
                        className={cn(
                          "flex items-center justify-between w-full rounded-lg transition-all duration-200 group overflow-hidden",
                          active
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <button
                          onClick={() => handleNavigation(item.path)}
                          className="flex items-center gap-3 px-3 py-2.5 flex-1 text-left"
                        >
                          <Icon className={`w-5 h-5 transition-colors ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                          <span className="text-sm font-semibold">{item.label}</span>
                        </button>

                        {item.hasSubmenu && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent navigation if this button is clicked
                              toggleMenu(item.path);
                            }}
                            className={cn(
                              "px-3 py-2.5 hover:bg-primary/10 transition-colors",
                              active ? "text-primary-foreground" : "text-muted-foreground"
                            )}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""} ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
                            />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {item.hasSubmenu && item.submenuItems && expanded && (
                          <motion.ul
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-1 space-y-1 ml-4 overflow-hidden border-l border-primary/20 pl-4"
                          >
                            {item.submenuItems.map((subItem) => {
                              const subActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + "/");
                              const SubIcon = subItem.icon;
                              return (
                                <li key={subItem.path}>
                                  <button
                                    onClick={() => handleNavigation(subItem.path)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all ${subActive
                                      ? "text-foreground font-bold bg-primary/20 border-l-2 border-primary"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent font-medium"
                                      }`}
                                  >
                                    <SubIcon className={`w-4 h-4 ${subActive ? "text-primary" : ""}`} />
                                    <span className="text-[13px]">{subItem.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@vcommerce.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
