import { useState, useEffect } from "react";
import {
    getHomeSections,
    createHomeSection,
    updateHomeSection,
    deleteHomeSection,
    type HomeSection,
    type HomeSectionFormData,
} from "../../../services/api/admin/adminHomeSectionService";
import { getCategories, getSubcategories, type Category, type SubCategory } from "../../../services/api/categoryService";
import { getHeaderCategoriesAdmin, type HeaderCategory } from "../../../services/api/headerCategoryService";

// UI Components
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Icons
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Save,
    LayoutTemplate,
    RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";

const DISPLAY_TYPE_OPTIONS = [
    { value: "subcategories", label: "Subcategories" },
    { value: "products", label: "Products" },
    { value: "categories", label: "Categories" },
];

const COLUMNS_OPTIONS = [2, 3, 4, 6, 8];

export default function AdminHomeSection() {
    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [selectedHeaderCategory, setSelectedHeaderCategory] = useState<string>("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
    const [displayType, setDisplayType] = useState<"subcategories" | "products" | "categories">("subcategories");
    const [columns, setColumns] = useState(4);
    const [limit, setLimit] = useState(8);
    const [isActive, setIsActive] = useState(true);

    // Data state
    const [sections, setSections] = useState<HomeSection[]>([]);
    const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingSections, setLoadingSections] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pagination
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch initial data
    useEffect(() => {
        fetchSections();
        fetchHeaderCategories();
        fetchCategories();
    }, []);

    // Filter categories by header category when header category or display type changes
    useEffect(() => {
        if (displayType === "categories" && selectedHeaderCategory) {
            const filtered = categories.filter((cat) => {
                const headerId = typeof cat.headerCategoryId === 'string'
                    ? cat.headerCategoryId
                    : cat.headerCategoryId?._id || cat.headerCategoryId;
                return headerId === selectedHeaderCategory && !cat.parentId; // Only root categories
            });
            setFilteredCategories(filtered);
            // Clear selected categories if they don't belong to the new header category
            setSelectedCategories((prev) =>
                prev.filter((id) => filtered.some((cat) => cat._id === id))
            );
        } else {
            // For other display types, show all root categories
            setFilteredCategories(categories.filter((cat) => !cat.parentId));
        }
    }, [selectedHeaderCategory, displayType, categories]);

    // When editing and categories are loaded, try to set header category from selected categories
    useEffect(() => {
        if (editingId && displayType === "categories" && selectedCategories.length > 0 && categories.length > 0 && !selectedHeaderCategory) {
            const firstSelectedCategory = categories.find(c => selectedCategories.includes(c._id));
            if (firstSelectedCategory) {
                const headerId = typeof firstSelectedCategory.headerCategoryId === 'string'
                    ? firstSelectedCategory.headerCategoryId
                    : firstSelectedCategory.headerCategoryId?._id || firstSelectedCategory.headerCategoryId;
                if (headerId) {
                    setSelectedHeaderCategory(headerId);
                }
            }
        }
    }, [editingId, displayType, selectedCategories, categories, selectedHeaderCategory]);

    // Fetch subcategories when category changes (only for subcategories display type)
    useEffect(() => {
        if (displayType === "subcategories" && selectedCategories.length > 0) {
            fetchSubCategories(selectedCategories);
        } else {
            setSubCategories([]);
            setSelectedSubCategories([]);
        }
    }, [selectedCategories, displayType]);

    // Auto-generate slug from title
    useEffect(() => {
        if (title && !editingId) {
            const generatedSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            setSlug(generatedSlug);
        }
    }, [title, editingId]);

    const fetchSections = async () => {
        try {
            setLoadingSections(true);
            const response = await getHomeSections();
            if (response.success && Array.isArray(response.data)) {
                setSections(response.data);
            }
        } catch (err) {
            console.error("Error fetching sections:", err);
            toast.error("Failed to load sections");
        } finally {
            setLoadingSections(false);
        }
    };

    const fetchHeaderCategories = async () => {
        try {
            const data = await getHeaderCategoriesAdmin();
            setHeaderCategories(data);
        } catch (err) {
            console.error("Error fetching header categories:", err);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchSubCategories = async (categoryIds: string[]) => {
        try {
            const promises = categoryIds.map((id) => getSubcategories(id));
            const results = await Promise.all(promises);
            const allSubs: SubCategory[] = [];

            results.forEach((response) => {
                if (response.success && response.data) {
                    allSubs.push(...response.data);
                }
            });

            // Remove duplicates based on ID
            const uniqueSubs = Array.from(new Map(allSubs.map((item) => [item._id || item.id, item])).values());
            setSubCategories(uniqueSubs as SubCategory[]);
        } catch (err) {
            console.error("Error fetching subcategories:", err);
            setSubCategories([]);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            toast.error("Please enter a section title");
            return;
        }
        if (!slug.trim()) {
            toast.error("Please enter a slug");
            return;
        }
        if (displayType === "categories") {
            if (!selectedHeaderCategory) {
                toast.error("Please select a header category");
                return;
            }
            if (selectedCategories.length === 0) {
                toast.error("Please select at least one category");
                return;
            }
        }

        const formData: HomeSectionFormData = {
            title: title.trim(),
            slug: slug.trim(),
            categories: selectedCategories.length > 0 ? selectedCategories : undefined,
            // Only include subcategories if displayType is not "categories"
            subCategories: displayType !== "categories" && selectedSubCategories.length > 0 ? selectedSubCategories : undefined,
            displayType,
            columns,
            limit,
            isActive,
        };

        try {
            setLoading(true);

            if (editingId) {
                const response = await updateHomeSection(editingId, formData);
                if (response.success) {
                    toast.success("Section updated successfully!");
                    resetForm();
                    fetchSections();
                }
            } else {
                const response = await createHomeSection(formData);
                if (response.success) {
                    toast.success("Section created successfully!");
                    resetForm();
                    fetchSections();
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save section");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (section: HomeSection) => {
        setTitle(section.title);
        setSlug(section.slug);
        setDisplayType(section.displayType);

        // Try to determine header category from selected categories (only if displayType is "categories")
        if (section.displayType === "categories") {
            const firstCategory = section.categories?.[0];
            if (firstCategory) {
                const category = categories.find(c => c._id === firstCategory._id);
                if (category) {
                    const headerId = typeof category.headerCategoryId === 'string'
                        ? category.headerCategoryId
                        : category.headerCategoryId?._id || category.headerCategoryId;
                    if (headerId) {
                        setSelectedHeaderCategory(headerId);
                    }
                } else {
                    setSelectedHeaderCategory("");
                }
            } else {
                setSelectedHeaderCategory("");
            }
        } else {
            setSelectedHeaderCategory("");
        }

        setSelectedCategories(section.categories?.map(c => c._id) || []);
        setSelectedSubCategories(section.subCategories?.map(s => s._id) || []);
        setColumns(section.columns);
        setLimit(section.limit);
        setIsActive(section.isActive);
        setEditingId(section._id);

        // Scroll to form
        const formElement = document.getElementById("section-form");
        if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this section?")) {
            return;
        }

        try {
            const response = await deleteHomeSection(id);
            if (response.success) {
                toast.success("Section deleted successfully!");
                fetchSections();
                if (editingId === id) {
                    resetForm();
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete section");
        }
    };

    const resetForm = () => {
        setTitle("");
        setSlug("");
        setSelectedHeaderCategory("");
        setSelectedCategories([]);
        setSelectedSubCategories([]);
        setDisplayType("subcategories");
        setColumns(4);
        setLimit(8);
        setIsActive(true);
        setEditingId(null);
    };

    // Filtered sections for search
    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredSections.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedSections = filteredSections.slice(startIndex, endIndex);

    // Columns for DataTable
    const columnsDef = [
        {
            header: "Order",
            accessorKey: "order",
            cell: (item: HomeSection) => (
                <span className="font-mono text-xs">{item.order || '-'}</span>
            )
        },
        {
            header: "Title",
            accessorKey: "title",
            cell: (item: HomeSection) => (
                <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.slug}</span>
                </div>
            )
        },
        {
            header: "Type",
            accessorKey: "displayType",
            cell: (item: HomeSection) => (
                <Badge variant="outline" className="capitalize">{item.displayType}</Badge>
            )
        },
        {
            header: "Categories",
            accessorKey: "categories",
            cell: (item: HomeSection) => (
                <span className="text-xs max-w-[200px] truncate block" title={item.categories?.map((c: any) => c.name).join(", ")}>
                    {item.categories && item.categories.length > 0
                        ? item.categories.map((c: any) => c.name).join(", ")
                        : "All"}
                </span>
            )
        },
        {
            header: "Columns",
            accessorKey: "columns",
            cell: (item: HomeSection) => (
                <span className="text-xs">{item.columns}</span>
            )
        },
        {
            header: "Status",
            accessorKey: "isActive",
            cell: (item: HomeSection) => (
                <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Active" : "Inactive"}
                </Badge>
            )
        },
        {
            header: "Actions",
            accessorKey: "_id",
            cell: (item: HomeSection) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEdit(item)}
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
                title="Home Sections"
                description="Manage content sections on the home page"
            >
                <Button variant="outline" size="sm" onClick={fetchSections}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingSections ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Sidebar: Add/Edit Form */}
                <Card className="lg:col-span-1 h-fit border-border shadow-sm" id="section-form">
                    <CardHeader className="bg-muted/50 border-b border-border pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            {editingId ? (
                                <>
                                    <Edit2 className="h-4 w-4 text-primary" /> Edit Section
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 text-primary" /> Add New Section
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Section Title <span className="text-destructive">*</span></Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Grocery & Kitchen"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="grocery-kitchen"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    URL-friendly identifier
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Display Type <span className="text-destructive">*</span></Label>
                                <Select
                                    value={displayType}
                                    onValueChange={(val: any) => {
                                        setDisplayType(val);
                                        if (val === "categories") {
                                            setSelectedSubCategories([]);
                                        } else {
                                            setSelectedHeaderCategory("");
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DISPLAY_TYPE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {displayType === "categories" && (
                                <div className="space-y-2">
                                    <Label>Header Category <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={selectedHeaderCategory}
                                        onValueChange={(val) => {
                                            setSelectedHeaderCategory(val);
                                            setSelectedCategories([]);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Header Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {headerCategories
                                                .filter((hc) => hc.status === "Published")
                                                .map((hc) => (
                                                    <SelectItem key={hc._id} value={hc._id}>
                                                        {hc.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>
                                    Categories {displayType === "categories" && <span className="text-destructive">*</span>}
                                </Label>
                                <div className={`border rounded-md max-h-40 overflow-y-auto p-2 bg-muted/20 ${displayType === "categories" && !selectedHeaderCategory ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {displayType === "categories" && !selectedHeaderCategory ? (
                                        <p className="text-xs text-muted-foreground p-1">Select a header category first</p>
                                    ) : filteredCategories.length === 0 ? (
                                        <p className="text-xs text-muted-foreground p-1">No categories available</p>
                                    ) : (
                                        filteredCategories.map((cat) => (
                                            <div key={cat._id} className="flex items-center space-x-2 py-1">
                                                <Checkbox
                                                    id={`cat-${cat._id}`}
                                                    checked={selectedCategories.includes(cat._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedCategories([...selectedCategories, cat._id]);
                                                        } else {
                                                            setSelectedCategories(selectedCategories.filter((id) => id !== cat._id));
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`cat-${cat._id}`}
                                                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {cat.name}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground text-right">{selectedCategories.length} selected</p>
                            </div>

                            {displayType !== "categories" && (
                                <div className="space-y-2">
                                    <Label>SubCategories</Label>
                                    <div className={`border rounded-md max-h-40 overflow-y-auto p-2 bg-muted/20 ${selectedCategories.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {selectedCategories.length === 0 ? (
                                            <p className="text-xs text-muted-foreground p-1">Select categories first</p>
                                        ) : subCategories.length === 0 ? (
                                            <p className="text-xs text-muted-foreground p-1">No subcategories available</p>
                                        ) : (
                                            subCategories.map((sub) => (
                                                <div key={sub._id || sub.id} className="flex items-center space-x-2 py-1">
                                                    <Checkbox
                                                        id={`sub-${sub._id || sub.id}`}
                                                        checked={selectedSubCategories.includes(sub._id || sub.id || '')}
                                                        onCheckedChange={(checked) => {
                                                            const subId = sub._id || sub.id || '';
                                                            if (checked) {
                                                                setSelectedSubCategories([...selectedSubCategories, subId]);
                                                            } else {
                                                                setSelectedSubCategories(selectedSubCategories.filter((id) => id !== subId));
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`sub-${sub._id || sub.id}`}
                                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {sub.subcategoryName}
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground text-right">{selectedSubCategories.length} selected</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Columns</Label>
                                    <Select value={columns.toString()} onValueChange={(val) => setColumns(Number(val))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLUMNS_OPTIONS.map((col) => (
                                                <SelectItem key={col} value={col.toString()}>
                                                    {col} Columns
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Limit</Label>
                                    <Input
                                        type="number"
                                        value={limit}
                                        onChange={(e) => setLimit(Number(e.target.value))}
                                        min="1"
                                        max="50"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                                <Label htmlFor="active-mode" className="cursor-pointer">Active Status</Label>
                                <Switch
                                    id="active-mode"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 font-bold"
                            >
                                {loading ? (
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
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Section: View Sections Table */}
                <Card className="lg:col-span-2 border-border shadow-sm flex flex-col">
                    <CardHeader className="bg-muted/50 border-b border-border py-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <LayoutTemplate className="h-4 w-4 text-primary" /> Existing Sections
                            </CardTitle>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search sections..."
                                        className="pl-9 h-9"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="p-4">
                            <DataTable
                                columns={columnsDef}
                                data={displayedSections}
                                loading={loadingSections}
                                emptyMessage="No home sections found."
                            />
                        </div>
                    </CardContent>

                    {/* Pagination Footer */}
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Show</span>
                            <Select
                                value={rowsPerPage.toString()}
                                onValueChange={(val) => {
                                    setRowsPerPage(Number(val));
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
