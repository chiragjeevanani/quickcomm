import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../../../context/ToastContext';
import { getCommissionReport } from '../../../services/api/adminCommissionService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    IndianRupee,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowLeft,
    TrendingUp,
    ShieldCheck,
    Zap,
    History,
    PieChart,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Receipt,
    Activity,
    Landmark,
    Banknote
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminPayments() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [payments, setPayments] = useState<any[]>([]);
    const [summary, setSummary] = useState({ total: 0, successful: 0, failed: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await getCommissionReport();
            if (response.success) {
                setPayments(response.data.commissions || []);
                setSummary({
                    total: response.data.summary?.totalCommissions || 0,
                    successful: response.data.summary?.totalCommissions || 0,
                    failed: 0,
                    pending: response.data.summary?.pendingCommissions || 0,
                });
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Transaction stream synchronization failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Activity className="h-10 w-10 text-primary animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Treasury Node...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <PageHeader
                title="Commission Intelligence"
                description="Real-time telemetry of platform earnings, revenue flow, and commission settlement status."
            >
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-10 gap-2 font-black uppercase tracking-widest text-[10px] border-border">
                        <ArrowLeft className="h-4 w-4" /> Exit Node
                    </Button>
                    <Button className="h-10 gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" onClick={fetchPayments}>
                        <History className="h-4 w-4" /> Refresh Matrix
                    </Button>
                </div>
            </PageHeader>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-card border-border shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden relative group border-l-4 border-l-primary/50">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="h-12 w-12 text-primary" />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm">
                                    <PieChart className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</p>
                            </div>
                            <h2 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-1">
                                <span className="text-primary text-xl">₹</span>{summary.total.toLocaleString()}
                            </h2>
                            <p className="text-[9px] font-bold text-muted-foreground/60 mt-2 uppercase tracking-tight flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Platform-wide aggregate
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="bg-card border-border shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden relative group border-l-4 border-l-emerald-500/50">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 shadow-sm">
                                    <Banknote className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Settled Logic</p>
                            </div>
                            <h2 className="text-3xl font-black text-emerald-600 tracking-tighter flex items-center gap-1">
                                <span className="text-emerald-500 text-xl">₹</span>{summary.successful.toLocaleString()}
                            </h2>
                            <p className="text-[9px] font-bold text-muted-foreground/60 mt-2 uppercase tracking-tight flex items-center gap-1">
                                <Zap className="h-3 w-3 text-amber-500" /> Successfully Processed
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="bg-card border-border shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden relative group border-l-4 border-l-amber-500/50">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
                            <Clock className="h-12 w-12" />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shadow-sm">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">In Transit</p>
                            </div>
                            <h2 className="text-3xl font-black text-amber-600 tracking-tighter flex items-center gap-1">
                                <span className="text-amber-500 text-xl">₹</span>{summary.pending.toLocaleString()}
                            </h2>
                            <p className="text-[9px] font-bold text-muted-foreground/60 mt-2 uppercase tracking-tight">Awaiting node settlement</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="bg-card border-border shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden relative group border-l-4 border-l-rose-500/50">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                            <XCircle className="h-12 w-12" />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500 shadow-sm">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Risk Pool</p>
                            </div>
                            <h2 className="text-3xl font-black text-rose-600 tracking-tighter flex items-center gap-1">
                                <span className="text-rose-500 text-xl">₹</span>{summary.failed.toLocaleString()}
                            </h2>
                            <p className="text-[9px] font-bold text-muted-foreground/60 mt-2 uppercase tracking-tight">Protocol Discrepancies</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Transaction Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 border-border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History className="h-4 w-4 text-primary" /> Active Ledger Stream
                                </CardTitle>
                                <CardDescription className="text-[10px]">Processing last 100 marketplace events</CardDescription>
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px] bg-background/50">{payments.length} EVENTS</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {payments.slice(0, 20).map((payment: any, index: number) => (
                                <motion.div
                                    key={payment._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="flex items-center justify-between p-6 hover:bg-muted/20 transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${payment.type === 'SELLER'
                                                ? 'bg-primary/10 text-primary shadow-primary/5'
                                                : 'bg-emerald-500/10 text-emerald-600 shadow-emerald-500/5'
                                            }`}>
                                            {payment.type === 'SELLER' ? <Landmark className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="font-black text-xs uppercase tracking-tight">Commission Protocol</p>
                                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                                                <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-black tracking-widest">
                                                    {payment.type === 'SELLER' ? 'SRL_NODE' : 'DEL_NODE'}
                                                </Badge>
                                                Order ID: <span className="text-foreground">#{payment.order?.orderNumber || 'ARCHIVE'}</span>
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 mt-1 uppercase font-bold tracking-tighter">
                                                <Clock className="h-2.5 w-2.5" /> Synchronized: {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1 text-sm font-black text-emerald-600 font-mono">
                                            <ArrowUpRight className="h-3.5 w-3.5" /> ₹{payment.commissionAmount.toFixed(2)}
                                        </div>
                                        <Badge variant="outline" className={`h-5 text-[8px] font-black uppercase tracking-widest border ${payment.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            }`}>
                                            {payment.status || 'Active'}
                                        </Badge>
                                    </div>
                                </motion.div>
                            ))}
                            {payments.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                                        <Receipt className="h-10 w-10 text-muted-foreground/20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">No financial telemetry found.</p>
                                    <p className="text-[9px] mt-2 text-muted-foreground/40 font-bold uppercase tracking-tight italic">Waiting for marketplace nodes to generate commission data...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    {payments.length > 0 && (
                        <div className="p-4 bg-muted/10 border-t border-border flex items-center justify-center">
                            <Button variant="ghost" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary gap-2">
                                <Activity className="h-3 w-3" /> Load Historical Metrics
                            </Button>
                        </div>
                    )}
                </Card>

                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-border bg-gradient-to-br from-primary/5 via-card to-card shadow-sm border-2 border-primary/10 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" /> Security Node
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-2xl bg-background/50 border border-border shadow-inner">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Treasury Status</p>
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-muted-foreground">Uptime</span>
                                    <span className="text-emerald-500">99.99%</span>
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: '99.99%' }} />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-background/50 border border-border shadow-inner">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Sync Integrity</p>
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-muted-foreground">Encryption</span>
                                    <span className="text-primary">AES-256</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-sm border-2 border-emerald-500/10 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Zap className="h-4 w-4 text-emerald-500" /> Auto-Settlement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                System autonomously processes commission node settlements every <span className="font-black text-emerald-600">60 minutes</span> to maintain platform liquidity.
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80">Active Protocol Stream</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center opacity-20 grayscale pointer-events-none">
                        <TrendingUp className="h-10 w-10 mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">PROFIT_SYNC v2.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
