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
  PackageCheck
} from "lucide-react";
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

interface SellerSidebarProps {
  onClose?: () => void;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/seller", icon: LayoutDashboard },
  { label: "Orders", path: "/seller/orders", icon: ShoppingBag },
  { label: "Category", path: "/seller/category", icon: Layers },
  { label: "SubCategory", path: "/seller/subcategory", icon: Boxes },
  {
    label: "Product",
    path: "/seller/product",
    icon: Boxes,
    hasSubmenu: true,
    submenuItems: [
      { label: "Add new Product", path: "/seller/product/add", icon: PlusCircle },
      { label: "Taxes", path: "/seller/product/taxes", icon: Percent },
      { label: "Product List", path: "/seller/product/list", icon: List },
      { label: "Stock Management", path: "/seller/product/stock", icon: PackageCheck },
    ],
  },
  { label: "Wallet", path: "/seller/wallet", icon: Wallet },
  {
    label: "Reports",
    path: "/seller/reports",
    icon: BarChart3,
    hasSubmenu: true,
    submenuItems: [
      { label: "Sales Report", path: "/seller/reports/sales", icon: BarChart3 },
    ],
  },
  { label: "Return", path: "/seller/return", icon: RotateCcw },
];

export default function SellerSidebar({ onClose }: SellerSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const isActive = (path: string) => {
    if (path === "/seller") {
      return location.pathname === "/seller" || location.pathname === "/seller/";
    }
    return location.pathname.startsWith(path);
  };

  const isSubmenuActive = (submenuItems?: SubMenuItem[]) => {
    if (!submenuItems) return false;
    return submenuItems.some(
      (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
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
    return expandedMenus.has(path) || isSubmenuActive(menuItems.find((item) => item.path === path)?.submenuItems);
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Link to="/seller" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingBag className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">Seller Panel</span>
        </Link>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground lg:hidden">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const expanded = isExpanded(item.path);
            const active = isActive(item.path) || isSubmenuActive(item.submenuItems);
            const Icon = item.icon;

            return (
              <div key={item.path}>
                {(index === 4 || index === 6) && <Separator className="my-4 opacity-50 bg-border" />}
                <button
                  onClick={() => {
                    if (item.hasSubmenu) toggleMenu(item.path);
                    else handleNavigation(item.path);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-colors ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                  {item.hasSubmenu && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""} ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  )}
                </button>

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
                        return (subActive ? (
                          <li key={subItem.path}>
                            <button
                              onClick={() => handleNavigation(subItem.path)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all text-foreground font-bold bg-primary/20 border-l-2 border-primary"
                            >
                              <SubIcon className="w-4 h-4 text-primary" />
                              <span className="text-[13px]">{subItem.label}</span>
                            </button>
                          </li>
                        ) : (
                          <li key={subItem.path}>
                            <button
                              onClick={() => handleNavigation(subItem.path)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                              <SubIcon className="w-4 h-4" />
                              <span className="text-[13px]">{subItem.label}</span>
                            </button>
                          </li>
                        )
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">Store Name</p>
            <p className="text-xs text-muted-foreground truncate">seller@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
