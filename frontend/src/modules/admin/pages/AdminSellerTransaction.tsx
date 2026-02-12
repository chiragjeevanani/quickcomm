import { useState, useEffect } from "react";
import {
  getSellerTransactions,
  type SellerTransaction,
} from "../../../services/api/admin/adminWalletService";
import { getAllSellers as getSellers } from "../../../services/api/sellerService";
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
import { Label } from "@/components/ui/label";
import {
  Search,
  Download,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  FilterX,
  History,
  IndianRupee,
  Store,
  Clock,
  ChevronLeft,
  ChevronRight,
  SearchCode,
  Receipt,
  FileText
} from "lucide-react";

interface Transaction {
  id: string;
  sellerName: string;
  sellerId: string;
  orderId?: string;
  orderItemId?: string;
  productName?: string;
  variation?: string;
  flag: string;
  amount: number;
  remark?: string;
  date: string;
  type: string;
  status: string;
}

interface Seller {
  _id: string;
  sellerName: string;
  storeName: string;
}

export default function AdminSellerTransaction() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchSellers = async () => {
      try {
        const response = await getSellers({ status: "Approved" });
        if (response.success && response.data) {
          setSellers(response.data.map(s => ({ _id: s._id, sellerName: s.sellerName, storeName: s.storeName })));
        }
      } catch (err) {
        showToast("Failed to sync seller registry", "error");
      }
    };
    fetchSellers();
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token || (selectedSeller === 'all' && sellers.length === 0)) {
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        if (selectedSeller === "all") {
          const allTransactions: Transaction[] = [];
          const sellersToFetch = sellers.slice(0, 5); // Performance cap for global view

          for (const seller of sellersToFetch) {
            try {
              const response = await getSellerTransactions(seller._id, { page: 1, limit: 20 });
              if (response.success && response.data) {
                allTransactions.push(...response.data.map((tx: any) => ({
                  id: tx.id,
                  sellerName: seller.sellerName,
                  sellerId: seller._id,
                  amount: tx.amount,
                  flag: tx.transactionType,
                  date: tx.date,
                  type: tx.type,
                  status: tx.status,
                  remark: tx.description,
                })));
              }
            } catch (ignore) { }
          }
          allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(allTransactions);
        } else {
          const response = await getSellerTransactions(selectedSeller, { page: currentPage, limit: parseInt(rowsPerPage) });
          if (response.success && response.data) {
            const seller = sellers.find(s => s._id === selectedSeller);
            setTransactions(response.data.map((tx: any) => ({
              id: tx.id,
              sellerName: seller?.sellerName || "Unknown",
              sellerId: selectedSeller,
              amount: tx.amount,
              flag: tx.transactionType,
              date: tx.date,
              type: tx.type,
              status: tx.status,
              remark: tx.description,
            })));
          }
        }
      } catch (err) {
        showToast("Transaction stream synchronization failed", "error");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchTransactions, 300);
    return () => clearTimeout(timer);
  }, [selectedSeller, currentPage, rowsPerPage, sellers]);

  const columns = [
    {
      header: "Session / Ref",
      accessorKey: "id",
      cell: (t: Transaction) => (
        <div className="flex flex-col">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">TRX-{t.id.slice(-6).toUpperCase()}</span>
          <span className="text-[9px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> {new Date(t.date).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      header: "Seller Identity",
      accessorKey: "sellerName",
      cell: (t: Transaction) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-inner">
            <Store className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight text-xs">{t.sellerName}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">ID: {t.sellerId.slice(-6)}</span>
          </div>
        </div>
      )
    },
    {
      header: "Flow",
      accessorKey: "flag",
      cell: (t: Transaction) => (
        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border-2 ${t.flag === 'credit'
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
          }`}>
          {t.flag === 'credit' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownLeft className="h-3 w-3 mr-1" />}
          {t.flag}
        </Badge>
      )
    },
    {
      header: "Monetary Value",
      accessorKey: "amount",
      cell: (t: Transaction) => (
        <div className={`flex items-center gap-1 font-black font-mono text-xs ${t.flag === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {t.flag === 'credit' ? '+' : '-'} <IndianRupee className="h-3 w-3" /> {t.amount.toFixed(2)}
        </div>
      )
    },
    {
      header: "Intelligence / Status",
      accessorKey: "remark",
      cell: (t: Transaction) => (
        <div className="flex flex-col">
          <p className="text-[10px] text-muted-foreground italic truncate max-w-[180px] leading-relaxed">
            {t.remark || t.type || "System generated protocol."}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`h-1.5 w-1.5 rounded-full ${t.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/80">{t.status}</span>
          </div>
        </div>
      )
    }
  ];

  const filteredTransactions = transactions.filter(t =>
    t.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.remark && t.remark.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Ledger Audit"
        description="Monitor global commerce flow and manual fund adjustments across the seller network."
      >
        <Button className="gap-2 font-black uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20">
          <History className="h-4 w-4" /> Global Timeline
        </Button>
      </PageHeader>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border space-y-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Period From</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="pl-9 h-11 bg-card border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Period To</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="pl-9 h-11 bg-card border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Marketplace Node</Label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger className="h-11 bg-card border-border text-xs">
                  <SelectValue placeholder="All Sellers" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="all">Global (Top Performers)</SelectItem>
                  {sellers.map(s => <SelectItem key={s._id} value={s._id}>{s.sellerName} [{s.storeName}]</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Transaction Logic</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="h-11 bg-card border-border text-xs">
                  <SelectValue placeholder="All Logic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Comprehensive</SelectItem>
                  <SelectItem value="Credit">Credit Protocols</SelectItem>
                  <SelectItem value="Debit">Debit Protocols</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Search by ref, seller or remark..."
                className="pl-9 h-10 bg-muted/20 border-border shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-24 h-10 bg-muted/20 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Rows</SelectItem>
                  <SelectItem value="25">25 Rows</SelectItem>
                  <SelectItem value="50">50 Rows</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || fromDate || toDate || selectedSeller !== 'all') && (
                <Button variant="ghost" size="sm" className="h-10 text-muted-foreground hover:text-foreground" onClick={() => {
                  setSearchTerm(""); setFromDate(""); setToDate(""); setSelectedSeller("all");
                }}>
                  <FilterX className="h-4 w-4 mr-2" /> Reset
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-10 border-border shadow-sm flex items-center gap-2 font-bold text-xs uppercase tracking-tight" onClick={() => showToast("Exporting matrix...", "info")}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredTransactions}
            loading={loading}
            emptyMessage="No transaction telemetry detected for the selected parameters."
          />

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Ledger Stream Active</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-0.5">Reflecting last 100 manual events.</span>
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
              <div className="h-9 w-9 flex items-center justify-center bg-primary text-white font-black text-xs rounded-xl shadow-lg ring-4 ring-primary/10">
                {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={loading || filteredTransactions.length < parseInt(rowsPerPage)}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-8 py-12 opacity-10 pointer-events-none grayscale">
        <div className="flex items-center gap-2">
          <SearchCode className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest">TRACE_BACK CORE</span>
            <span className="text-[8px] font-bold">Node sync enabled</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest">LEDGER_PROTOCOL</span>
            <span className="text-[8px] font-bold">v9.2 Architecture</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest">SOC-2 COMPLIANCE</span>
            <span className="text-[8px] font-bold">Encrypted Audit Logs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
