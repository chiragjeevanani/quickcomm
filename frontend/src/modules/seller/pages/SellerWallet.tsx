import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CreditCard,
  PieChart,
  DollarSign,
  IndianRupee,
  Loader2,
  Banknote,
  Smartphone
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import {
  getSellerWalletBalance,
  getSellerWalletTransactions,
  requestSellerWithdrawal,
  getSellerWithdrawals,
  getSellerCommissions,
} from '../../../services/api/sellerWalletService';

import { fadeIn, slideUp, staggerContainer } from '../lib/animations';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SellerWallet() {
  const { showToast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal States
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI'>('Bank Transfer');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [balRes, transRes, withRes, commRes] = await Promise.all([
          getSellerWalletBalance(),
          getSellerWalletTransactions(),
          getSellerWithdrawals(),
          getSellerCommissions()
        ]);

        if (balRes.success) setBalance(balRes.data.balance);
        if (transRes.success) setTransactions(transRes.data.transactions || []);
        if (withRes.success) setWithdrawals(Array.isArray(withRes.data) ? withRes.data : []);
        if (commRes.success) setCommissions(commRes.data.commissions || []);
      } catch (err) {
        showToast('Error loading wallet data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (amount > balance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await requestSellerWithdrawal(amount, paymentMethod);
      if (res.success) {
        showToast('Withdrawal request submitted successfully', 'success');
        setIsWithdrawDialogOpen(false);
        setWithdrawAmount('');
        // Refresh balance and withdrawals
        const [balRes, withRes] = await Promise.all([
          getSellerWalletBalance(),
          getSellerWithdrawals()
        ]);
        if (balRes.success) setBalance(balRes.data.balance);
        if (withRes.success) setWithdrawals(Array.isArray(withRes.data) ? withRes.data : []);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit withdrawal request', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const transactionColumns = [
    { header: "ID", accessorKey: "id" },
    { header: "Reference", accessorKey: "reference" },
    {
      header: "Type",
      accessorKey: "type",
      cell: (t: any) => (
        <Badge variant="outline" className={t.type === 'credit' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-orange-500 bg-orange-500/10 border-orange-500/20'}>
          {t.type.toUpperCase()}
        </Badge>
      )
    },
    { header: "Amount", accessorKey: "amount", cell: (t: any) => <span className={`font-bold ${t.type === 'credit' ? 'text-emerald-500' : 'text-foreground'}`}>{t.type === 'credit' ? '+' : '-'}₹{t.amount}</span> },
    { header: "Date", accessorKey: "date" },
  ];

  const withdrawalColumns = [
    { header: "ID", accessorKey: "id" },
    { header: "Amount", accessorKey: "amount", cell: (w: any) => <span className="font-bold text-foreground">₹{w.amount}</span> },
    {
      header: "Status",
      accessorKey: "status",
      cell: (w: any) => (
        <Badge className={w.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}>
          {w.status}
        </Badge>
      )
    },
    { header: "Date", accessorKey: "date" },
  ];

  const commissionColumns = [
    { header: "Order ID", accessorKey: "orderId" },
    { header: "Commission", accessorKey: "amount", cell: (c: any) => <span className="font-bold">₹{c.amount}</span> },
    { header: "Date", accessorKey: "date" },
  ];

  const totalEarnings = commissions.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
  const pendingSettlements = withdrawals
    .filter((w: any) => w.status === 'Pending')
    .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-8">
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet & Earnings</h1>
          <p className="text-muted-foreground mt-1">Manage your funds and tracks withdrawals</p>
        </div>
        <Button
          onClick={() => setIsWithdrawDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 font-bold uppercase tracking-tighter"
        >
          <ArrowUpRight className="w-4 h-4" /> Withdraw Funds
        </Button>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <StatCard
          title="Current Balance"
          value={`₹${balance.toLocaleString()}`}
          icon={<Wallet className="w-5 h-5" />}
          delay={0.1}
        />
        <StatCard
          title="Total Earnings"
          value={`₹${totalEarnings.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 15, isUp: true }}
          delay={0.2}
        />
        <StatCard
          title="Pending Settlements"
          value={`₹${pendingSettlements.toLocaleString()}`}
          icon={<CreditCard className="w-5 h-5" />}
          delay={0.3}
        />
      </motion.div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="bg-muted/50 border border-border p-1 rounded-xl mb-6">
          <TabsTrigger value="transactions" className="gap-2 px-6 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <History className="w-4 h-4" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2 px-6 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <ArrowDownLeft className="w-4 h-4" /> Withdrawals
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-2 px-6 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <PieChart className="w-4 h-4" /> Commissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-0">
          <Card className="border-border bg-card shadow-sm">
            <DataTable columns={transactionColumns} data={transactions} loading={loading} />
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-0">
          <Card className="border-border bg-card shadow-sm">
            <DataTable columns={withdrawalColumns} data={withdrawals} loading={loading} />
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-0">
          <Card className="border-border bg-card shadow-sm">
            <DataTable columns={commissionColumns} data={commissions} loading={loading} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Withdraw Funds</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit a request to withdraw your earnings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground ml-1">
                  Amount to Withdraw (₹)
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <IndianRupee className="w-4 h-4 text-primary" />
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="pl-10 h-12 text-lg font-bold border-border bg-background text-foreground focus:ring-primary"
                    required
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter ml-1">
                  Available Balance: <span className="text-primary">₹{balance.toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method" className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground ml-1">
                  Payment Method
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: any) => setPaymentMethod(value)}
                >
                  <SelectTrigger id="method" className="h-12 border-border bg-background text-foreground font-bold">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="Bank Transfer" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-primary" />
                        <span>Bank Transfer</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="UPI" className="font-bold">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <span>UPI</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsWithdrawDialogOpen(false)}
                className="text-muted-foreground font-bold uppercase tracking-tighter"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px] font-bold uppercase tracking-tighter shadow-lg shadow-primary/20"
              >
                {withdrawing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Request Withdrawal'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
