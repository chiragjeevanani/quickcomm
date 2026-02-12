import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Wallet
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useThemeContext } from "@/context/ThemeContext";
import dhakadSnazzyLogo from "@assets/dhakadsnazzy1.png";

interface AdminHeaderProps {
  onOpenSidebar?: () => void;
  isSidebarOpen: boolean;
}

export default function AdminHeader({ onOpenSidebar, isSidebarOpen }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { showToast } = useToast();
  const { mode, toggleMode } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
    showToast("Logged out successfully", "success");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSidebar}
          className="lg:hidden text-muted-foreground hover:bg-accent"
        >
          <Menu className="w-6 h-6" />
        </Button>

        <button
          onClick={() => navigate("/admin")}
          className="hover:opacity-80 transition-opacity hidden sm:block"
        >
          <img
            src={dhakadSnazzyLogo}
            alt="Dhakad Snazzy"
            className="h-8 w-auto object-contain"
          />
        </button>

        <div className="hidden lg:flex items-center gap-1 ml-4 bg-muted/30 p-1 rounded-lg border border-border">
          <Button
            variant={isActive("/admin/orders") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/admin/orders")}
            className="gap-2 text-xs font-bold uppercase tracking-tighter"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Orders
          </Button>
          <Button
            variant={isActive("/admin/customers") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/admin/customers")}
            className="gap-2 text-xs font-bold uppercase tracking-tighter"
          >
            <Users className="w-3.5 h-3.5" />
            Customers
          </Button>
          <Button
            variant={isActive("/admin/collect-cash") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/admin/collect-cash")}
            className="gap-2 text-xs font-bold uppercase tracking-tighter"
          >
            <Wallet className="w-3.5 h-3.5" />
            Collect Cash
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center bg-muted/50 border border-border rounded-lg px-3 py-1.5 gap-2 w-48 lg:w-64 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            className="text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
          >
            {mode === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-accent">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-border overflow-hidden hover:bg-accent">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.name?.substring(0, 2).toUpperCase() || "AD"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 rounded-xl bg-card border-border" align="end">
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-foreground">{user?.name || "Admin User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin@vcommerce.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => navigate("/admin/profile")} className="cursor-pointer gap-2 py-2.5 hover:bg-accent text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/admin/settings")} className="cursor-pointer gap-2 py-2.5 hover:bg-accent text-foreground">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer gap-2 py-2.5 hover:bg-red-50 dark:hover:bg-red-950">
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
