import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History,
    CheckCircle2,
    XCircle,
    Clock,
    IndianRupee,
    ExternalLink,
    MoreVertical,
    AlertCircle,
    FileText
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import {
    getWithdrawalRequests,
    processWithdrawal,
    WithdrawalRequest
} from '../../../services/api/admin/adminWalletService';
import DataTable from "../components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminWithdrawals() {
    const { showToast } = useToast();
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
    const [transactionRef, setTransactionRef] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchWithdrawals();
    }, [filter]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const response = await getWithdrawalRequests({
                status: filter === 'all' ? undefined : filter,
            });
            if (response.success) {
                const data = response.data;
                if (Array.isArray(data)) {
                    setWithdrawals(data);
                } else if (data && typeof data === 'object' && 'requests' in data) {
                    setWithdrawals((data as any).requests || []);
                } else {
                    setWithdrawals([]);
                }
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to load withdrawals', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            setIsProcessing(true);
            const response = await processWithdrawal({ requestId: id, action: 'Approve' });
            if (response.success) {
                showToast('Withdrawal approved successfully', 'success');
                fetchWithdrawals();
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to approve withdrawal', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (id: string) => {
        const remarks = prompt('Enter rejection reason (optional):');
        if (remarks === null) return;

        try {
            setIsProcessing(true);
            const response = await processWithdrawal({ requestId: id, action: 'Reject', remark: remarks });
            if (response.success) {
                showToast('Withdrawal rejected', 'success');
                fetchWithdrawals();
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to reject withdrawal', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleComplete = async () => {
        if (!selectedWithdrawal || !transactionRef) {
            showToast('Transaction reference is required', 'error');
            return;
        }

        try {
            setIsProcessing(true);
            const response = await processWithdrawal({
                requestId: selectedWithdrawal._id || selectedWithdrawal.id,
                action: 'Complete',
                transactionReference: transactionRef
            });
            if (response.success) {
                showToast('Withdrawal completed successfully', 'success');
                setShowCompleteModal(false);
                setSelectedWithdrawal(null);
                setTransactionRef('');
                fetchWithdrawals();
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to complete withdrawal', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{status}</Badge>;
            case 'Approved': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{status}</Badge>;
            case 'Rejected': return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-rose-500/20">{status}</Badge>;
            default: return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{status}</Badge>;
        }
    };

    const columns = [
        {
            header: "User",
            accessorKey: "userId",
            cell: (w: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground line-clamp-1">{w.userId?.sellerName || w.userId?.storeName || w.userId?.name || 'N/A'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[10px] h-4 px-1 ${w.userType === 'SELLER' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                            {w.userType}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Ref: {w._id?.slice(-6)}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Payment Info",
            accessorKey: "paymentMethod",
            cell: (w: any) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{w.paymentMethod}</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[150px]">{w.accountDetails || 'No details'}</span>
                </div>
            )
        },
        {
            header: "Requested On",
            accessorKey: "createdAt",
            cell: (w: any) => <span className="text-xs text-muted-foreground">{new Date(w.createdAt || w.requestDate).toLocaleDateString()}</span>
        },
        {
            header: "Amount",
            accessorKey: "amount",
            cell: (w: any) => <span className="font-bold text-foreground">₹{w.amount?.toFixed(2)}</span>
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (w: any) => getStatusBadge(w.status)
        },
        {
            header: "Action",
            accessorKey: "_id",
            cell: (w: any) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {w.status === 'Pending' && (
                            <>
                                <DropdownMenuItem onClick={() => handleApprove(w._id || w.id)} className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-50 gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(w._id || w.id)} className="text-rose-500 focus:text-rose-500 focus:bg-rose-50 gap-2">
                                    <XCircle className="h-4 w-4" /> Reject
                                </DropdownMenuItem>
                            </>
                        )}
                        {w.status === 'Approved' && (
                            <DropdownMenuItem onClick={() => { setSelectedWithdrawal(w); setShowCompleteModal(true); }} className="text-blue-500 focus:text-blue-500 focus:bg-blue-50 gap-2">
                                <ExternalLink className="h-4 w-4" /> Complete Transfer
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" /> View Details
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                {['all', 'Pending', 'Approved', 'Completed', 'Rejected'].map((s) => (
                    <Button
                        key={s}
                        variant={filter === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(s)}
                        className={`h-9 px-4 font-bold uppercase tracking-tighter text-[10px] ${filter === s ? 'shadow-lg shadow-primary/20' : ''}`}
                    >
                        {s} Requests
                    </Button>
                ))}
            </div>

            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                    <DataTable
                        columns={columns}
                        data={withdrawals}
                        loading={loading}
                        emptyMessage="No withdrawal requests found."
                    />
                </CardContent>
            </Card>

            <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
                <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Complete Withdrawal</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Please provide the transaction reference/UTR number to complete this payout.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="txRef" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Transaction Reference ID</Label>
                            <Input
                                id="txRef"
                                placeholder="e.g. UPI Ref No. or Bank TRN ID"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                className="bg-muted/30 border-border focus-visible:ring-primary/20"
                            />
                        </div>
                        {selectedWithdrawal && (
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-muted-foreground">Amount to Transfer:</span>
                                    <span className="text-foreground font-bold text-lg">₹{selectedWithdrawal.amount?.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowCompleteModal(false)} disabled={isProcessing}>Cancel</Button>
                        <Button onClick={handleComplete} disabled={isProcessing || !transactionRef} className="bg-primary text-primary-foreground">
                            {isProcessing ? 'Processing...' : 'Confirm Transfer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
