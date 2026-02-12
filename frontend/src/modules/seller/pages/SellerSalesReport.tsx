import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Download,
    Calendar,
    FileText,
    Filter,
    ArrowRight,
} from "lucide-react";

import { getSalesReport, SalesReport } from "../../../services/api/reportService";
import { useToast } from "@/context/ToastContext";
import { fadeIn } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataTable from "../components/ui/DataTable";
import { Badge } from "@/components/ui/badge";

export default function SellerSalesReport() {
    const [reports, setReports] = useState<SalesReport[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getSalesReport({
                fromDate,
                toDate,
                search: searchTerm,
                page: 1, // Simplified for this view
                limit: 100, // Show more in the initial view
            });

            if (response.success) {
                setReports(response.data);
                setPagination({
                    total: response.pagination.total,
                    pages: response.pagination.pages
                });
            } else {
                showToast(response.message || "Failed to fetch reports", "error");
            }
        } catch (err: any) {
            showToast(err.message || "Error loading reports", "error");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, searchTerm, showToast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleExport = () => {
        const headers = ['Order ID', 'Item ID', 'Product', 'Variant', 'Total', 'Date'];
        const csvContent = [
            headers.join(','),
            ...reports.map(report => [
                report.orderId,
                report.orderItemId,
                `"${report.product}"`,
                `"${report.variant}"`,
                report.total,
                report.date
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Report exported successfully", "success");
    };

    const columns = [
        {
            header: "Order ID",
            accessorKey: "orderId",
            cell: (report: SalesReport) => (
                <span className="font-bold text-primary">#{report.orderId}</span>
            )
        },
        {
            header: "Product Details",
            accessorKey: "product",
            cell: (report: SalesReport) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground line-clamp-1">{report.product}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{report.variant}</span>
                </div>
            )
        },
        {
            header: "Amount",
            accessorKey: "total",
            cell: (report: SalesReport) => (
                <span className="font-bold text-foreground">₹{report.total.toFixed(2)}</span>
            )
        },
        {
            header: "Date",
            accessorKey: "date",
            cell: (report: SalesReport) => (
                <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-tighter">{report.date}</span>
                </div>
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
                    <h1 className="text-2xl font-bold text-foreground">Sales Report</h1>
                    <p className="text-sm text-muted-foreground font-bold tracking-tight">Track and analyze your business performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-border bg-card text-foreground hover:bg-accent"
                        onClick={() => { setFromDate(""); setToDate(""); setSearchTerm(""); }}
                    >
                        Reset Filters
                    </Button>
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                    </Button>
                </div>
            </div>

            {/* Stats Overview could go here if needed */}

            <Card className="border-border bg-card">
                <CardHeader className="pb-4 border-b border-border">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="OrderID or Product..."
                                    className="pl-9 h-10 border-border bg-background text-foreground focus-visible:ring-primary shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Input
                                    type="date"
                                    className="h-10 border-border bg-background text-foreground w-[150px] focus-visible:ring-primary shadow-sm"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                                <ArrowRight className="w-4 h-4" />
                                <Input
                                    type="date"
                                    className="h-10 border-border bg-background text-foreground w-[150px] focus-visible:ring-primary shadow-sm"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary h-8 px-3 font-bold uppercase tracking-tighter text-[10px]">
                                {pagination.total} Transactions Found
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={reports}
                        loading={loading}
                        emptyMessage="No sales data found for the selected criteria"
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}


