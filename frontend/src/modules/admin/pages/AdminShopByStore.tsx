import { useState, useEffect } from "react";
import { uploadImage } from "../../../services/api/uploadService";
import {
  validateImageFile,
  createImagePreview,
} from "../../../utils/imageUpload";
import { getProducts, getCategories, getBrands, getSellers, Product, Category, Brand, Seller } from "../../../services/api/admin/adminProductService";
import {
  getShopByStores,
  createShopByStore,
  updateShopByStore,
  deleteShopByStore,
  ShopByStore
} from "../../../services/api/admin/adminMiscService";
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
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Upload,
  Image as ImageIcon,
  Store,
  ShoppingBag,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Check
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminShopByStore() {
  const { showToast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // New State for Selections - Now supports multiple selections
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSubcategory, setFilterSubcategory] = useState<string>("");
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterSeller, setFilterSeller] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("Active");
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [stores, setStores] = useState<ShopByStore[]>([]);

  // Fetch Initial Data
  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchSellers();
  }, []);

  const fetchProducts = async () => {
    setLoadingData(true);
    try {
      const params: any = {
        limit: 10000,
        page: 1,
      };
      const res = await getProducts(params);
      if (res.success && res.data) {
        const productList = Array.isArray(res.data) ? res.data : [];
        setAllProducts(productList);
        setProducts(productList);
      } else {
        setAllProducts([]);
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories({ status: "Active" });
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await getBrands();
      if (res.success && res.data) {
        setBrands(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch brands", error);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await getSellers();
      if (res.success && res.data) {
        setSellers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch sellers", error);
    }
  };

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const res = await getShopByStores();
      if (res.success && res.data) {
        setStores(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch stores", error);
      showToast("Failed to load stores. Please refresh the page.", "error");
    } finally {
      setLoadingStores(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.storeId && store.storeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (store._id && store._id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (!sortColumn) return 0;
    let aValue: string = "";
    let bValue: string = "";

    switch (sortColumn) {
      case "id":
        aValue = (a.storeId || a._id).toLowerCase();
        bValue = (b.storeId || b._id).toLowerCase();
        break;
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error || "Invalid image file", "warning");
      return;
    }

    setStoreImageFile(file);
    try {
      const preview = await createImagePreview(file);
      setStoreImagePreview(preview);
    } catch (error) {
      showToast("Failed to create image preview", "error");
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddStore = async () => {
    if (!storeName.trim()) {
      showToast("Please enter a store name", "warning");
      return;
    }

    try {
      setUploading(true);
      let imageUrl = "";

      if (storeImageFile) {
        const imageResult = await uploadImage(storeImageFile, "dhakadsnazzy/stores");
        imageUrl = imageResult.secureUrl;
      } else if (editingId && !storeImagePreview) {
        showToast("Store image is required", "warning");
        setUploading(false);
        return;
      }

      const storeData = {
        name: storeName.trim(),
        image: imageUrl || (editingId ? stores.find(s => s._id === editingId)?.image || "" : ""),
        description: "",
        products: selectedProductIds,
        order: stores.length,
        isActive: true,
      };

      if (editingId !== null) {
        const res = await updateShopByStore(editingId, storeData);
        if (res.success) {
          showToast("Store updated successfully!", "success");
          fetchStores();
          handleReset();
        } else {
          showToast("Failed to update store", "error");
        }
      } else {
        if (!imageUrl) {
          showToast("Store image is required", "warning");
          setUploading(false);
          return;
        }
        const res = await createShopByStore(storeData);
        if (res.success) {
          showToast("Store added successfully!", "success");
          fetchStores();
          handleReset();
        } else {
          showToast("Failed to create store", "error");
        }
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to save store", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (id: string) => {
    const store = stores.find((s) => s._id === id);
    if (store) {
      setStoreName(store.name);
      setSelectedProductIds(store.products || []);
      setStoreImagePreview(store.image || "");
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      try {
        const res = await deleteShopByStore(id);
        if (res.success) {
          showToast("Store deleted successfully!", "success");
          fetchStores();
          if (editingId === id) handleReset();
        } else {
          showToast("Failed to delete store", "error");
        }
      } catch (error: any) {
        showToast(error.response?.data?.message || "Failed to delete store", "error");
      }
    }
  };

  // Filter products based on all filter criteria
  useEffect(() => {
    let filtered = [...allProducts];
    if (productSearchTerm) {
      filtered = filtered.filter(p => p.productName.toLowerCase().includes(productSearchTerm.toLowerCase()));
    }
    if (filterCategory) {
      filtered = filtered.filter(p => (typeof p.category === 'string' ? p.category : (p.category as any)?._id) === filterCategory);
    }
    if (filterSubcategory) {
      filtered = filtered.filter(p => p.subcategory && (typeof p.subcategory === 'string' ? p.subcategory : (p.subcategory as any)?._id) === filterSubcategory);
    }
    if (filterBrand) {
      filtered = filtered.filter(p => p.brand && (typeof p.brand === 'string' ? p.brand : (p.brand as any)?._id) === filterBrand);
    }
    if (filterSeller) {
      filtered = filtered.filter(p => (typeof p.seller === 'string' ? p.seller : (p.seller as any)?._id) === filterSeller);
    }
    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    if (filterMinPrice) {
      const min = parseFloat(filterMinPrice);
      if (!isNaN(min)) filtered = filtered.filter(p => p.price >= min);
    }
    if (filterMaxPrice) {
      const max = parseFloat(filterMaxPrice);
      if (!isNaN(max)) filtered = filtered.filter(p => p.price <= max);
    }
    setProducts(filtered);
  }, [allProducts, productSearchTerm, filterCategory, filterSubcategory, filterBrand, filterSeller, filterStatus, filterMinPrice, filterMaxPrice]);

  const getSubcategories = () => {
    if (!filterCategory) return [];
    return categories.filter(c => (typeof c.parentId === 'string' ? c.parentId : (c.parentId as any)?._id) === filterCategory);
  };

  const handleReset = () => {
    setStoreName("");
    setStoreImageFile(null);
    setStoreImagePreview("");
    setEditingId(null);
    setSelectedProductIds([]);
    setProductSearchTerm("");
    setFilterCategory("");
    setFilterSubcategory("");
    setFilterBrand("");
    setFilterSeller("");
    setFilterStatus("Active");
    setFilterMinPrice("");
    setFilterMaxPrice("");
  };

  const columns = [
    {
      header: "Store Info",
      accessorKey: "name",
      cell: (s: ShopByStore) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 min-w-[40px] bg-muted rounded-lg overflow-hidden border border-border">
            {s.image ? (
              <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                <Store className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight">{s.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">ID: {(s.storeId || s._id).slice(-6)}</span>
          </div>
        </div>
      )
    },
    {
      header: "Products",
      accessorKey: "products",
      cell: (s: ShopByStore) => (
        <Badge variant="secondary" className="gap-1 font-bold">
          <ShoppingBag className="h-3 w-3" /> {s.products?.length || 0}
        </Badge>
      )
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (s: ShopByStore) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(s._id)}
            className="h-8 w-8 text-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(s._id)}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop by Store"
        description="Organize products into specialized store collections and hubs."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Add Store */}
        <Card className="border-border bg-card shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {editingId ? "Edit Collection" : "New Collection"}
            </CardTitle>
            <CardDescription>Group products into a branded storefront gallery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="storeName">Collection Name <span className="text-rose-500">*</span></Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g., Organic Farm Hub"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Product Selection <Badge variant="secondary" className="ml-auto">{selectedProductIds.length} Selected</Badge>
              </Label>

              <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-xs bg-card"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); setFilterSubcategory(""); }}>
                      <SelectTrigger className="h-8 text-[11px] bg-card">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_cats">All Categories</SelectItem>
                        {categories.filter(c => !c.parentId).map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterSubcategory} onValueChange={setFilterSubcategory} disabled={!filterCategory}>
                      <SelectTrigger className="h-8 text-[11px] bg-card">
                        <SelectValue placeholder="Subcategories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_subs">All Subs</SelectItem>
                        {getSubcategories().map((sub) => (
                          <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filterBrand} onValueChange={setFilterBrand}>
                      <SelectTrigger className="h-8 text-[11px] bg-card">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_brands">All Brands</SelectItem>
                        {brands.map(b => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterSeller} onValueChange={setFilterSeller}>
                      <SelectTrigger className="h-8 text-[11px] bg-card">
                        <SelectValue placeholder="All Sellers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_sellers">All Sellers</SelectItem>
                        {sellers.map(s => (
                          <SelectItem key={s._id} value={s._id}>{s.storeName || s.sellerName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-[200px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                  {loadingData ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      <span className="text-[10px] font-bold uppercase">Scanning Catalog...</span>
                    </div>
                  ) : products.length > 0 ? (
                    products.map((p) => (
                      <div
                        key={p._id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer group ${selectedProductIds.includes(p._id) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-card border border-transparent'
                          }`}
                        onClick={() => toggleProductSelection(p._id)}
                      >
                        <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${selectedProductIds.includes(p._id) ? 'bg-primary border-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'
                          }`}>
                          {selectedProductIds.includes(p._id) && <Check className="h-3 w-3 text-white stroke-[3]" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground leading-tight">{p.productName}</span>
                          <span className="text-[9px] font-medium text-muted-foreground uppercase">₹{p.price}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 opacity-10 mb-2" />
                      <p className="text-[10px] font-bold uppercase text-center">No items found matching<br />current filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Collection Image</Label>
              <div
                className={`relative group rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${storeImagePreview ? 'bg-card border-solid' : 'hover:bg-muted/50 hover:border-primary/50'
                  }`}
                onClick={() => document.getElementById('store-image-upload')?.click()}
              >
                {storeImagePreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={storeImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm" className="gap-2 bg-white text-black hover:bg-white/90">
                        <Upload className="h-4 w-4" /> Change Image
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStoreImageFile(null);
                        setStoreImagePreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4 text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">Click to upload image</p>
                      <p className="text-xs">Supports JPG, PNG (Max 5MB)</p>
                    </div>
                  </div>
                )}
                <input
                  id="store-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={handleAddStore}
                disabled={uploading}
                className="w-full font-bold uppercase tracking-wider h-11 shadow-lg shadow-primary/20"
              >
                {uploading ? "Uploading Data..." : editingId ? "Update Collection" : "Publish Collection"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={handleReset} className="w-full">
                  Cancel Edit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - View Stores */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg font-bold">Active Hubs</CardTitle>
              <CardDescription>Browse and manage the storefront boutique layouts.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchStores}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter stores..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-8 h-9 text-sm bg-muted/50 border-border"
                />
              </div>
              <Select value={rowsPerPage} onValueChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-24 bg-muted/50 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Rows</SelectItem>
                  <SelectItem value="25">25 Rows</SelectItem>
                  <SelectItem value="50">50 Rows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={displayedStores}
              loading={loadingStores}
              emptyMessage="No collections found on the platform."
            />

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground font-medium italic">
                Showing <span className="text-foreground font-bold">{displayedStores.length}</span> active boutique storefronts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loadingStores}
                  className="h-8 p-0 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="h-8 px-3 font-bold border-primary/20 bg-primary/5 text-primary">
                  {currentPage} / {Math.ceil(sortedStores.length / parseInt(rowsPerPage)) || 1}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= Math.ceil(sortedStores.length / parseInt(rowsPerPage)) || loadingStores}
                  className="h-8 p-0 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
