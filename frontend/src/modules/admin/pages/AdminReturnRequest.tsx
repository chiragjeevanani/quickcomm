import { useState, useEffect } from "react";
import {
  getReturnRequests,
  updateReturnRequest,
  type MiscReturnRequest as ReturnRequest,
} from "../../../services/api/admin/adminMiscService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  User,
  Package,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Clock,
  Check,
  X
} from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AdminReturnRequest() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch return requests on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchReturnRequests = async () => {
      try {
        setLoading(true);

        const params: any = {
          page: currentPage,
          limit: parseInt(rowsPerPage),
        };

        if (selectedStatus !== "all") {
          params.status = selectedStatus;
        }

        if (searchTerm) {
          params.search = searchTerm;
        }

        const response = await getReturnRequests(params);

        if (response.success) {
          setReturnRequests(response.data);
        } else {
          showToast("Failed to load return requests", "error");
        }
      } catch (err: any) {
        console.error("Error fetching return requests:", err);
        showToast(err.response?.data?.message || "Failed to load return requests", "error");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchReturnRequests();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [isAuthenticated, token, currentPage, rowsPerPage, selectedStatus, searchTerm]);

  const handleApproveReturn = async (requestId: string) => {
    try {
      setUpdating(requestId);
      const response = await updateReturnRequest(requestId, {
        status: "Approved",
      });

      if (response.success) {
        setReturnRequests((requests) =>
          requests.map((req) =>
            req._id === requestId ? { ...req, status: "Approved" } : req
          )
        );
        showToast("Return request approved successfully!", "success");
      } else {
        showToast(response.message || "Failed to approve return request", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to approve return request", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleRejectReturn = async (requestId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      setUpdating(requestId);
      const response = await updateReturnRequest(requestId, {
        status: "Rejected",
        adminNotes: reason,
      });

      if (response.success) {
        setReturnRequests((requests) =>
          requests.map((req) =>
            req._id === requestId ? { ...req, status: "Rejected", adminNotes: reason } : req
          )
        );
        showToast("Return request rejected successfully!", "success");
      } else {
        showToast(response.message || "Failed to reject return request", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to reject return request", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleExport = () => {
    showToast("Export functionality will be implemented soon.", "info");
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedStatus("all");
    setSearchTerm("");
  };

  const columns = [
    {
      header: "Request ID / User",
      accessorKey: "orderItemId",
      cell: (r: ReturnRequest) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="font-mono text-[10px] w-fit border-primary/20 bg-primary/5 text-primary">
            #{r.orderItemId?.slice(-8) || r._id.slice(-8)}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <User className="h-3 w-3 text-muted-foreground" /> {r.userName}
          </div>
        </div>
      )
    },
    {
      header: "Product Details",
      accessorKey: "productName",
      cell: (r: ReturnRequest) => (
        <div className="flex flex-col gap-1 max-w-[200px]">
          <span className="font-bold text-foreground text-xs leading-tight truncate">{r.productName}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Variant: {r.variant || "Standard"}</span>
        </div>
      )
    },
    {
      header: "Financials",
      accessorKey: "total",
      cell: (r: ReturnRequest) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">₹{r.total.toFixed(2)}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Qty: {r.quantity} × ₹{r.price}</span>
        </div>
      )
    },
    {
      header: "Status / Date",
      accessorKey: "status",
      cell: (r: ReturnRequest) => (
        <div className="flex flex-col gap-1.5">
          <Badge className={
            r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
              r.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                r.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                  'bg-blue-500/10 text-blue-600 border-blue-500/20'
          }>
            {r.status}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
            <Clock className="h-2.5 w-2.5" /> {new Date(r.requestedAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (r: ReturnRequest) => (
        <div className="flex items-center gap-2">
          {r.status === "Pending" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleApproveReturn(r._id)}
                disabled={!!updating}
                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRejectReturn(r._id)}
                disabled={!!updating}
                className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                title="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter opacity-50 font-bold border-muted">PROCESSED</Badge>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Return & Refund Requests"
        description="Review and process product return requests from customers."
      >
        <Button variant="outline" size="sm" className="gap-2 shadow-sm font-bold uppercase tracking-tight" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </PageHeader>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 text-white bg-emerald-600 rounded-t-lg">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5" /> Incoming Requests
          </CardTitle>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30 font-bold uppercase tracking-tighter text-[10px]">
            Live Requests
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end justify-between mb-8">
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Date Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-[140px] h-9 text-xs bg-muted/50 border-border"
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-[140px] h-9 text-xs bg-muted/50 border-border"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[160px] h-9 text-xs bg-muted/50 border-border">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Every Status</SelectItem>
                    <SelectItem value="Pending">Only Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(fromDate || toDate || selectedStatus !== "all") && (
                <Button variant="ghost" size="sm" className="h-9 gap-2 text-muted-foreground mt-auto" onClick={handleClearFilters}>
                  <FilterX className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search order ID, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/50 border-border shadow-inner"
                />
              </div>
              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-20 h-9 bg-muted/50 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={returnRequests}
            loading={loading}
            emptyMessage="No return requests discovered."
          />

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <MessageSquare className="h-4 w-4" />
              Displaying <span className="text-foreground font-bold">{returnRequests.length}</span> requests
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="h-8 shadow-sm border-border"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="flex items-center justify-center h-8 min-w-[32px] px-3 rounded-md bg-muted font-bold text-xs">
                {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={returnRequests.length < parseInt(rowsPerPage) || loading}
                className="h-8 shadow-sm border-border"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
