import { useState, useEffect } from "react";
import { uploadImage } from "../../../services/api/uploadService";
import {
  validateImageFile,
  createImagePreview,
} from "../../../utils/imageUpload";
import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getCategories,
  type SubCategory,
  type Category,
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
  FolderTree
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminSubCategory() {
  const { isAuthenticated, token } = useAuth();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryImageFile, setSubcategoryImageFile] = useState<File | null>(
    null
  );
  const [subcategoryImagePreview, setSubcategoryImagePreview] =
    useState<string>("");
  const [subcategoryImageUrl, setSubcategoryImageUrl] = useState<string>("");

  // Pagination
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // States
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch categories and subcategories on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories for dropdown
        const categoriesResponse = await getCategories();
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }

        // Fetch subcategories
        const params: any = { search: searchTerm };
        if (selectedCategory) {
          params.category = selectedCategory;
        }

        const response = await getSubCategories(params);
        if (response.success) {
          setSubCategories(response.data);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        toast.error(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token, searchTerm, selectedCategory]);

  // Derived state for pagination
  const totalPages = Math.ceil(subCategories.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedSubCategories = subCategories.slice(startIndex, endIndex);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image file");
      return;
    }

    setSubcategoryImageFile(file);

    try {
      const preview = await createImagePreview(file);
      setSubcategoryImagePreview(preview);
    } catch (error) {
      toast.error("Failed to create image preview");
    }
  };

  const handleAddSubCategory = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!subcategoryName.trim()) {
      toast.error("Please enter a subcategory name");
      return;
    }
    if (!subcategoryImageFile && !editingId && !subcategoryImageUrl) {
      toast.error("Subcategory image is required");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = subcategoryImageUrl;

      // Upload subcategory image if a new file is selected
      if (subcategoryImageFile) {
        const imageResult = await uploadImage(
          subcategoryImageFile,
          "dhakadsnazzy/subcategories"
        );
        imageUrl = imageResult.secureUrl;
      }

      const subCategoryData = {
        name: subcategoryName.trim(),
        category: selectedCategory,
        image: imageUrl,
      };

      if (editingId) {
        // Update existing subcategory
        const response = await updateSubCategory(editingId, subCategoryData);
        if (response.success) {
          setSubCategories((prev) =>
            prev.map((sub) => (sub._id === editingId ? response.data : sub))
          );
          toast.success("SubCategory updated successfully!");
          resetForm();
        }
      } else {
        // Create new subcategory
        const response = await createSubCategory(subCategoryData);
        if (response.success) {
          setSubCategories((prev) => [...prev, response.data]);
          toast.success("SubCategory added successfully!");
          resetForm();
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save subcategory"
      );
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedCategory("");
    setSubcategoryName("");
    setSubcategoryImageFile(null);
    setSubcategoryImagePreview("");
    setSubcategoryImageUrl("");
  };

  const handleEdit = (id: string) => {
    const subCategory = subCategories.find((cat) => cat._id === id);
    if (subCategory) {
      setEditingId(id);
      const categoryId =
        typeof subCategory.category === "object"
          ? subCategory.category._id
          : subCategory.category;
      setSelectedCategory(categoryId);
      setSubcategoryName(subCategory.name);
      setSubcategoryImageUrl(subCategory.image || "");
      setSubcategoryImageFile(null);
      setSubcategoryImagePreview("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subcategory?")) return;

    try {
      const response = await deleteSubCategory(id);
      if (response.success) {
        setSubCategories((prev) => prev.filter((sub) => sub._id !== id));
        toast.success("SubCategory deleted successfully!");
        if (editingId === id) resetForm();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete subcategory"
      );
    }
  };

  const handleExport = () => {
    toast.error("Export functionality will be implemented here");
  };

  // Define columns for DataTable
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
      cell: (item: SubCategory) => (
        <span className="font-mono text-xs text-muted-foreground">
          {item._id.slice(-6).toUpperCase()}
        </span>
      )
    },
    {
      header: "Parent Category",
      accessorKey: "category",
      cell: (item: SubCategory) => {
        const categoryName = typeof item.category === "object"
          ? item.category.name
          : categories.find((c) => c._id === item.category)?.name || "Unknown";
        return (
          <span className="font-medium text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {categoryName}
          </span>
        );
      }
    },
    {
      header: "SubCat Image",
      accessorKey: "image",
      cell: (item: SubCategory) => (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted/30">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
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
      header: "SubCategory Name",
      accessorKey: "name",
      cell: (item: SubCategory) => (
        <span className="font-medium text-sm">{item.name}</span>
      )
    },
    {
      header: "Products",
      accessorKey: "totalProduct",
      cell: (item: SubCategory) => (
        <span className="font-medium text-sm">{item.totalProduct || 0}</span>
      )
    },
    {
      header: "Actions",
      accessorKey: "_id",
      cell: (item: SubCategory) => (
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
        title="SubCategories"
        description="Manage product subcategories"
      >
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-bold text-foreground">{subCategories.length}</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Add/Edit Form */}
        <Card className="lg:col-span-1 h-fit border-border shadow-sm">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-4 w-4 text-primary" /> Edit SubCategory
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-primary" /> Add SubCategory
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subName">SubCategory Name</Label>
              <Input
                id="subName"
                placeholder="Ex. Running Shoes"
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label>SubCategory Image</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer border-muted-foreground/25 hover:border-primary/50'
                  }`}
              >
                <input
                  type="file"
                  id="subCatImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="subCatImage" className="cursor-pointer w-full h-full block">
                  {subcategoryImagePreview ? (
                    <div className="relative">
                      <img
                        src={subcategoryImagePreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg object-cover shadow-sm"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          setSubcategoryImageFile(null);
                          setSubcategoryImagePreview("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : subcategoryImageUrl ? (
                    <div className="relative">
                      <img
                        src={subcategoryImageUrl}
                        alt="Current"
                        className="max-h-40 mx-auto rounded-lg object-cover shadow-sm"
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
                onClick={handleAddSubCategory}
                disabled={uploading}
                className="flex-1 font-bold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Save"}
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
                <FolderTree className="h-4 w-4 text-primary" /> SubCategory List
              </CardTitle>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subcategories..."
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
                data={displayedSubCategories}
                loading={loading}
                emptyMessage="No subcategories found. Try adjusting your search."
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
