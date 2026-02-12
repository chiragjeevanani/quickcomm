import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Filter,
  Image as ImageIcon,
  MoreVertical
} from "lucide-react";

import {
  getProducts,
  deleteProduct,
  Product,
} from "../../../services/api/productService";
import {
  getCategories,
  Category as apiCategory,
} from "../../../services/api/categoryService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fadeIn, slideUp } from "../lib/animations";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "../components/ui/DataTable";

export default function SellerProductList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [allCategories, setAllCategories] = useState<apiCategory[]>([]);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setAllCategories(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortColumn || "createdAt",
        sortOrder: sortDirection,
      };

      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (statusFilter === "published") params.status = "published";
      else if (statusFilter === "unpublished") params.status = "unpublished";

      if (stockFilter === "inStock") params.stock = "inStock";
      else if (stockFilter === "outOfStock") params.stock = "outOfStock";

      const response = await getProducts(params);
      if (response.success && response.data) {
        setProducts(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
          setPaginationInfo(response.pagination);
        } else {
          setTotalPages(Math.ceil(response.data.length / rowsPerPage));
          setPaginationInfo(null);
        }
      } else {
        setError(response.message || "Failed to fetch products");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, rowsPerPage, searchTerm, categoryFilter, statusFilter, stockFilter, sortColumn, sortDirection]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await deleteProduct(productId);
      if (response.success || response.message === "Product deleted successfully") {
        showToast("Product deleted successfully", "success");
        fetchProducts();
      } else {
        showToast(response.message || "Failed to delete product", "error");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Error deleting product", "error");
    }
  };

  const flattenVariations = () => {
    return products.flatMap((product) => {
      if (!product.variations || product.variations.length === 0) {
        return [{
          variationId: `${product._id}-default`,
          productName: product.productName,
          sellerName: user?.storeName || "",
          productImage: product.mainImage || product.mainImageUrl || "/assets/product-placeholder.jpg",
          brandName: (product.brand as any)?.name || "-",
          category: (product.category as any)?.name || "-",
          subCategory: (product.subcategory as any)?.name || "-",
          price: (product as any).price || 0,
          discPrice: (product as any).discPrice || 0,
          variation: "Default",
          productId: product._id,
        }];
      }
      return product.variations.map((variation, index) => ({
        variationId: variation._id || `${product._id}-${index}`,
        productName: product.productName,
        sellerName: user?.storeName || "",
        productImage: product.mainImage || product.mainImageUrl || "/assets/product-placeholder.jpg",
        brandName: (product.brand as any)?.name || "-",
        category: (product.category as any)?.name || "-",
        subCategory: (product.subcategory as any)?.name || "-",
        price: variation.price,
        discPrice: variation.discPrice,
        variation: variation.title || variation.value || variation.name || "Default",
        productId: product._id,
      }));
    });
  };

  const displayedVariations = flattenVariations();

  const columns = [
    {
      header: "Product",
      accessorKey: "productName",
      cell: (v: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
            {v.productImage ? (
              <img src={v.productImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground line-clamp-1">{v.productName}</span>
            <span className="text-[10px] text-muted-foreground font-mono">#{v.productId.slice(-6)}</span>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (v: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{v.category}</span>
          <span className="text-xs text-muted-foreground">{v.subCategory}</span>
        </div>
      )
    },
    {
      header: "Variation",
      accessorKey: "variation",
      cell: (v: any) => <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">{v.variation}</Badge>
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: (v: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">₹{v.discPrice || v.price}</span>
          {v.discPrice > 0 && <span className="text-xs text-muted-foreground line-through">₹{v.price}</span>}
        </div>
      )
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (v: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/seller/product/edit/${v.productId}`)}
            className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(v.productId)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleExport = () => {
    const headers = ["Product ID", "Variation ID", "Product Name", "Category", "SubCategory", "Price", "Disc Price", "Variation"];
    const csvContent = [
      headers.join(","),
      ...displayedVariations.map((v) =>
        [v.productId, v.variationId, `"${v.productName}"`, `"${v.category}"`, `"${v.subCategory}"`, v.price, v.discPrice, `"${v.variation}"`].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product List</h1>
          <p className="text-muted-foreground mt-1">Manage and track your store's inventory</p>
        </div>
        <Button
          onClick={() => navigate("/seller/product/add")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </motion.div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-border focus:ring-primary bg-background text-foreground"
                />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-background text-foreground hover:bg-accent" onClick={handleExport}>
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-10 border-border bg-background text-foreground">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="all">All Category</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10 border-border bg-background text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[140px] h-10 border-border bg-background text-foreground">
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
            data={displayedVariations}
            loading={loading}
            emptyMessage="No products found matching your filters"
          />

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, paginationInfo?.total || 0)} of {paginationInfo?.total || 0} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="border-border bg-background text-foreground"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-border bg-background text-foreground"}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="border-border bg-background text-foreground"
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
