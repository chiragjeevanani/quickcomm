import { useState, useEffect } from "react";
import {
    getLowestPricesProducts,
    createLowestPricesProduct,
    updateLowestPricesProduct,
    deleteLowestPricesProduct,
    type LowestPricesProduct,
    type LowestPricesProductFormData,
} from "../../../services/api/admin/adminLowestPricesService";
import { getProducts, type Product } from "../../../services/api/admin/adminProductService";
import { useToast } from "../../../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Tag,
    Search,
    Edit,
    Trash2,
    Plus,
    TrendingDown,
    Package,
    IndianRupee,
    CheckCircle2,
    XCircle,
    ArrowUpDown,
    FilterX,
    LayoutDashboard,
    Zap,
    ShieldCheck
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminLowestPrices() {
    const { showToast } = useToast();

    // Form state
    const [selectedProduct, setSelectedProduct] = useState<string>("");
    const [order, setOrder] = useState<number | undefined>(undefined);
    const [isActive, setIsActive] = useState(true);

    // Data state
    const [lowestPricesProducts, setLowestPricesProducts] = useState<LowestPricesProduct[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pagination
    const [rowsPerPage, setRowsPerPage] = useState("10");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchLowestPricesProducts();
        fetchAvailableProducts();
    }, []);

    const fetchLowestPricesProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await getLowestPricesProducts();
            if (response.success && Array.isArray(response.data)) {
                setLowestPricesProducts(response.data);
            }
        } catch (err) {
            showToast("Failed to load curated product list", "error");
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchAvailableProducts = async () => {
        try {
            const response = await getProducts({ limit: 1000, status: "Active" });
            if (response.success && response.data) {
                setAvailableProducts(Array.isArray(response.data) ? response.data : []);
            }
        } catch (err) { }
    };

    const filteredProducts = availableProducts.filter((product) => {
        const existingProductIds = lowestPricesProducts.map((lp) =>
            typeof lp.product === "string" ? lp.product : lp.product._id
        );
        if (existingProductIds.includes(product._id) && editingId === null) return false;
        if (productSearchTerm) {
            const searchLower = productSearchTerm.toLowerCase();
            return product.productName?.toLowerCase().includes(searchLower) || product._id.toLowerCase().includes(searchLower);
        }
        return true;
    });

    const handleSubmit = async () => {
        if (!selectedProduct) {
            showToast("Please identify a target product", "error");
            return;
        }

        const formData: LowestPricesProductFormData = {
            product: selectedProduct,
            order: order !== undefined ? order : undefined,
            isActive,
        };

        try {
            setLoading(true);
            if (editingId) {
                const response = await updateLowestPricesProduct(editingId, formData);
                if (response.success) {
                    showToast("Product configuration synchronized", "success");
                    resetForm();
                    fetchLowestPricesProducts();
                }
            } else {
                const response = await createLowestPricesProduct(formData);
                if (response.success) {
                    showToast("New pricing node established", "success");
                    resetForm();
                    fetchLowestPricesProducts();
                    fetchAvailableProducts();
                }
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || "Protocol execution failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (lp: LowestPricesProduct) => {
        const productId = typeof lp.product === "string" ? lp.product : lp.product._id;
        setSelectedProduct(productId);
        setOrder(lp.order);
        setIsActive(lp.isActive);
        setEditingId(lp._id);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await deleteLowestPricesProduct(id);
            if (response.success) {
                showToast("Product node de-linked", "success");
                fetchLowestPricesProducts();
                fetchAvailableProducts();
                if (editingId === id) resetForm();
            }
        } catch (err: any) {
            showToast("Node termination failed", "error");
        }
    };

    const resetForm = () => {
        setSelectedProduct("");
        setOrder(undefined);
        setIsActive(true);
        setEditingId(null);
        setProductSearchTerm("");
    };

    const columns = [
        {
            header: "Sequence / ID",
            accessorKey: "order",
            cell: (lp: LowestPricesProduct) => (
                <div className="flex flex-col">
                    <span className="font-black text-xs text-primary"># {lp.order || 0}</span>
                    <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">NODE: {lp._id.slice(-6)}</span>
                </div>
            )
        },
        {
            header: "Commercial Entity",
            accessorKey: "productName",
            cell: (lp: LowestPricesProduct) => {
                const product = typeof lp.product === "string" ? null : lp.product;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden">
                            {product?.mainImage ? <img src={product.mainImage} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 opacity-20" />}
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                            <span className="font-bold text-xs truncate text-foreground leading-tight">{product?.productName || "Protocol Error"}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">SKU: {product?._id.slice(-8).toUpperCase()}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Market Value",
            accessorKey: "price",
            cell: (lp: LowestPricesProduct) => {
                const product = typeof lp.product === "string" ? null : lp.product;
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 font-black text-xs text-emerald-600">
                            <IndianRupee className="h-3 w-3" /> {product?.price?.toLocaleString() || "0.00"}
                        </div>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Live Valuation</span>
                    </div>
                );
            }
        },
        {
            header: "System State",
            accessorKey: "isActive",
            cell: (lp: LowestPricesProduct) => (
                <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border-2 ${lp.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                    }`}>
                    {lp.isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {lp.isActive ? 'Active' : 'Offline'}
                </Badge>
            )
        },
        {
            header: "Command",
            accessorKey: "_id",
            cell: (lp: LowestPricesProduct) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(lp)}>
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => handleDelete(lp._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Curated Price Matrix"
                description="Manage the 'Lowest Prices Ever' discovery grid for real-time customer acquisition."
            >
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 border-border" onClick={fetchLowestPricesProducts}>
                        <LayoutDashboard className="h-4 w-4" /> View Grid
                    </Button>
                    <Button className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20">
                        <Zap className="h-4 w-4" /> Global Flush
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
                    <Card className="border-border bg-card shadow-sm overflow-hidden border-2 border-primary/10">
                        <div className="h-1 bg-primary w-full" />
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">
                                {editingId ? "Node Calibration" : "Initialize Node"}
                            </CardTitle>
                            <CardDescription className="text-[10px] font-medium leading-relaxed">
                                Curate specific products for high-frequency discovery on the primary home interface.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entity Selection</Label>
                                {!editingId ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                            <Input
                                                placeholder="Search registry..."
                                                value={productSearchTerm}
                                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                                className="pl-9 h-11 bg-muted/20 border-border text-xs"
                                            />
                                        </div>
                                        <div className="border border-border rounded-xl bg-background/50 h-64 overflow-y-auto custom-scrollbar p-1 shadow-inner ring-4 ring-muted/10">
                                            {filteredProducts.length === 0 ? (
                                                <div className="h-full flex items-center justify-center p-6 text-center">
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">Empty Archive</p>
                                                </div>
                                            ) : (
                                                filteredProducts.map((p) => (
                                                    <button
                                                        key={p._id}
                                                        onClick={() => { setSelectedProduct(p._id); setProductSearchTerm(""); }}
                                                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 border ${selectedProduct === p._id ? 'bg-primary border-primary text-white shadow-lg' : 'hover:bg-muted border-transparent'
                                                            }`}
                                                    >
                                                        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                                            <Package className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[11px] font-black truncate leading-tight ${selectedProduct === p._id ? 'text-white' : 'text-foreground'}`}>{p.productName}</p>
                                                            <p className={`text-[9px] font-bold mt-0.5 ${selectedProduct === p._id ? 'text-white/70' : 'text-muted-foreground'}`}>₹{p.price?.toLocaleString()}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-muted border-2 border-primary/20 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black truncate text-primary uppercase">Active Calibration</p>
                                            <p className="text-[10px] font-bold text-muted-foreground truncate">{availableProducts.find(p => p._id === selectedProduct)?.productName}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grid Sequence</Label>
                                    <div className="relative">
                                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                        <Input
                                            type="number"
                                            value={order || ""}
                                            onChange={(e) => setOrder(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="System Auto-Assign"
                                            className="pl-9 h-11 bg-muted/20 border-border text-xs font-black"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol State</span>
                                        <span className="text-[9px] font-bold text-muted-foreground">Visible on Discovery Grid</span>
                                    </div>
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-6 border-t border-border flex flex-col gap-3">
                            <Button className="w-full gap-2 font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20" onClick={handleSubmit} disabled={loading}>
                                <TrendingDown className="h-4 w-4" /> {loading ? "Relinking..." : (editingId ? "Sync Macro" : "Initialize Link")}
                            </Button>
                            {editingId && (
                                <Button variant="ghost" className="w-full font-bold uppercase tracking-widest text-[10px] h-10" onClick={resetForm}>
                                    Abort Calibration
                                </Button>
                            )}
                        </div>
                    </Card>

                    <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-tight">Algorithmic Advantage</h4>
                            <p className="text-[10px] text-emerald-600/80 leading-relaxed font-medium">
                                Products listed here receive 4.5x higher visibility and are indexed as primary traffic magnets.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="bg-muted/10 border-b border-border py-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Active Discovery Matrix</CardTitle>
                                    <CardDescription className="text-[10px] mt-1">Live telemetry from the home discovery layer.</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                        <SelectTrigger className="w-32 h-10 bg-muted/20 border-border text-[10px] font-black uppercase tracking-widest">
                                            <SelectValue placeholder="10 Entries" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 Entries</SelectItem>
                                            <SelectItem value="25">25 Entries</SelectItem>
                                            <SelectItem value="50">50 Entries</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <DataTable
                                columns={columns}
                                data={lowestPricesProducts}
                                loading={loadingProducts}
                                emptyMessage="No products identified in the curative matrix."
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-center gap-12 py-12 opacity-10 pointer-events-none grayscale">
                        <div className="flex items-center gap-3">
                            <Tag className="h-6 w-6" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">REVENUE_LOCK v4</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap className="h-6 w-6" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">FLICKER_SYNC</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
