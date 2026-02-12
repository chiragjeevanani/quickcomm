import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    CreditCard,
    Clock,
    IndianRupee,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    History,
    AlertCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import {
    getFinancialDashboard,
    getWalletTransactions,
    getAdminEarnings,
    WalletStats,
    WalletTransaction,
    AdminEarning
} from '../../../services/api/admin/adminWalletService';
import AdminWithdrawals from './AdminWithdrawals';
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import DataTable from "../components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fadeIn, staggerContainer } from "../lib/animations";

export default function AdminWallet() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('transactions');
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Transactions State
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [trxLoading, setTrxLoading] = useState(false);
    const [trxFilter, setTrxFilter] = useState({ userType: 'all', type: 'all' });

    // Earnings State
    const [earnings, setEarnings] = useState<AdminEarning[]>([]);
    const [earnLoading, setEarnLoading] = useState(false);
    const [earnPage, setEarnPage] = useState(1);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'transactions') {
            fetchTransactions();
        } else if (activeTab === 'earnings') {
            fetchEarnings();
        }
    }, [activeTab, trxFilter]);

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const response = await getFinancialDashboard();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchTransactions = async () => {
        setTrxLoading(true);
        try {
            const response = await getWalletTransactions({
                userType: trxFilter.userType === 'all' ? undefined : trxFilter.userType,
                type: trxFilter.type === 'all' ? undefined : trxFilter.type
            });
            if (response.success && response.data) {
                setTransactions(response.data);
            }
        } catch (error: any) {
            showToast('Failed to load transactions', 'error');
        } finally {
            setTrxLoading(false);
        }
    };

    const fetchEarnings = async () => {
        setEarnLoading(true);
        try {
            const response = await getAdminEarnings({ page: earnPage });
            if (response.success && response.data) {
                setEarnings(response.data);
            }
        } catch (error: any) {
            showToast('Failed to load earnings', 'error');
        } finally {
            setEarnLoading(false);
        }
    };

    const trxColumns = [
        {
            header: "Date",
            accessorKey: "createdAt",
            cell: (t: WalletTransaction) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{new Date(t.createdAt).toLocaleTimeString()}</span>
                </div>
            )
        },
        {
            header: "User",
            accessorKey: "userName",
            cell: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{t.userName || 'N/A'}</span>
                    <Badge variant="outline" className="w-fit text-[10px] h-4 mt-0.5 border-primary/20 bg-primary/5 text-primary">
                        {t.userType?.replace('_', ' ')}
                    </Badge>
                </div>
            )
        },
        {
            header: "Description",
            accessorKey: "description",
            cell: (t: WalletTransaction) => <span className="text-muted-foreground text-xs line-clamp-1">{t.description}</span>
        },
        {
            header: "Amount",
            accessorKey: "amount",
            cell: (t: WalletTransaction) => (
                <div className={`flex items-center gap-1 font-bold ${t.type === 'Credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {t.type === 'Credit' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>₹{t.amount.toLocaleString()}</span>
                </div>
            )
        }
    ];

    const earnColumns = [
        {
            header: "Date",
            accessorKey: "date",
            cell: (e: AdminEarning) => new Date(e.date).toLocaleDateString()
        },
        {
            header: "Source",
            accessorKey: "source",
            cell: (e: AdminEarning) => <span className="font-bold text-foreground">{e.source}</span>
        },
        {
            header: "Description",
            accessorKey: "description",
            cell: (e: AdminEarning) => <span className="text-muted-foreground text-xs">{e.description}</span>
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (e: AdminEarning) => (
                <Badge className={e.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}>
                    {e.status}
                </Badge>
            )
        },
        {
            header: "Commission",
            accessorKey: "amount",
            cell: (e: AdminEarning) => <span className="font-bold text-foreground">₹{e.amount.toLocaleString()}</span>
        }
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                title="Financial Management"
                description="Track platform earnings, process payouts, and monitor transaction history."
            >
                <Button variant="outline" size="sm" className="gap-2 font-bold uppercase tracking-tighter shadow-sm">
                    <Download className="h-4 w-4" /> Reports
                </Button>
            </PageHeader>

            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
            >
                <StatCard
                    title="Platform Revenue"
                    value={`₹${stats?.totalGMV?.toLocaleString() || '0'}`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    delay={0.1}
                />
                <StatCard
                    title="Platform Balance"
                    value={`₹${stats?.currentAccountBalance?.toLocaleString() || '0'}`}
                    icon={<Wallet className="h-5 w-5" />}
                    delay={0.2}
                />
                <StatCard
                    title="Admin Net Earning"
                    value={`₹${stats?.totalAdminEarnings?.toLocaleString() || '0'}`}
                    icon={<IndianRupee className="h-5 w-5" />}
                    delay={0.3}
                />
                <StatCard
                    title="Seller Payouts"
                    value={`₹${stats?.sellerPendingPayouts?.toLocaleString() || '0'}`}
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                    delay={0.4}
                    trend={{ value: 12, isUp: false }}
                />
                <StatCard
                    title="Delivery Payouts"
                    value={`₹${stats?.deliveryPendingPayouts?.toLocaleString() || '0'}`}
                    icon={<Clock className="h-5 w-5 text-rose-500" />}
                    delay={0.5}
                />
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1 gap-1 border border-border h-12 w-full sm:w-auto overflow-x-auto overflow-y-hidden justify-start sm:justify-center mb-6">
                    <TabsTrigger value="transactions" className="gap-2 px-6 font-bold uppercase tracking-tighter text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <History className="h-3.5 w-3.5" /> All Transactions
                    </TabsTrigger>
                    <TabsTrigger value="earnings" className="gap-2 px-6 font-bold uppercase tracking-tighter text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <TrendingUp className="h-3.5 w-3.5" /> Platform Earnings
                    </TabsTrigger>
                    <TabsTrigger value="withdrawals" className="gap-2 px-6 font-bold uppercase tracking-tighter text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <CreditCard className="h-3.5 w-3.5" /> Withdrawals
                        {stats?.pendingWithdrawalsCount ? (
                            <Badge className="ml-2 bg-red-500 text-white border-none h-4 px-1">{stats.pendingWithdrawalsCount}</Badge>
                        ) : null}
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="transactions" className="mt-0">
                        <Card className="border-border bg-card shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-wrap gap-4 mb-6">
                                    <Select value={trxFilter.userType} onValueChange={(v) => setTrxFilter({ ...trxFilter, userType: v })}>
                                        <SelectTrigger className="w-full sm:w-48 bg-muted/50 border-border">
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Every User</SelectItem>
                                            <SelectItem value="SELLER">Sellers</SelectItem>
                                            <SelectItem value="DELIVERY_BOY">Delivery Partners</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={trxFilter.type} onValueChange={(v) => setTrxFilter({ ...trxFilter, type: v })}>
                                        <SelectTrigger className="w-full sm:w-48 bg-muted/50 border-border">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Credit & Debit</SelectItem>
                                            <SelectItem value="Credit">Credits Only</SelectItem>
                                            <SelectItem value="Debit">Debits Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DataTable
                                    columns={trxColumns}
                                    data={transactions}
                                    loading={trxLoading}
                                    emptyMessage="No financial transactions found."
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="earnings" className="mt-0">
                        <Card className="border-border bg-card shadow-sm">
                            <CardContent className="p-6 pt-8">
                                <DataTable
                                    columns={earnColumns}
                                    data={earnings}
                                    loading={earnLoading}
                                    emptyMessage="No platform earnings records found."
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="withdrawals" className="mt-0">
                        <AdminWithdrawals />
                    </TabsContent>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
