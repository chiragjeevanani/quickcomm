import { useState, useEffect } from "react";
import {
  Search,
  Download,
  UserCheck,
  UserMinus,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Mail,
  Phone
} from "lucide-react";
import {
  getAllCustomers,
  type Customer,
} from "../../../services/api/admin/adminCustomerService";
import { useAuth } from "../../../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminManageCustomer() {
  const { isAuthenticated, token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page: currentPage,
          limit: parseInt(entriesPerPage),
        };

        if (statusFilter !== "all") params.status = statusFilter;
        if (searchQuery) params.search = searchQuery;

        const response = await getAllCustomers(params);
        if (response.success) {
          setCustomers(response.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load customers.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [isAuthenticated, token, currentPage, entriesPerPage, statusFilter, searchQuery]);

  const columns = [
    {
      header: "Customer",
      accessorKey: "name",
      cell: (c: Customer) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {c.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-none">{c.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">ID: {c._id.slice(-6)}</span>
          </div>
        </div>
      )
    },
    {
      header: "Contact Info",
      accessorKey: "email",
      cell: (c: Customer) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground group">
            <Mail className="h-3 w-3" />
            <span className="text-xs group-hover:text-foreground transition-colors">{c.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground group">
            <Phone className="h-3 w-3" />
            <span className="text-xs group-hover:text-foreground transition-colors">{c.phone}</span>
          </div>
        </div>
      )
    },
    {
      header: "Registration",
      accessorKey: "registrationDate",
      cell: (c: Customer) => c.registrationDate ? new Date(c.registrationDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : "-"
    },
    {
      header: "Activity",
      accessorKey: "totalOrders",
      cell: (c: Customer) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{c.totalOrders} Orders</span>
          <span className="text-xs text-muted-foreground font-medium">Spent: ₹{c.totalSpent.toLocaleString()}</span>
        </div>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (c: Customer) => (
        <Badge className={c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}>
          {c.status}
        </Badge>
      )
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (c: Customer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl bg-card border-border">
            <DropdownMenuItem className="gap-2 py-2.5 cursor-pointer">
              <Eye className="h-4 w-4 text-muted-foreground" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 py-2.5 cursor-pointer">
              <TrendingUp className="h-4 w-4 text-muted-foreground" /> Order History
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            {c.status === 'Active' ? (
              <DropdownMenuItem className="gap-2 py-2.5 text-rose-500 cursor-pointer focus:text-rose-500 focus:bg-rose-50">
                <UserMinus className="h-4 w-4" /> Deactive Account
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="gap-2 py-2.5 text-emerald-500 cursor-pointer focus:text-emerald-500 focus:bg-emerald-50">
                <UserCheck className="h-4 w-4" /> Activate Account
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Monitor user activities, manage accounts and view detailed stats."
      >
        <Button variant="outline" size="sm" className="gap-2 font-bold uppercase tracking-tighter">
          <Download className="h-4 w-4" /> Export Data
        </Button>
      </PageHeader>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  className="pl-9 bg-muted/50 border-border focus-visible:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="Active">Active Users</SelectItem>
                  <SelectItem value="Inactive">Blocked Users</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                <SelectTrigger className="w-full sm:w-24 bg-muted/50 border-border">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            emptyMessage="No customers found matching your criteria."
          />

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground font-medium">
              Showing <span className="text-foreground font-bold">{customers.length}</span> active customers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center h-8 min-w-[32px] px-2 rounded-md bg-primary text-primary-foreground text-xs font-bold">
                {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={customers.length < parseInt(entriesPerPage) || loading}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
