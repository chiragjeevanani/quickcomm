
import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Plus,
  Filter,
  ArrowUpRight, // For Credit
  ArrowDownLeft, // For Debit
  RefreshCw,
  Calendar,
  User
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// Services
import { getWalletTransactions, addFundTransfer } from '../../../services/api/admin/adminWalletService';
import { getDeliveryBoys, DeliveryBoy } from '../../../services/api/admin/adminDeliveryService';
import { useToast } from '../../../context/ToastContext';

// Types
import { WalletTransaction } from '../../../services/api/admin/adminWalletService';

export default function AdminFundTransfer() {
  const { showToast } = useToast();

  // Data State
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    deliveryBoyId: '',
    amount: '',
    type: 'Credit',
    message: ''
  });

  // Fetch Initial Data
  useEffect(() => {
    fetchDeliveryBoys();
    fetchTransactions();
  }, []);

  // Refresh transactions when filters change (debouncing search could be added)
  useEffect(() => {
    // Since getWalletTransactions supports basic filtering, we can use it or filter client side.
    // The service logic for getWalletTransactions supports type and userType.
    // For delivery boy specific filtering, we might need to filter client side if backend doesn't support generic 'userId' filter in that endpoint yet.
    // Checking adminWalletController: it supports 'type' and 'userType'. It has 'search' placeholder.
    // We will fetch all DeliveryBoy transactions and filter client side for now to be safe, 
    // or just fetch all and let DataTable paginate.
    fetchTransactions();
  }, [rowsPerPage, currentPage, selectedDeliveryBoy, selectedType]);
  // Note: server side filtering would be better but keeping it simple as per existing patterns

  const fetchDeliveryBoys = async () => {
    try {
      const response = await getDeliveryBoys({ status: 'Active' }); // Only active ones? Or all.
      if (response.success) {
        setDeliveryBoys(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch delivery boys', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch validation: userType="DELIVERY_BOY"
      const params: any = {
        userType: 'DELIVERY_BOY',
        limit: 1000 // Fetch larger set filters client side for now as requested by user specific mock
      };

      if (selectedType !== 'all') params.type = selectedType;

      const response = await getWalletTransactions(params);

      if (response.success) {
        setTransactions(response.data);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    showToast('Export functionality coming soon', 'info');
  };

  const handleFormSubmit = async () => {
    if (!formData.deliveryBoyId || !formData.amount || !formData.message) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await addFundTransfer({
        deliveryBoyId: formData.deliveryBoyId,
        amount: Number(formData.amount),
        type: formData.type as 'Credit' | 'Debit',
        message: formData.message
      });

      if (response.success) {
        showToast('Fund transfer successful', 'success');
        setIsAddModalOpen(false);
        setFormData({
          deliveryBoyId: '',
          amount: '',
          type: 'Credit',
          message: ''
        });
        fetchTransactions(); // Refresh list
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Transaction failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    // Search Term (ID, Message, Name)
    const matchSearch = searchTerm === '' ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()); // userName is populated in controller

    // Delivery Boy Filter (Client Side since controller might not sort by specific ID well yet)
    const matchBoy = selectedDeliveryBoy === 'all' || t.userId === selectedDeliveryBoy;

    // Type Filter (handled by API mostly, but also here for consistency)
    const matchType = selectedType === 'all' || t.type === selectedType;

    return matchSearch && matchBoy && matchType;
  });

  const columns = [
    {
      header: "Transaction ID",
      accessorKey: "reference",
      cell: (t: WalletTransaction) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-primary">{t.reference}</span>
          <span className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: "Delivery Partner",
      accessorKey: "userName",
      cell: (t: WalletTransaction) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {t.userName.substring(0, 1)}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{t.userName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ID: {String(t.userId).slice(-6)}</p>
          </div>
        </div>
      )
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (t: WalletTransaction) => (
        <Badge variant={t.type === 'Credit' ? 'default' : 'destructive'} className={
          t.type === 'Credit'
            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/25'
            : 'bg-rose-500/15 text-rose-600 border-rose-500/20 hover:bg-rose-500/25'
        }>
          {t.type === 'Credit' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownLeft className="h-3 w-3 mr-1" />}
          {t.type}
        </Badge>
      )
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (t: WalletTransaction) => (
        <span className={`font-bold ${t.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {t.type === 'Credit' ? '+' : '-'} ₹{t.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: "Message",
      accessorKey: "description",
      cell: (t: WalletTransaction) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={t.description}>
          {t.description}
        </span>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (t: WalletTransaction) => (
        <Badge variant="outline" className="text-[10px] bg-muted/50">
          {t.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Fund Transfer"
        description="Manage wallet balances for delivery partners via manual credit or debit transactions."
      >
        <Button variant="outline" size="sm" className="gap-2 font-bold uppercase tracking-tighter shadow-sm" onClick={fetchTransactions}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
        <Button size="sm" className="gap-2 font-bold uppercase tracking-tighter shadow-lg shadow-primary/20" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add Fund Transfer
        </Button>
      </PageHeader>

      <div className="border border-border bg-card rounded-xl shadow-sm">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, Name or Ref..."
                  className="pl-9 bg-muted/50 border-border focus-visible:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Delivery Boy Filter */}
              <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                <SelectTrigger className="w-full sm:w-48 bg-muted/50 border-border">
                  <SelectValue placeholder="All Partners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Delivery Boys</SelectItem>
                  {deliveryBoys.map((boy) => (
                    <SelectItem key={boy._id} value={boy._id}>
                      {boy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-32 bg-muted/50 border-border">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Credit">Credit (Add)</SelectItem>
                  <SelectItem value="Debit">Debit (Deduct)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="sm" className="gap-2 font-bold uppercase tracking-tighter text-muted-foreground" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredTransactions.slice((currentPage - 1) * parseInt(rowsPerPage), currentPage * parseInt(rowsPerPage))}
          loading={loading}
          emptyMessage="No fund transfers found."
        />

        <div className="flex items-center justify-between p-4 px-6">
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{filteredTransactions.length}</span> transactions
          </p>
          {/* Add simple pagination controls if needed, passing props to DataTable usually handles it or external */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Previous</span>
              &lt;
            </Button>
            <span className="text-sm font-medium px-2">{currentPage}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={filteredTransactions.length <= currentPage * parseInt(rowsPerPage)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Next</span>
              &gt;
            </Button>
          </div>
        </div>
      </div>

      {/* Add Fund Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Fund Transfer
            </DialogTitle>
            <DialogDescription>
              Manually add or deduct funds from a delivery partner's wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Delivery Boy Selection */}
            <div className="space-y-2">
              <Label htmlFor="delivery-boy" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Delivery Partner</Label>
              <Select
                value={formData.deliveryBoyId}
                onValueChange={(val: string) => setFormData({ ...formData, deliveryBoyId: val })}
              >
                <SelectTrigger id="delivery-boy" className="bg-muted/30 border-border">
                  <SelectValue placeholder="Select delivery boy..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {deliveryBoys.map((boy) => (
                    <SelectItem key={boy._id} value={boy._id}>
                      <div className="flex flex-col text-left">
                        <span className="font-bold">{boy.name}</span>
                        <span className="text-xs text-muted-foreground">Bal: ₹{boy.balance} | {boy.mobile}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction Type</Label>
              <RadioGroup
                defaultValue="Credit"
                value={formData.type}
                onValueChange={(val: string) => setFormData({ ...formData, type: val as 'Credit' | 'Debit' })}
                className="flex gap-4"
              >
                <div className={`flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer transition-all ${formData.type === 'Credit' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="Credit" id="r1" />
                  <Label htmlFor="r1" className="cursor-pointer font-bold flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Credit (Add)
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer transition-all ${formData.type === 'Debit' ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                  <RadioGroupItem value="Debit" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer font-bold flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-rose-500" /> Debit (Deduct)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-8 bg-muted/30 border-border"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note / Reference</Label>
              <Textarea
                id="message"
                placeholder="Enter reason for this transaction..."
                className="resize-none bg-muted/30 border-border"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting ? 'Processing...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

