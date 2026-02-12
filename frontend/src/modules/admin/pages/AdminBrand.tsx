import { useState, useEffect } from "react";
import { uploadImage } from "../../../services/api/uploadService";
import { validateImageFile, createImagePreview } from "../../../utils/imageUpload";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  type Brand,
} from "../../../services/api/admin/adminProductService";
import { useAuth } from "../../../context/AuthContext";

// UI Components
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Icons
import {
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Save,
  X,
  Upload,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminBrand() {
  const { isAuthenticated, token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandImageFile, setBrandImageFile] = useState<File | null>(null);
  const [brandImagePreview, setBrandImagePreview] = useState<string>("");
  const [brandImageUrl, setBrandImageUrl] = useState<string>("");

  // Pagination & Filtering
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // States
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch brands
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await getBrands({ search: searchTerm });
        if (response.success) {
          setBrands(response.data);
        }
      } catch (err: any) {
        console.error("Error fetching brands:", err);
        toast.error(err.response?.data?.message || "Failed to load brands");
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [isAuthenticated, token, searchTerm]);

  // Derived state for pagination
  const totalPages = Math.ceil(brands.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedBrands = brands.slice(startIndex, endIndex);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image file");
      return;
    }

    setBrandImageFile(file);

    try {
      const preview = await createImagePreview(file);
      setBrandImagePreview(preview);
    } catch (error) {
      toast.error("Failed to create image preview");
    }
  };

  const handleAddBrand = async () => {
    if (!brandName.trim()) {
      toast.error("Please enter a brand name");
      return;
    }
    if (!brandImageFile && !editingId && !brandImageUrl) {
      toast.error("Brand image is required");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = brandImageUrl;

      // Upload brand image if a new file is selected
      if (brandImageFile) {
        const imageResult = await uploadImage(brandImageFile, "dhakadsnazzy/brands");
        imageUrl = imageResult.secureUrl;
      }

      const brandData = {
        name: brandName.trim(),
        image: imageUrl,
      };

      if (editingId) {
        // Update existing brand
        const response = await updateBrand(editingId, brandData);
        if (response.success) {
          setBrands((prev) =>
            prev.map((brand) =>
              brand._id === editingId ? response.data : brand
            )
          );
          toast.success("Brand updated successfully!");
          resetForm();
        }
      } else {
        // Create new brand
        const response = await createBrand(brandData);
        if (response.success) {
          setBrands((prev) => [...prev, response.data]);
          toast.success("Brand added successfully!");
          resetForm();
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save brand. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setBrandName("");
    setBrandImageFile(null);
    setBrandImagePreview("");
    setBrandImageUrl("");
  };

  const handleEdit = (id: string) => {
    const brand = brands.find((b) => b._id === id);
    if (brand) {
      setEditingId(id);
      setBrandName(brand.name);
      setBrandImageUrl(brand.image || "");
      setBrandImagePreview(""); // clear any new file preview
      setBrandImageFile(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;

    try {
      const response = await deleteBrand(id);
      if (response.success) {
        setBrands((prev) => prev.filter((brand) => brand._id !== id));
        toast.success("Brand deleted successfully");
        if (editingId === id) resetForm();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete brand."
      );
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Brand Name", "Image URL"];
    const csvContent = [
      headers.join(","),
      ...brands.map((brand) =>
        [
          brand._id.slice(-6),
          `"${brand.name}"`,
          `"${brand.image || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `brands_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define columns for DataTable
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
      cell: (item: Brand) => (
        <span className="font-mono text-xs text-muted-foreground">
          {item._id.slice(-6).toUpperCase()}
        </span>
      )
    },
    {
      header: "Brand Image",
      accessorKey: "image",
      cell: (item: Brand) => (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted/30">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Img';
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      )
    },
    {
      header: "Brand Name",
      accessorKey: "name",
      cell: (item: Brand) => (
        <span className="font-medium text-sm">{item.name}</span>
      )
    },
    {
      header: "Actions",
      accessorKey: "_id",
      cell: (item: Brand) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleEdit(item._id)}
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDelete(item._id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Brand Management"
        description="Create and manage product brands"
      >
        <div className="text-sm text-muted-foreground">
          Total Brands: <span className="font-bold text-foreground">{brands.length}</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Add/Edit Form */}
        <Card className="lg:col-span-1 h-fit border-border shadow-sm">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-4 w-4 text-primary" /> Edit Brand
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-primary" /> Add New Brand
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Ex. Nike, Adidas"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Image</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer border-muted-foreground/25 hover:border-primary/50'
                  }`}
              >
                <input
                  type="file"
                  id="brandImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="brandImage" className="cursor-pointer w-full h-full block">
                  {brandImagePreview ? (
                    <div className="relative">
                      <img
                        src={brandImagePreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg object-contain shadow-sm"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          setBrandImageFile(null);
                          setBrandImagePreview("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : brandImageUrl ? (
                    <div className="relative">
                      <img
                        src={brandImageUrl}
                        alt="Current"
                        className="max-h-40 mx-auto rounded-lg object-contain shadow-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Current Image</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs h-7"
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="text-sm font-medium">Click to upload</div>
                      <p className="text-xs text-muted-foreground">
                        SVG, PNG, JPG or GIF (max. 5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddBrand}
                disabled={uploading}
                className="flex-1 font-bold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> {editingId ? "Update Brand" : "Save Brand"}
                  </>
                )}
              </Button>

              {editingId && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - List */}
        <Card className="lg:col-span-2 border-border shadow-sm flex flex-col">
          <CardHeader className="bg-muted/50 border-b border-border py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" /> Brand List
              </CardTitle>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search brands..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExport} title="Export CSV">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="p-4">
              <DataTable
                columns={columns}
                data={displayedBrands}
                loading={loading}
                emptyMessage="No brands found. Try adjusting your search."
              />
            </div>
          </CardContent>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Show</span>
              <Select
                value={entriesPerPage.toString()}
                onValueChange={(val) => {
                  setEntriesPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline-block mr-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Previous</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <span className="sr-only">Next</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64952 10.6151 7.84184L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49986L6.1356 3.84184C5.94673 3.64038 5.95694 3.32395 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
