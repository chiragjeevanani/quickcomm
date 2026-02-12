import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Layers,
    Filter,
    Package,
} from "lucide-react";

import { getAllSubcategories, SubCategory } from "../../../services/api/categoryService";
import { useToast } from "@/context/ToastContext";
import { fadeIn } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataTable from "../components/ui/DataTable";
import { Badge } from "@/components/ui/badge";

export default function SellerSubCategory() {
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchSubcategories = async () => {
            setLoading(true);
            try {
                const response = await getAllSubcategories();
                if (response.success && response.data) {
                    setSubcategories(response.data);
                } else {
                    showToast(response.message || "Failed to fetch subcategories", "error");
                }
            } catch (err: any) {
                showToast(err.message || "Failed to fetch subcategories", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchSubcategories();
    }, [showToast]);

    const filteredSubcategories = subcategories.filter(sub =>
        sub.subcategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: "ID",
            accessorKey: "_id",
            cell: (sub: SubCategory) => (
                <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {sub._id}
                </code>
            )
        },
        {
            header: "Subcategory",
            accessorKey: "subcategoryName",
            cell: (sub: SubCategory) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                            src={sub.subcategoryImage || "/assets/category-placeholder.png"}
                            alt={sub.subcategoryName}
                            className="w-full h-full object-contain"
                            onError={(e) => (e.currentTarget.src = "https://placehold.co/40x40?text=Sub")}
                        />
                    </div>
                    <div>
                        <div className="font-bold text-foreground">{sub.subcategoryName}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{sub.categoryName}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Parent Category",
            accessorKey: "categoryName",
            cell: (sub: SubCategory) => (
                <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-bold uppercase text-[10px] tracking-tighter">
                    {sub.categoryName}
                </Badge>
            )
        },
        {
            header: "Products",
            accessorKey: "totalProduct",
            cell: (sub: SubCategory) => (
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary font-bold">
                    {sub.totalProduct || 0} products
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
                    <h1 className="text-2xl font-bold text-foreground">Sub-categories</h1>
                    <p className="text-sm text-muted-foreground">Manage second-level categories for your catalog</p>
                </div>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="pb-4 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Filter className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">Hierarchy Management</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">All child categories listed here</CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search sub-categories..."
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
                        data={filteredSubcategories}
                        loading={loading}
                        emptyMessage="No sub-categories found matching your search"
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}

