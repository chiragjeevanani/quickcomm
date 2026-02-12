import { Bell, Menu, Search, User, LogOut, Settings, Moon, Sun } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useThemeContext } from "@/context/ThemeContext";

interface SellerHeaderProps {
  onOpenSidebar?: () => void;
  isShopOpen: boolean;
  onToggleShop: () => void;
}

export default function SellerHeader({ onOpenSidebar, isShopOpen, onToggleShop }: SellerHeaderProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { showToast } = useToast();
  const { mode, toggleMode } = useThemeContext();
  const [isToggling, setIsToggling] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/seller/login");
    showToast("Logged out successfully", "success");
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleShop();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="lg:hidden text-muted-foreground hover:bg-accent">
          <Menu className="w-6 h-6" />
        </Button>
        <div className="hidden md:flex items-center bg-muted/50 border border-border rounded-lg px-3 py-1.5 gap-2 w-64 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dashboard..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isShopOpen ? 'text-teal-600' : 'text-muted-foreground'}`}>
            {isShopOpen ? 'Shop Open' : 'Shop Closed'}
          </span>
          <Switch
            checked={isShopOpen}
            onCheckedChange={handleToggle}
            disabled={isToggling}
            className="data-[state=checked]:bg-teal-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            className="text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
            title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {mode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-accent hover:text-teal-600">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-border overflow-hidden hover:bg-accent">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-teal-50 text-teal-700 font-bold dark:bg-teal-900 dark:text-teal-200">
                    {user?.name?.substring(0, 2).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 rounded-xl bg-card border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-foreground">{user?.name || 'Seller Name'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || 'seller@example.com'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => navigate("/seller/account")} className="cursor-pointer gap-2 py-2.5 hover:bg-accent text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/seller/settings")} className="cursor-pointer gap-2 py-2.5 hover:bg-accent text-foreground">
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
