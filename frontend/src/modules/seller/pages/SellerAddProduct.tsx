import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Upload,
  Save,
  X,
  ChevronLeft,
  Package,
  Image as ImageIcon,
  Layers,
  Info,
  RefreshCw,
} from "lucide-react";

import {
  createProduct,
  getProductById,
  updateProduct,
  Product,
  ProductVariation,
  CreateProductData,
} from "../../../services/api/productService";
import {
  getCategories,
  getSubcategories,
  Category,
  SubCategory,
} from "../../../services/api/categoryService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fadeIn, slideUp } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SellerAddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    subcategory: "",
    mainImage: "" as any,
    galleryImages: [] as any[],
    publish: true,
    popular: false,
    smallDescription: "",
    dealOfDay: false,
    isReturnable: false,
    totalAllowedQuantity: 10,
  });

  const [variations, setVariations] = useState<ProductVariation[]>([
    { title: "Default", price: 0, discPrice: 0, stock: 0, status: "Available" }
  ]);

  const [previewImages, setPreviewImages] = useState<{
    main: string | null;
    gallery: string[];
  }>({
    main: null,
    gallery: [],
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const catRes = await getCategories();
        if (catRes.success) setCategories(catRes.data);

        if (id) {
          const prodRes = await getProductById(id);
          if (prodRes.success && prodRes.data) {
            const product = prodRes.data;
            setFormData({
              productName: product.productName,
              category: typeof product.category === 'object' ? (product.category as any)._id : product.category,
              subcategory: typeof product.subcategory === 'object' ? (product.subcategory as any)._id : product.subcategory,
              mainImage: product.mainImageUrl || "",
              galleryImages: product.galleryImageUrls || [],
              publish: product.publish,
              popular: product.popular,
              smallDescription: product.smallDescription || "",
              dealOfDay: product.dealOfDay || false,
              isReturnable: product.isReturnable || false,
              totalAllowedQuantity: product.totalAllowedQuantity || 10,
            });
            setVariations(product.variations.length > 0 ? product.variations : [{ title: "Default", price: 0, discPrice: 0, stock: 0, status: "Available" }]);

            setPreviewImages({
              main: product.mainImageUrl || null,
              gallery: product.galleryImageUrls || [],
            });

            if (product.category) {
              const catId = typeof product.category === 'object' ? (product.category as any)._id : product.category;
              const subRes = await getSubcategories(catId);
              if (subRes.success) setSubCategories(subRes.data);
            }
          }
        }
      } catch (err) {
        showToast("Error loading initial data", "error");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [id, showToast]);

  const handleCategoryChange = async (catId: string) => {
    setFormData({ ...formData, category: catId, subcategory: "" });
    try {
      const res = await getSubcategories(catId);
      if (res.success) setSubCategories(res.data);
    } catch (err) {
      showToast("Error fetching subcategories", "error");
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, mainImage: file });
      setPreviewImages(prev => ({ ...prev, main: URL.createObjectURL(file) }));
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      galleryImages: [...prev.galleryImages, ...files]
    }));
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => ({
      ...prev,
      gallery: [...prev.gallery, ...newPreviews]
    }));
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
    setPreviewImages(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const addVariation = () => {
    setVariations([...variations, { title: "", price: 0, discPrice: 0, stock: 0, status: "Available" }]);
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = [...variations];
    newVariations[index] = { ...newVariations[index], [field]: value };
    setVariations(newVariations);
  };

  const removeVariation = (index: number) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, you'd upload images first and get URLs
      // For this demo/refactor, we'll assume the API handles it or we use placeholders
      const productToSubmit: CreateProductData = {
        productName: formData.productName,
        categoryId: formData.category,
        subcategoryId: formData.subcategory,
        publish: formData.publish,
        popular: formData.popular,
        dealOfDay: formData.dealOfDay,
        smallDescription: formData.smallDescription,
        isReturnable: formData.isReturnable,
        totalAllowedQuantity: formData.totalAllowedQuantity,
        variations: variations,
        tags: [], // Optional
        mainImageUrl: typeof formData.mainImage === 'string' ? formData.mainImage : undefined,
        galleryImageUrls: formData.galleryImages?.filter(img => typeof img === 'string') || [],
      };

      let response;
      if (id) {
        response = await updateProduct(id, productToSubmit);
      } else {
        response = await createProduct(productToSubmit);
      }

      if (response.success) {
        showToast(id ? "Product updated successfully" : "Product created successfully", "success");
        navigate("/seller/products");
      } else {
        showToast(response.message || "Failed to save product", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving product", "error");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full shadow-sm border-border bg-card">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{id ? "Edit Product" : "Add New Product"}</h1>
            <p className="text-sm text-muted-foreground">Fill in the details to {id ? "update your" : "list a new"} product</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="border-border text-foreground hover:bg-accent">Cancel</Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {id ? "Update Product" : "Publish Product"}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-foreground">General Information</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">Fundamental details about your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName" className="text-foreground">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="e.g. Organic Green Tea"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="focus:ring-primary border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">Category</Label>
                    <Select value={formData.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="border-border bg-background text-foreground">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground border-border">
                        {categories.map(cat => (
                          <SelectItem key={cat._id} value={cat._id} className="focus:bg-accent focus:text-accent-foreground">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory" className="text-foreground">Sub-category</Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(val) => setFormData({ ...formData, subcategory: val })}
                      disabled={!formData.category}
                    >
                      <SelectTrigger className="border-border bg-background text-foreground">
                        <SelectValue placeholder="Select Sub-category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground border-border">
                        {subCategories.map(sub => (
                          <SelectItem key={sub._id} value={sub._id} className="focus:bg-accent focus:text-accent-foreground">{sub.subcategoryName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smallDescription" className="text-foreground">Description (Optional)</Label>
                  <textarea
                    id="smallDescription"
                    rows={4}
                    className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px] placeholder:text-muted-foreground transition-colors"
                    placeholder="Tell customers about your product..."
                    value={formData.smallDescription}
                    onChange={(e) => setFormData({ ...formData, smallDescription: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing & Variations */}
          <motion.div variants={slideUp} initial="initial" animate="animate" custom={1}>
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <Layers className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg text-foreground">Pricing & Variations</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">Manage different versions and prices</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariation}
                  className="border-primary/20 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variation
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {variations.map((variation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-xl border border-border bg-muted/30 space-y-4 relative group"
                    >
                      {variations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariation(index)}
                          className="absolute -top-2 -right-2 p-1.5 bg-background border border-border text-destructive rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Variant Name</Label>
                          <Input
                            placeholder="e.g. Small / Red"
                            value={variation.title}
                            onChange={(e) => updateVariation(index, 'title', e.target.value)}
                            className="h-9 border-border bg-background text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Base Price (₹)</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={variation.price}
                            onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                            className="h-9 border-border bg-background text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sale Price (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Optional"
                            value={variation.discPrice}
                            onChange={(e) => updateVariation(index, 'discPrice', Number(e.target.value))}
                            className="h-9 border-border bg-background text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inventory</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={variation.stock}
                            onChange={(e) => updateVariation(index, 'stock', Number(e.target.value))}
                            className="h-9 border-border bg-background text-foreground"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Images & Status */}
        <div className="space-y-6">
          <motion.div variants={slideUp} initial="initial" animate="animate" custom={2}>
            <Card className="border-border bg-card overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <ImageIcon className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-foreground">Product Media</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                {/* Main Image */}
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-medium">Main Product Image</Label>
                  <div className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center overflow-hidden group">
                    {previewImages.main ? (
                      <>
                        <img src={previewImages.main} alt="Product preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <Button size="sm" variant="secondary" onClick={() => document.getElementById('main-image-upload')?.click()}>
                            Change Image
                          </Button>
                        </div>
                      </>
                    ) : (
                      <label htmlFor="main-image-upload" className="cursor-pointer flex flex-col items-center gap-2 hover:text-primary transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground/50" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter px-4 text-center">Click to upload main image</span>
                      </label>
                    )}
                    <input id="main-image-upload" type="file" accept="image/*" className="hidden" onChange={handleMainImageChange} />
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Gallery */}
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-medium">Gallery Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {previewImages.gallery.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg border border-border bg-background overflow-hidden group">
                        <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="absolute top-1 right-1 p-1 bg-background/80 text-destructive rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {previewImages.gallery.length < 5 && (
                      <label htmlFor="gallery-upload" className="aspect-square rounded-lg border border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                        <Plus className="w-5 h-5 text-muted-foreground/50" />
                        <input id="gallery-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryImagesChange} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">You can upload up to 5 images (JPG, PNG)</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={slideUp} initial="initial" animate="animate" custom={3}>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-foreground">Visibility & Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Publish to Store</Label>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Enable for customers to see it</p>
                  </div>
                  <Switch
                    checked={formData.publish}
                    onCheckedChange={(val) => setFormData({ ...formData, publish: val })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Mark as Popular</Label>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Show in the "Trending" section</p>
                  </div>
                  <Switch
                    checked={formData.popular}
                    onCheckedChange={(val) => setFormData({ ...formData, popular: val })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Deal of the Day</Label>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Show in flash sales</p>
                  </div>
                  <Switch
                    checked={formData.dealOfDay}
                    onCheckedChange={(val) => setFormData({ ...formData, dealOfDay: val })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="pt-6 border-t border-border flex items-center justify-end"
      >
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 px-10 h-14 text-lg font-bold rounded-2xl"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <RefreshCw className="w-6 h-6 mr-3 animate-spin" /> : <Save className="w-6 h-6 mr-3" />}
          {id ? "Save All Changes" : "Create Product Now"}
        </Button>
      </motion.div>
    </div>
  );
}
