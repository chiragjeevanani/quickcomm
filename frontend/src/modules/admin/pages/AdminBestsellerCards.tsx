import { useState, useEffect } from "react";
import {
    getBestsellerCards,
    createBestsellerCard,
    updateBestsellerCard,
    deleteBestsellerCard,
    type BestsellerCard,
    type BestsellerCardFormData,
} from "../../../services/api/admin/adminBestsellerCardService";
import { getCategories, type Category } from "../../../services/api/categoryService";

// UI Components
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Icons
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Save,
    Star,
    AlertCircle,
    Info,
    RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";

const MAX_ACTIVE_CARDS = 6;

export default function AdminBestsellerCards() {
    // Form state
    const [name, setName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [order, setOrder] = useState<number | undefined>(undefined);
    const [isActive, setIsActive] = useState(true);

    // Data state
    const [cards, setCards] = useState<BestsellerCard[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingCards, setLoadingCards] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pagination
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch initial data
    useEffect(() => {
        fetchCards();
        fetchCategories();
    }, []);

    const fetchCards = async () => {
        try {
            setLoadingCards(true);
            const response = await getBestsellerCards();
            if (response.success && Array.isArray(response.data)) {
                setCards(response.data);
            }
        } catch (err) {
            console.error("Error fetching bestseller cards:", err);
            toast.error("Failed to load bestseller cards");
        } finally {
            setLoadingCards(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            if (response.success) {
                // Filter only root categories (no parentId)
                const rootCategories = response.data.filter((cat) => !cat.parentId);
                setCategories(rootCategories);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!name.trim()) {
            toast.error("Please enter a card name");
            return;
        }
        if (!selectedCategory) {
            toast.error("Please select a category");
            return;
        }

        // Check max active cards limit
        if (isActive && !editingId) {
            const activeCardsCount = cards.filter((c) => c.isActive).length;
            if (activeCardsCount >= MAX_ACTIVE_CARDS) {
                toast.error(`Maximum ${MAX_ACTIVE_CARDS} active bestseller cards allowed`);
                return;
            }
        }

        // Check if trying to activate and already at max
        if (isActive && editingId) {
            const card = cards.find((c) => c._id === editingId);
            if (card && !card.isActive) {
                const activeCardsCount = cards.filter((c) => c.isActive).length;
                if (activeCardsCount >= MAX_ACTIVE_CARDS) {
                    toast.error(`Maximum ${MAX_ACTIVE_CARDS} active bestseller cards allowed`);
                    return;
                }
            }
        }

        const formData: BestsellerCardFormData = {
            name: name.trim(),
            category: selectedCategory,
            order: order !== undefined ? order : undefined,
            isActive,
        };

        try {
            setLoading(true);

            if (editingId) {
                const response = await updateBestsellerCard(editingId, formData);
                if (response.success) {
                    toast.success("Bestseller card updated successfully!");
                    resetForm();
                    fetchCards();
                } else {
                    toast.error(response.message || "Failed to update card");
                }
            } else {
                const response = await createBestsellerCard(formData);
                if (response.success) {
                    toast.success("Bestseller card created successfully!");
                    resetForm();
                    fetchCards();
                } else {
                    toast.error(response.message || "Failed to create card");
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save bestseller card");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (card: BestsellerCard) => {
        setName(card.name);
        setSelectedCategory(
            typeof card.category === "string" ? card.category : card.category._id
        );
        setOrder(card.order);
        setIsActive(card.isActive);
        setEditingId(card._id);

        // Scroll to form
        const formElement = document.getElementById("card-form");
        if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this bestseller card?")) {
            return;
        }

        try {
            const response = await deleteBestsellerCard(id);
            if (response.success) {
                toast.success("Bestseller card deleted successfully!");
                fetchCards();
                if (editingId === id) {
                    resetForm();
                }
            } else {
                toast.error(response.message || "Failed to delete card");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete bestseller card");
        }
    };

    const resetForm = () => {
        setName("");
        setSelectedCategory("");
        setOrder(undefined);
        setIsActive(true);
        setEditingId(null);
    };

    // Filtered cards
    const filteredCards = cards.filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredCards.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedCards = filteredCards.slice(startIndex, endIndex);

    const activeCardsCount = cards.filter((c) => c.isActive).length;

    // Columns for DataTable
    const columns = [
        {
            header: "Order",
            accessorKey: "order",
            cell: (item: BestsellerCard) => (
                <span className="font-mono text-xs">{item.order || '-'}</span>
            )
        },
        {
            header: "Name",
            accessorKey: "name",
            cell: (item: BestsellerCard) => (
                <span className="font-medium">{item.name}</span>
            )
        },
        {
            header: "Category",
            accessorKey: "category",
            cell: (item: BestsellerCard) => (
                <span className="text-sm">
                    {typeof item.category === "string"
                        ? item.category
                        : item.category?.name || "Unknown"}
                </span>
            )
        },
        {
            header: "Status",
            accessorKey: "isActive",
            cell: (item: BestsellerCard) => (
                <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Active" : "Inactive"}
                </Badge>
            )
        },
        {
            header: "Actions",
            accessorKey: "_id",
            cell: (item: BestsellerCard) => (
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
                title="Bestseller Cards"
                description="Manage highlighted bestseller categories on home page"
            >
                <Button variant="outline" size="sm" onClick={fetchCards}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingCards ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </PageHeader>

            <Alert className="bg-primary/5 border-primary/20 text-primary">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">
                    Active cards: <span className="font-bold">{activeCardsCount}</span> / {MAX_ACTIVE_CARDS} (Maximum allowed)
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Sidebar: Add/Edit Form */}
                <Card className="lg:col-span-1 h-fit border-border shadow-sm" id="card-form">
                    <CardHeader className="bg-muted/50 border-b border-border pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            {editingId ? (
                                <>
                                    <Edit2 className="h-4 w-4 text-primary" /> Edit Card
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 text-primary" /> Add Bestseller Card
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Card Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Fresh Vegetables"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Category <span className="text-destructive">*</span></Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-start gap-1.5 mt-1.5">
                                    <Info className="h-3 w-3 text-muted-foreground mt-0.5" />
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                        4 product images will be automatically fetched from this category
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={order !== undefined ? order : ""}
                                    onChange={(e) => setOrder(e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Auto-assign"
                                    min="0"
                                />
                                <p className="text-[10px] text-muted-foreground text-right">
                                    Leave empty to auto-assign
                                </p>
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

                {/* Right Section: View Cards Table */}
                <Card className="lg:col-span-2 border-border shadow-sm flex flex-col">
                    <CardHeader className="bg-muted/50 border-b border-border py-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Star className="h-4 w-4 text-primary" /> Existing Cards
                            </CardTitle>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search cards..."
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
                                columns={columns}
                                data={displayedCards}
                                loading={loadingCards}
                                emptyMessage="No bestseller cards found."
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
