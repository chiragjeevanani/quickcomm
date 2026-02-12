import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  getCategories,
  deleteProduct,
  type Product,
  type Category,
} from "../../../services/api/admin/adminProductService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  Download,
  Edit,
  Trash2,
  Filter,
  Box,
  Store,
  Layers,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FilterX,
  CheckCircle2,
  XCircle,
  Package
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProductVariationRow {
  id: string;
  productId: string;
  name: string;
  seller: string;
  sellerId: string;
  image: string;
  variation: string;
  stock: number | "Unlimited";
  status: "Published" | "Unpublished";
  category: string;
  categoryId: string;
}

const STATUS_OPTIONS = ["All Products", "Published", "Unpublished"];
const STOCK_OPTIONS = ["All Products", "In Stock", "Out of Stock", "Unlimited"];

export default function AdminStockManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState("All Category");
  const [filterSeller, setFilterSeller] = useState("All Sellers");
  const [filterStatus, setFilterStatus] = useState("All Products");
  const [filterStock, setFilterStock] = useState("All Products");

  const fetchData = async () => {
    try {
      setLoading(true);
      const categoriesResponse = await getCategories();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }

      const params: any = { limit: 1000 };
      if (searchTerm) params.search = searchTerm;
      if (filterCategory !== "All Category") params.category = filterCategory;
      if (filterStatus !== "All Products") params.publish = filterStatus === "Published";

      const response = await getProducts(params);
      if (response.success) {
        setProducts(response.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) fetchData();
    else setLoading(false);
  }, [isAuthenticated, token, searchTerm, filterCategory, filterStatus]);

  const handleDelete = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await deleteProduct(productId);
        if (response.success || response.message === "Product deleted successfully") {
          showToast("Product deleted successfully", "success");
          fetchData();
        } else {
          showToast("Failed to delete product", "error");
        }
      } catch (error) {
        showToast("An error occurred while deleting", "error");
      }
    }
  };

  const productVariations = useMemo(() => {
    const variations: ProductVariationRow[] = [];
    products.forEach((product) => {
      let categoryName = "Unknown";
      let categoryId = "";
      if (product.category) {
        if (typeof product.category === "object" && product.category !== null) {
          categoryName = product.category.name || "Unknown";
          categoryId = product.category._id || "";
        } else if (typeof product.category === "string") {
          categoryId = product.category;
          categoryName = categories.find((c) => c._id === product.category)?.name || "Unknown";
        }
      }
      const sellerName = typeof product.seller === "object" && product.seller !== null
        ? product.seller.storeName || product.seller.sellerName : "Unknown Seller";
      const sellerIdStr = typeof product.seller === "object" ? "" : product.seller || "";

      if (product.variations && product.variations.length > 0) {
        product.variations.forEach((variation, index) => {
          variations.push({
            id: `${product._id}-${index}`,
            productId: product._id,
            name: product.productName,
            seller: sellerName,
            sellerId: sellerIdStr,
            image: product.mainImage || product.galleryImages[0] || "",
            variation: `${variation.name}: ${variation.value}`,
            stock: variation.stock !== undefined ? variation.stock : product.stock || 0,
            status: product.publish ? "Published" : "Unpublished",
            category: categoryName,
            categoryId: categoryId,
          });
        });
      } else {
        variations.push({
          id: product._id,
          productId: product._id,
          name: product.productName,
          seller: sellerName,
          sellerId: sellerIdStr,
          image: product.mainImage || product.galleryImages[0] || "",
          variation: "Default",
          stock: product.stock || 0,
          status: product.publish ? "Published" : "Unpublished",
          category: categoryName,
          categoryId: categoryId,
        });
      }
    });
    return variations;
  }, [products, categories]);

  const uniqueSellers = useMemo(() => {
    const sellerSet = new Set<string>();
    productVariations.forEach((p) => { if (p.seller && p.seller !== "Unknown Seller") sellerSet.add(p.seller); });
    return ["All Sellers", ...Array.from(sellerSet).sort()];
  }, [productVariations]);

  const filteredProducts = useMemo(() => {
    return productVariations.filter((product) => {
      const matchesCategory = filterCategory === "All Category" || product.categoryId === filterCategory;
      const matchesSeller = filterSeller === "All Sellers" || product.seller === filterSeller;
      const matchesStatus = filterStatus === "All Products" || product.status === filterStatus;
      const matchesStock = filterStock === "All Products" ||
        (filterStock === "Unlimited" && product.stock === "Unlimited") ||
        (filterStock === "In Stock" && product.stock !== "Unlimited" && typeof product.stock === "number" && product.stock > 0) ||
        (filterStock === "Out of Stock" && product.stock !== "Unlimited" && typeof product.stock === "number" && product.stock === 0);
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.seller.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSeller && matchesStatus && matchesStock && matchesSearch;
    });
  }, [productVariations, filterCategory, filterSeller, filterStatus, filterStock, searchTerm]);

  const handleExport = () => {
    const headers = ["ID", "Name", "Seller", "Variation", "Stock", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredProducts.map(p => [p.id, `"${p.name}"`, `"${p.seller}"`, `"${p.variation}"`, p.stock, p.status].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const columns = [
    {
      header: "Product / ID",
      accessorKey: "name",
      cell: (p: ProductVariationRow) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-10 min-w-[40px] bg-muted rounded overflow-hidden border border-border shadow-sm">
            {p.image ? (
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><Package className="h-5 w-5" /></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight text-xs">{p.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">ID: {p.id.slice(-6)}</span>
          </div>
        </div>
      )
    },
    {
      header: "Inventory Details",
      accessorKey: "variation",
      cell: (p: ProductVariationRow) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="text-[10px] w-fit font-bold uppercase tracking-tighter bg-muted/30">
            {p.variation}
          </Badge>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
            <Store className="h-2.5 w-2.5" /> {p.seller}
          </div>
        </div>
      )
    },
    {
      header: "Stock Level",
      accessorKey: "stock",
      cell: (p: ProductVariationRow) => {
        const isUnlimited = p.stock === "Unlimited";
        const isOutOfStock = p.stock === 0;
        const isLowStock = !isUnlimited && typeof p.stock === 'number' && p.stock < 10 && p.stock > 0;

        return (
          <div className="flex flex-col gap-1">
            <Badge className={
              isUnlimited ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                isOutOfStock ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                  isLowStock ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold' :
                    'bg-blue-500/10 text-blue-600 border-blue-500/20'
            }>
              {p.stock} Units
            </Badge>
            {isLowStock && <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tight flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" /> Running Low</span>}
          </div>
        )
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (p: ProductVariationRow) => (
        <Badge variant="secondary" className={p.status === 'Published' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' : 'opacity-50'}>
          {p.status === 'Published' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
          {p.status}
        </Badge>
      )
    },
    {
      header: "Action",
      accessorKey: "productId",
      cell: (p: ProductVariationRow) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/product/edit/${p.productId}`)}
            className="h-8 w-8 text-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(p.productId)}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const totalPages = Math.ceil(filteredProducts.length / parseInt(rowsPerPage));
  const displayedItems = filteredProducts.slice((currentPage - 1) * parseInt(rowsPerPage), currentPage * parseInt(rowsPerPage));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Stock Control"
        description="Monitor product levels across all sellers and manage catalog availability."
      >
        <Button variant="outline" size="sm" className="gap-2 shadow-sm font-bold uppercase tracking-tight h-9" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export Ledger
        </Button>
      </PageHeader>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Box className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Stock Ledger</CardTitle>
                <CardDescription>Real-time inventory levels for active catalog items.</CardDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Variations</span>
                <span className="text-xl font-black text-foreground">{filteredProducts.length}</span>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-emerald-600">Published</span>
                <span className="text-xl font-black text-emerald-600">{filteredProducts.filter(p => p.status === 'Published').length}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Category Hub</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-muted/50 border-border h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Category">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Merchant / Seller</Label>
              <Select value={filterSeller} onValueChange={setFilterSeller}>
                <SelectTrigger className="bg-muted/50 border-border h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSellers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Listing Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-muted/50 border-border h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Inventory Health</Label>
              <Select value={filterStock} onValueChange={setFilterStock}>
                <SelectTrigger className="bg-muted/50 border-border h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-3 bg-muted/20 border border-border border-dashed rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or merchant..."
                className="pl-9 h-10 bg-card border-border shadow-inner"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={rowsPerPage} onValueChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-24 h-10 bg-card border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Rows</SelectItem>
                  <SelectItem value="25">25 Rows</SelectItem>
                  <SelectItem value="50">50 Rows</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || filterCategory !== "All Category" || filterSeller !== "All Sellers" || filterStatus !== "All Products" || filterStock !== "All Products") && (
                <Button variant="ghost" size="sm" className="h-10 text-muted-foreground hover:text-foreground" onClick={() => {
                  setSearchTerm(""); setFilterCategory("All Category"); setFilterSeller("All Sellers"); setFilterStatus("All Products"); setFilterStock("All Products");
                }}>
                  <FilterX className="h-4 w-4 mr-2" /> Reset
                </Button>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={displayedItems}
            loading={loading}
            emptyMessage="No inventory records discovered matching those parameters."
          />

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium">
              Page <span className="text-foreground font-extrabold">{currentPage}</span> of {totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="h-9 px-4 font-bold"
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages || loading}
                className="h-9 px-4 font-bold"
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 py-6 opacity-30 pointer-events-none">
        <Layers className="h-8 w-8" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">QuickCommerce Stock Engine</span>
          <span className="text-[8px] font-bold uppercase">v2.4.0 • Enterprise Inventory System</span>
        </div>
      </div>
    </div>
  );
}
