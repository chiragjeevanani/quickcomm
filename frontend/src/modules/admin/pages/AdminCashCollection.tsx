import { useState, useEffect } from "react";
import {
  getCashCollections,
  createCashCollection,
  type CashCollection,
  type CreateCashCollectionData,
} from "../../../services/api/admin/adminDeliveryService";
import { getDeliveryBoys } from "../../../services/api/admin/adminDeliveryService";
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
  Plus,
  Banknote,
  Calendar,
  User,
  CreditCard,
  FilterX,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  History,
  IndianRupee,
  Clock,
  UserCheck,
  ArrowDownToLine
} from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AdminCashCollection() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [cashCollections, setCashCollections] = useState<CashCollection[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [boysResponse, cashResponse] = await Promise.all([
          getDeliveryBoys({ status: "Active", limit: 100 }),
          getCashCollections({
            page: currentPage,
            limit: parseInt(rowsPerPage),
            deliveryBoyId: selectedDeliveryBoy !== "all" ? selectedDeliveryBoy : undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            search: searchTerm || undefined,
          })
        ]);

        if (boysResponse.success) setDeliveryBoys(boysResponse.data);
        if (cashResponse.success) {
          setCashCollections(cashResponse.data);
          if (cashResponse.pagination) setTotalRecords(cashResponse.pagination.total);
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || "Audit sync failed", "error");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, searchTerm ? 500 : 0);
    return () => clearTimeout(timer);
  }, [isAuthenticated, token, currentPage, rowsPerPage, selectedDeliveryBoy, fromDate, toDate, searchTerm]);

  const handleExport = () => {
    const headers = ["ID", "Agent", "Order ID", "Total Billing", "Settled Amount", "Remarks", "Timestamp"];
    const csvContent = [
      headers.join(","),
      ...cashCollections.map(c => [
        c._id.slice(-6).toUpperCase(),
        `"${c.deliveryBoyName}"`,
        c.orderId,
        c.total.toFixed(2),
        c.amount.toFixed(2),
        `"${c.remark || ""}"`,
        `"${new Date(c.collectedAt).toLocaleString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `treasury_audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns = [
    {
      header: "Session / Agent",
      accessorKey: "deliveryBoyName",
      cell: (c: CashCollection) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-[10px] shadow-inner">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight text-xs">{c.deliveryBoyName}</span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">SID: {c._id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
      )
    },
    {
      header: "Order Intel",
      accessorKey: "orderId",
      cell: (c: CashCollection) => (
        <div className="flex flex-col">
          <Badge variant="outline" className="text-[10px] font-mono tracking-tighter w-fit bg-muted/20">
            #{c.orderId.slice(-8).toUpperCase()}
          </Badge>
          <span className="text-[9px] text-muted-foreground mt-1 font-medium flex items-center gap-1">
            <ShoppingBag className="h-2.5 w-2.5" /> Order Fulfillment
          </span>
        </div>
      )
    },
    {
      header: "Financial Audit",
      accessorKey: "amount",
      cell: (c: CashCollection) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 font-black text-foreground text-xs text-emerald-600">
            <IndianRupee className="h-3 w-3" /> {c.amount.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">
            Total Billing: ₹{c.total.toFixed(2)}
          </div>
        </div>
      )
    },
    {
      header: "Registry Metadata",
      accessorKey: "collectedAt",
      cell: (c: CashCollection) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] text-foreground font-bold">
            <Clock className="h-3 w-3 text-muted-foreground" /> {new Date(c.collectedAt).toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-0.5">
            <Calendar className="h-3 w-3" /> {new Date(c.collectedAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      header: "Ledger Remarks",
      accessorKey: "remark",
      cell: (c: CashCollection) => (
        <p className="text-[10px] text-muted-foreground italic max-w-[150px] truncate leading-relaxed">
          {c.remark || "No administrative notes identified."}
        </p>
      )
    }
  ];

  const totalPages = Math.ceil(totalRecords / parseInt(rowsPerPage));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treasury & Cash Collections"
        description="Audit real-time cash inflows from final-mile delivery agents."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 shadow-sm font-bold uppercase tracking-tight h-10 px-4" onClick={handleExport}>
            <ArrowDownToLine className="h-4 w-4" /> Audit Export
          </Button>
          <Button className="gap-2 font-black uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20" onClick={() => showToast("Functionality coming soon", "info")}>
            <Plus className="h-4 w-4" /> Recieve Cash
          </Button>
        </div>
      </PageHeader>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="bg-muted/10 border-b border-border pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Period Start</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-9 h-11 bg-card border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Period End</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-9 h-11 bg-card border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Agent Identity</Label>
              <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                <SelectTrigger className="h-11 bg-card border-border text-xs">
                  <SelectValue placeholder="Select delivery boy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global (All Agents)</SelectItem>
                  {deliveryBoys.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Payment Channel</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="h-11 bg-card border-border text-xs">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="Cash">Cash Currency</SelectItem>
                  <SelectItem value="Card">Terminal / Card</SelectItem>
                  <SelectItem value="Online">Digital / UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by agent name, order ID..."
                className="pl-9 h-10 bg-muted/20 border-border shadow-inner"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={rowsPerPage} onValueChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-24 h-10 bg-muted/20 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Rows</SelectItem>
                  <SelectItem value="25">25 Rows</SelectItem>
                  <SelectItem value="50">50 Rows</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || fromDate || toDate || selectedDeliveryBoy !== "all" || selectedMethod !== "all") && (
                <Button variant="ghost" size="sm" className="h-10 text-muted-foreground hover:text-foreground" onClick={() => {
                  setSearchTerm(""); setFromDate(""); setToDate(""); setSelectedDeliveryBoy("all"); setSelectedMethod("all");
                }}>
                  <FilterX className="h-4 w-4 mr-2" /> Reset
                </Button>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={cashCollections}
            loading={loading}
            emptyMessage="No cash collection events identified in this audit cycle."
          />

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                Treasury Node: {totalRecords} EVENTS SYNCED
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-9 min-w-[36px] px-3 flex items-center justify-center bg-primary text-white font-black text-xs rounded-lg shadow-md">
                {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages || loading}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 py-8 opacity-20 pointer-events-none grayscale">
        <History className="h-8 w-8 text-primary" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] leading-none">QuickCommerce Treasury Audit</span>
          <span className="text-[8px] font-bold uppercase tracking-widest mt-1">Immutable Ledger • Node v7.2</span>
        </div>
      </div>
    </div>
  );
}
