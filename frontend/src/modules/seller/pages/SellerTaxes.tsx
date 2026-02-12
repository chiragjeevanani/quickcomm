import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Download,
    Filter,
    Percent,
} from "lucide-react";

import * as taxService from "../../../services/api/taxService";
import { useToast } from "@/context/ToastContext";
import { fadeIn } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataTable from "../components/ui/DataTable";
import { Badge } from "@/components/ui/badge";

export default function SellerTaxes() {
    const [taxes, setTaxes] = useState<taxService.Tax[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchTaxes = async () => {
            setLoading(true);
            try {
                const response = await taxService.getTaxes();
                if (response.success) {
                    setTaxes(response.data);
                } else {
                    showToast(response.message || "Failed to fetch taxes", "error");
                }
            } catch (err: any) {
                showToast(err.message || "Failed to fetch taxes", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchTaxes();
    }, [showToast]);

    const filteredTaxes = taxes.filter(tax =>
        tax.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tax._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        const headers = ['ID', 'Name', 'Rate (%)', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredTaxes.map(tax => [
                tax._id,
                `"${tax.name}"`,
                tax.percentage,
                tax.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `taxes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Tax report exported successfully", "success");
    };

    const columns = [
        {
            header: "ID",
            accessorKey: "_id",
            cell: (tax: taxService.Tax) => (
                <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap">
                    {tax._id.substring(0, 8)}...
                </code>
            )
        },
        {
            header: "Tax Name",
            accessorKey: "name",
            cell: (tax: taxService.Tax) => (
                <span className="font-bold text-foreground">{tax.name}</span>
            )
        },
        {
            header: "Rate (%)",
            accessorKey: "percentage",
            cell: (tax: taxService.Tax) => (
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary font-bold">
                    {tax.percentage}%
                </Badge>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (tax: taxService.Tax) => (
                <Badge
                    variant="outline"
                    className={tax.status === 'Active'
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted"
                    }
                >
                    {tax.status}
                </Badge>
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
                    <h1 className="text-2xl font-bold text-foreground">Tax Management</h1>
                    <p className="text-sm text-muted-foreground font-bold tracking-tight">Configure tax rates for your products</p>
                </div>
                <Button
                    onClick={handleExport}
                    variant="outline"
                    className="md:w-auto w-full border-border bg-card text-foreground hover:bg-accent shadow-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-4 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Percent className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">Taxes</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Summary of all defined tax slabs</CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search taxes..."
                                    className="pl-9 w-full md:w-[260px] h-10 border-border bg-background text-foreground focus-visible:ring-primary shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={filteredTaxes}
                        loading={loading}
                        emptyMessage="No taxes found matching your search"
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}

