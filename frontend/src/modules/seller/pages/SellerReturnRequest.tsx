import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Download,
    RotateCcw,
    Eye,
    Filter,
    Calendar,
} from "lucide-react";

import { getReturnRequests, ReturnRequest, GetReturnRequestsParams } from "../../../services/api/returnService";
import { useToast } from "@/context/ToastContext";
import { fadeIn } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataTable from "../components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SellerReturnRequest() {
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const fetchReturnRequests = async () => {
        setLoading(true);
        try {
            const params: GetReturnRequestsParams = {
                page: 1,
                limit: 100, // Show bulk
                sortBy: "returnDate",
                sortOrder: "desc",
            };

            if (fromDate && toDate) {
                params.dateFrom = fromDate;
                params.dateTo = toDate;
            }

            if (statusFilter !== "all") {
                params.status = statusFilter;
            }

            if (searchTerm) {
                params.search = searchTerm;
            }

            const response = await getReturnRequests(params);
            if (response.success) {
                setReturnRequests(response.data);
            } else {
                showToast(response.message || "Failed to fetch return requests", "error");
            }
        } catch (err: any) {
            showToast(err.message || "Failed to fetch return requests", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturnRequests();
    }, [statusFilter, searchTerm, fromDate, toDate]);

    const handleExport = () => {
        const headers = ['Item ID', 'Product', 'Variant', 'Price', 'Qty', 'Total', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...returnRequests.map(req => [
                req.orderItemId,
                `"${req.product}"`,
                `"${req.variant}"`,
                req.price,
                req.quantity,
                req.total,
                `"${req.status}"`,
                req.date
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `returns_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Return requests list exported", "success");
    };

    const columns = [
        {
            header: "Product",
            accessorKey: "product",
            cell: (req: ReturnRequest) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground line-clamp-1">{req.product}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{req.variant}</span>
                </div>
            )
        },
        {
            header: "Amount",
            accessorKey: "total",
            cell: (req: ReturnRequest) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">₹{req.total.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground font-bold">Qty: {req.quantity}</span>
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (req: ReturnRequest) => (
                <Badge
                    variant="outline"
                    className={
                        req.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            req.status === 'Pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                req.status === 'Rejected' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                    "bg-muted text-muted-foreground border-border"
                    }
                >
                    {req.status}
                </Badge>
            )
        },
        {
            header: "Date",
            accessorKey: "date",
            cell: (req: ReturnRequest) => (
                <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-tighter whitespace-nowrap">{req.date}</span>
                </div>
            )
        },
        {
            header: "Action",
            accessorKey: "action",
            cell: (req: ReturnRequest) => (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => showToast(`Viewing details for ${req.orderItemId}`, "info")}>
                    <Eye className="w-4 h-4" />
                </Button>
            )
        }
    ];

    return (
        <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Return Requests</h1>
                    <p className="text-sm text-muted-foreground font-bold tracking-tight">Manage order returns and reversals</p>
                </div>
                <Button
                    onClick={handleExport}
                    variant="outline"
                    className="md:w-auto w-full border-border bg-card text-foreground hover:bg-accent shadow-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                </Button>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="pb-4 border-b border-border">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative flex-1 max-w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search item ID or product..."
                                    className="pl-9 h-10 border-border bg-background text-foreground focus-visible:ring-primary shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px] h-10 border-border bg-background text-foreground focus-visible:ring-primary shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <RotateCcw className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Total Returns</p>
                                <p className="text-sm font-bold text-foreground">{returnRequests.length}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={returnRequests}
                        loading={loading}
                        emptyMessage="No return requests found"
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}


