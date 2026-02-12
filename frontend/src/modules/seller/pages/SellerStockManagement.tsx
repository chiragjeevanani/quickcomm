import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import {
    Search,
    Download,
    Save,
    RefreshCw,
    Filter,
    Package,
    AlertCircle,
    CheckCircle2,
    Image as ImageIcon
} from 'lucide-react';

import { getProducts, updateStock, Product } from '../../../services/api/productService';
import { getCategories } from '../../../services/api/categoryService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from "@/context/ToastContext";
import { fadeIn } from "../lib/animations";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "../components/ui/DataTable";

interface StockItem {
    variationId: string;
    productId: string;
    name: string;
    seller: string;
    image: string;
    variation: string;
    stock: number | 'Unlimited';
    status: 'Published' | 'Unpublished';
    category: string;
}

export default function SellerStockManagement() {
    const { showToast } = useToast();
    const { user } = useAuth();

    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [updatingStock, setUpdatingStock] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [categories, setCategories] = useState<string[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch categories for filter
    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await getCategories();
                if (res.success) {
                    setCategories(res.data.map(cat => cat.name));
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCats();
    }, []);

    // Helper to resolve image URL
    const resolveImageUrl = (url: string | undefined) => {
        if (!url) return '/assets/product-placeholder.jpg';
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
        try {
            const urlObj = new URL(apiBase);
            const origin = urlObj.origin;
            const cleanUrl = url.replace(/\\/g, '/');
            return `${origin}/${cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl}`;
        } catch (e) {
            return url;
        }
    };

    const fetchStockItems = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {
                page: currentPage,
                limit: rowsPerPage,
            };

            if (categoryFilter !== 'all') params.category = categoryFilter;
            if (statusFilter === 'published') params.status = 'published';
            else if (statusFilter === 'unpublished') params.status = 'unpublished';

            const response = await getProducts(params);
            if (response.success && response.data) {
                const items: StockItem[] = [];
                response.data.forEach((product: Product) => {
                    product.variations.forEach((variation, index) => {
                        items.push({
                            variationId: variation._id || `${product._id}-${index}`,
                            productId: product._id,
                            name: product.productName,
                            seller: user?.storeName || '',
                            image: resolveImageUrl(product.mainImage || product.mainImageUrl),
                            variation: variation.title || variation.value || variation.name || 'Default',
                            stock: variation.stock,
                            status: product.publish ? 'Published' : 'Unpublished',
                            category: (product.category as any)?.name || 'Uncategorized',
                        });
                    });
                });
                setStockItems(items);
                if ((response as any).pagination) {
                    setTotalPages((response as any).pagination.pages);
                }
            } else {
                setError(response.message || 'Failed to fetch stock items');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch stock items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStockItems();
        const intervalId = setInterval(fetchStockItems, 30000);
        return () => clearInterval(intervalId);
    }, [currentPage, rowsPerPage, categoryFilter, statusFilter, user]);

    const handleStockUpdate = async (productId: string, variationId: string, newStock: number) => {
        setUpdatingStock(variationId);
        try {
            const response = await updateStock(productId, variationId, newStock);
            if (response.success) {
                showToast("Stock updated successfully", "success");
                setStockItems(prev => prev.map(item =>
                    item.variationId === variationId
                        ? { ...item, stock: newStock }
                        : item
                ));
            } else {
                showToast(response.message || 'Failed to update stock', "error");
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || err.message || 'Failed to update stock', "error");
        } finally {
            setUpdatingStock(null);
        }
    };

    const filteredItems = stockItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'published' && item.status === 'Published') ||
            (statusFilter === 'unpublished' && item.status === 'Unpublished');
        const matchesStock = stockFilter === 'all' ||
            (stockFilter === 'inStock' && (typeof item.stock === 'number' && item.stock > 0)) ||
            (stockFilter === 'outOfStock' && item.stock === 0);
        return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });

    const columns = [
        {
            header: "Product",
            accessorKey: "name",
            cell: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                        {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground line-clamp-1">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/20 bg-primary/10 text-primary font-bold">
                                {item.variation}
                            </Badge>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Category",
            accessorKey: "category",
            cell: (item: any) => <span className="text-sm font-bold text-muted-foreground uppercase tracking-tighter">{item.category}</span>
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (item: any) => (
                <Badge className={item.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none' : 'bg-muted text-muted-foreground hover:bg-muted border-none'}>
                    {item.status}
                </Badge>
            )
        },
        {
            header: "Current Stock",
            accessorKey: "stock",
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    {item.stock === 0 ? (
                        <div className="flex items-center gap-1.5 text-rose-500 font-bold bg-rose-500/10 px-2 py-1 rounded-md text-[10px] uppercase tracking-tighter border border-rose-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Out of Stock
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md text-[10px] uppercase tracking-tighter border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {item.stock} in stock
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Update Stock",
            accessorKey: "actions",
            cell: (item: any) => (
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min="0"
                        defaultValue={item.stock}
                        className="w-20 h-9 border-border bg-background text-foreground focus:ring-primary"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = parseInt((e.target as HTMLInputElement).value);
                                if (!isNaN(val)) handleStockUpdate(item.productId, item.variationId, val);
                            }
                        }}
                    />
                    <Button
                        size="sm"
                        disabled={updatingStock === item.variationId}
                        onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                            const val = parseInt(input.value);
                            if (!isNaN(val)) handleStockUpdate(item.productId, item.variationId, val);
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 shadow-lg shadow-primary/20"
                    >
                        {updatingStock === item.variationId ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            )
        }
    ];

    const handleExport = () => {
        const headers = ['Variation ID', 'Product Name', 'Variation', 'Stock', 'Status', 'Category'];
        const csvContent = [
            headers.join(','),
            ...filteredItems.map(item => [
                item.variationId, `"${item.name}"`, `"${item.variation}"`, item.stock, item.status, `"${item.category}"`
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `stock_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Stock Management</h1>
                    <p className="text-muted-foreground mt-1">Real-time inventory tracking and updates</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                    <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                    Auto-updating every 30s
                </div>
            </motion.div>

            <Card className="border-border bg-card">
                <CardHeader className="pb-4 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 border-border bg-background text-foreground focus:ring-primary"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-card hover:bg-accent" onClick={handleExport}>
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[160px] h-10 border-border bg-background text-foreground focus:ring-primary">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                        <SelectValue placeholder="Category" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="all">All Category</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-10 border-border bg-background text-foreground focus:ring-primary">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="unpublished">Unpublished</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={stockFilter} onValueChange={setStockFilter}>
                                <SelectTrigger className="w-[140px] h-10 border-border bg-background text-foreground focus:ring-primary">
                                    <SelectValue placeholder="Stock" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="all">All Stock</SelectItem>
                                    <SelectItem value="inStock">In Stock</SelectItem>
                                    <SelectItem value="outOfStock">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={filteredItems}
                        loading={loading}
                        emptyMessage="No stock items found matching your filters"
                    />

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between px-6 pb-6">
                            <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredItems.length)} of {filteredItems.length} items
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="border-border bg-card text-foreground"
                                >
                                    Previous
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={currentPage === page ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20" : "border-border bg-card text-foreground"}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="border-border bg-card text-foreground"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
