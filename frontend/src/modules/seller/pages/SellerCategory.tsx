import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Download,
    Layers,
    Filter,
    FileText
} from "lucide-react";

import { getCategories, Category } from "../../../services/api/categoryService";
import { useToast } from "@/context/ToastContext";
import { fadeIn } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataTable from "../components/ui/DataTable";
import { Badge } from "@/components/ui/badge";

export default function SellerCategory() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const response = await getCategories();
                if (response.success && response.data) {
                    setCategories(response.data);
                } else {
                    showToast(response.message || "Failed to fetch categories", "error");
                }
            } catch (err: any) {
                showToast(err.message || "Failed to fetch categories", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [showToast]);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        const headers = ['ID', 'Category Name', 'Total Subcategory'];
        const csvContent = [
            headers.join(','),
            ...filteredCategories.map(cat => [
                cat._id,
                `"${cat.name}"`,
                cat.totalSubcategory || 0
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Categories exported successfully", "success");
    };

    const columns = [
        {
            header: "ID",
            accessorKey: "_id",
            cell: (cat: Category) => (
                <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {cat._id}
                </code>
            )
        },
        {
            header: "Category",
            accessorKey: "name",
            cell: (cat: Category) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                            src={cat.image || "/assets/category-placeholder.png"}
                            alt={cat.name}
                            className="w-full h-full object-contain"
                            onError={(e) => (e.currentTarget.src = "https://placehold.co/40x40?text=Cat")}
                        />
                    </div>
                    <span className="font-bold text-foreground">{cat.name}</span>
                </div>
            )
        },
        {
            header: "Subcategories",
            accessorKey: "totalSubcategory",
            cell: (cat: Category) => (
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary font-bold">
                    {cat.totalSubcategory || 0} items
                </Badge>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: () => (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/20">
                    Active
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
                    <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                    <p className="text-sm text-muted-foreground">Manage your product categories and hierarchy</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="border-border bg-card text-foreground hover:bg-accent"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="pb-4 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Layers className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">Category Management</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Total {categories.length} categories available</CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search categories..."
                                    className="pl-9 w-full md:w-[260px] h-10 border-border bg-background text-foreground focus-visible:ring-primary"
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
                        data={filteredCategories}
                        loading={loading}
                        emptyMessage="No categories found matching your search"
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}
