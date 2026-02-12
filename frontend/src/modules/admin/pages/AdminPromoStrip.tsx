import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X, Layers, ShoppingBag, Calendar } from "lucide-react";
import {
  getPromoStrips,
  createPromoStrip,
  updatePromoStrip,
  deletePromoStrip,
  type PromoStrip,
  type PromoStripFormData,
  type CategoryCard,
} from "../../../services/api/admin/adminPromoStripService";
import { getCategories, type Category } from "../../../services/api/categoryService";
import { getHeaderCategoriesAdmin, type HeaderCategory } from "../../../services/api/headerCategoryService";
import { getProducts as getAdminProducts, type Product } from "../../../services/api/admin/adminProductService";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function AdminPromoStrip() {
  const { showToast } = useToast();

  // Form state
  const [headerCategorySlug, setHeaderCategorySlug] = useState("");
  const [heading, setHeading] = useState("");
  const [saleText, setSaleText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<string[]>([]);
  const [crazyDealsTitle, setCrazyDealsTitle] = useState("CRAZY DEALS");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);

  // Data state
  const [promoStrips, setPromoStrips] = useState<PromoStrip[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [loadingPromoStrips, setLoadingPromoStrips] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch initial data
  useEffect(() => {
    fetchPromoStrips();
    fetchHeaderCategories();
    fetchCategories();
  }, []);

  // Fetch products when search changes
  useEffect(() => {
    if (productSearch.length > 2) {
      const timeoutId = setTimeout(() => {
        fetchProducts(productSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (productSearch.length === 0) {
      // Load initial products when search is cleared
      fetchProducts("");
    } else {
      setProducts([]);
    }
  }, [productSearch]);

  const fetchPromoStrips = async () => {
    try {
      setLoadingPromoStrips(true);
      const data = await getPromoStrips();
      setPromoStrips(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to fetch PromoStrips", "error");
    } finally {
      setLoadingPromoStrips(false);
    }
  };

  const fetchHeaderCategories = async () => {
    try {
      const data = await getHeaderCategoriesAdmin();
      setHeaderCategories(data || []);
    } catch (err: any) {
      console.error("Failed to fetch header categories:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
    }
  };

  const fetchProducts = async (search: string) => {
    try {
      const response = await getAdminProducts({ search, limit: 20 });
      if (response.success && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headerCategorySlug || !heading || !saleText || !startDate || !endDate) {
      showToast("Please fill in all required fields", "info");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      showToast("End date must be after start date", "info");
      return;
    }

    // Validate at least 4 featured products for carousel
    if (featuredProducts.length < 4) {
      showToast("Please select at least 4 products for the CRAZY DEALS carousel section", "info");
      return;
    }

    const formData: PromoStripFormData = {
      headerCategorySlug,
      heading,
      saleText,
      startDate,
      endDate,
      categoryCards: categoryCards.map((card) => ({
        categoryId: card.categoryId,
        title: card.title,
        badge: card.badge,
        discountPercentage: card.discountPercentage,
        order: card.order,
      })),
      featuredProducts,
      isActive,
      order,
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await updatePromoStrip(editingId, formData);
        showToast("PromoStrip updated successfully!", "success");
        resetForm();
        fetchPromoStrips();
      } else {
        await createPromoStrip(formData);
        showToast("PromoStrip created successfully!", "success");
        resetForm();
        fetchPromoStrips();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save PromoStrip", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (promoStrip: PromoStrip) => {
    setHeaderCategorySlug(promoStrip.headerCategorySlug);
    setHeading(promoStrip.heading);
    setSaleText(promoStrip.saleText);
    setStartDate(promoStrip.startDate.split("T")[0]);
    setEndDate(promoStrip.endDate.split("T")[0]);
    setCategoryCards(
      promoStrip.categoryCards.map((card) => {
        const categoryIdValue = typeof card.categoryId === "string"
          ? card.categoryId
          : (card.categoryId as any)?._id || card.categoryId;
        const categoryObj = typeof card.categoryId === "object" ? card.categoryId as any : null;
        return {
          categoryId: categoryIdValue,
          title: categoryObj?.name || card.title || "",
          badge: card.badge || "",
          discountPercentage: card.discountPercentage || 0,
          order: card.order || 0,
          _id: card._id,
        };
      })
    );
    setFeaturedProducts(
      promoStrip.featuredProducts.map((p) => {
        if (typeof p === "string") {
          return p;
        }
        return (p as any)?._id || p;
      })
    );
    setCrazyDealsTitle(promoStrip.crazyDealsTitle || "CRAZY DEALS");
    setIsActive(promoStrip.isActive);
    setOrder(promoStrip.order);
    setEditingId(promoStrip._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this PromoStrip?")) {
      return;
    }

    try {
      await deletePromoStrip(id);
      showToast("PromoStrip deleted successfully!", "success");
      fetchPromoStrips();
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete PromoStrip", "error");
    }
  };

  const resetForm = () => {
    setHeaderCategorySlug("");
    setHeading("");
    setSaleText("");
    setStartDate("");
    setEndDate("");
    setCategoryCards([]);
    setFeaturedProducts([]);
    setCrazyDealsTitle("CRAZY DEALS");
    setIsActive(true);
    setOrder(0);
    setEditingId(null);
  };

  const addCategoryCard = () => {
    setCategoryCards([
      ...categoryCards,
      {
        categoryId: "",
        title: "",
        badge: "",
        discountPercentage: 0,
        order: categoryCards.length,
      },
    ]);
  };

  const updateCategoryCard = (index: number, field: keyof CategoryCard, value: any) => {
    const updated = [...categoryCards];
    if (field === 'categoryId' && typeof value !== 'string') {
      value = typeof value === 'object' && value?._id ? value._id : String(value);
    }
    updated[index] = { ...updated[index], [field]: value };
    setCategoryCards(updated);
  };

  const removeCategoryCard = (index: number) => {
    setCategoryCards(categoryCards.filter((_, i) => i !== index));
  };

  const addFeaturedProduct = (productId: string) => {
    if (!featuredProducts.includes(productId)) {
      setFeaturedProducts([...featuredProducts, productId]);
    }
    setProductSearch("");
    setProducts([]);
  };

  const removeFeaturedProduct = (productId: string) => {
    setFeaturedProducts(featuredProducts.filter((id) => id !== productId));
  };

  const columns = [
    {
      header: "Header Category",
      accessorKey: "headerCategorySlug",
      cell: (p: PromoStrip) => <Badge variant="outline" className="font-medium bg-muted/50">{p.headerCategorySlug}</Badge>
    },
    {
      header: "Heading",
      accessorKey: "heading",
      cell: (p: PromoStrip) => <span className="font-bold text-foreground">{p.heading}</span>
    },
    {
      header: "Date Range",
      accessorKey: "startDate",
      cell: (p: PromoStrip) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {new Date(p.startDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" /> {new Date(p.endDate).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (p: PromoStrip) => (
        <Badge className={p.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
          {p.isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (p: PromoStrip) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(p)}
            className="h-8 w-8 text-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(p._id)}
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
        title="Promo Strips"
        description="Manage promotional banners, category highlights and featured carousels."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Add/Edit Form */}
        <Card className="border-border bg-card shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {editingId ? "Edit PromoStrip" : "Add PromoStrip"}
            </CardTitle>
            <CardDescription>Configure promotional content and layout.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headerCategory">Header Category <span className="text-rose-500">*</span></Label>
                <Select value={headerCategorySlug} onValueChange={setHeaderCategorySlug}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Select header category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {headerCategories
                      .filter((hc) => hc.status === "Published")
                      .map((hc) => (
                        <SelectItem key={hc._id} value={hc.slug}>
                          {hc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heading">Heading <span className="text-rose-500">*</span></Label>
                <Input
                  id="heading"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="e.g., HOUSEFULL SALE"
                  className="bg-muted/50 border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleText">Sale Text <span className="text-rose-500">*</span></Label>
                <Input
                  id="saleText"
                  value={saleText}
                  onChange={(e) => setSaleText(e.target.value)}
                  placeholder="e.g., SALE"
                  className="bg-muted/50 border-border"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date <span className="text-rose-500">*</span></Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-muted/50 border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date <span className="text-rose-500">*</span></Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-muted/50 border-border"
                    required
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Category Cards
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addCategoryCard}
                    className="h-7 text-[10px] font-bold uppercase tracking-tight text-primary hover:text-primary hover:bg-primary/5"
                  >
                    + Add Card
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {categoryCards.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                      <p className="text-xs text-muted-foreground font-medium">No category cards added</p>
                    </div>
                  )}
                  {categoryCards.map((card, index) => (
                    <Card key={index} className="bg-muted/30 border-border shadow-none">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Card #{index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCategoryCard(index)}
                            className="h-6 w-6 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <Select
                          value={typeof card.categoryId === 'string' ? card.categoryId : (card.categoryId as any)?._id || ''}
                          onValueChange={(val) => updateCategoryCard(index, "categoryId", val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-card">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(categories) && categories.map((cat) => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Custom title"
                          value={card.title}
                          onChange={(e) => updateCategoryCard(index, "title", e.target.value)}
                          className="h-8 text-xs bg-card"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Badge (off text)"
                            value={card.badge}
                            onChange={(e) => updateCategoryCard(index, "badge", e.target.value)}
                            className="h-8 text-xs bg-card"
                            required
                          />
                          <Input
                            type="number"
                            placeholder="Disc %"
                            value={card.discountPercentage}
                            onChange={(e) => updateCategoryCard(index, "discountPercentage", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs bg-card"
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Featured Products (Crazy Deals)
                </Label>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-8 h-9 text-sm bg-muted/50 border-border"
                  />
                  {productSearch.length > 0 && productSearch.length < 3 && (
                    <p className="text-[10px] text-muted-foreground mt-1">Type 3+ chars</p>
                  )}
                  {products.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {products.map((product) => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => addFeaturedProduct(product._id)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted font-medium transition-colors border-b border-border/50 last:border-0"
                        >
                          {product.productName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 border border-border rounded-lg bg-muted/20">
                  {featuredProducts.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic m-auto italic">No products selected (min 4 required)</p>
                  )}
                  {featuredProducts.map((productId) => {
                    const product = products.find((p) => p._id === productId);
                    return (
                      <Badge
                        key={productId}
                        variant="secondary"
                        className="gap-1.5 py-1 px-2 border border-primary/20 bg-primary/5 text-primary rounded-md"
                      >
                        <span className="text-[10px] max-w-[100px] truncate">{product?.productName || 'Product'}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-rose-500 transition-colors"
                          onClick={() => removeFeaturedProduct(productId)}
                        />
                      </Badge>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${featuredProducts.length >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-[10px] font-bold text-muted-foreground">{featuredProducts.length} / 4 Products</span>
                  </div>
                  {featuredProducts.length < 4 && (
                    <span className="text-[10px] font-medium text-amber-600">Need {4 - featuredProducts.length} more</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked === true)}
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Active / Visible on Storefront</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    type="number"
                    id="order"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="bg-muted/50 border-border"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
                >
                  {submitting ? "Saving..." : editingId ? "Update Strip" : "Create Strip"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="w-full"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: List */}
        <Card className="lg:col-span-2 border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Promo Strips List</CardTitle>
            <CardDescription>All active and inactive promotional strips.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border border-dashed">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingBag className="h-4 w-4" />
                Total <span className="font-bold text-foreground">{promoStrips.length}</span> strips configured
              </div>
              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-24 bg-card h-8 text-xs">
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
              data={promoStrips.slice((currentPage - 1) * parseInt(rowsPerPage), currentPage * parseInt(rowsPerPage))}
              loading={loadingPromoStrips}
              emptyMessage="No PromoStrips found."
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground font-medium">
                Page <span className="text-foreground font-bold">{currentPage}</span> of {Math.ceil(promoStrips.length / parseInt(rowsPerPage)) || 1}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loadingPromoStrips}
                  className="h-8 px-3"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= Math.ceil(promoStrips.length / parseInt(rowsPerPage)) || loadingPromoStrips}
                  className="h-8 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
