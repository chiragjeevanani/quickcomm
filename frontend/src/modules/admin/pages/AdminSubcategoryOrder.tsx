import { useState, useEffect } from "react";
import {
    getCategories,
    getSubCategories,
    updateSubCategoryOrder,
    type Category,
    type SubCategory,
} from "../../../services/api/admin/adminProductService";

// UI Components
import PageHeader from "../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Icons
import {
    GripVertical,
    ArrowUpDown,
    Save,
    RotateCcw,
    Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminSubcategoryOrder() {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);

    // Subcategories state
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [originalOrder, setOriginalOrder] = useState<SubCategory[]>([]);

    // UI state
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await getCategories();
            if (response.success && Array.isArray(response.data)) {
                // Filter helpful categories (e.g. only those with subcategories? 
                // Or just show all and let user discover empty ones)
                // Filter only root categories (no parentId)
                const rootCategories = response.data.filter((cat) => !cat.parentId);
                setCategories(rootCategories);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            toast.error("Failed to load categories");
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleCategoryChange = async (categoryId: string) => {
        setSelectedCategory(categoryId);
        if (categoryId) {
            setLoadingSubcategories(true);
            try {
                const response = await getSubCategories({ category: categoryId, sortBy: 'order', sortOrder: 'asc' });
                if (response.success && Array.isArray(response.data)) {
                    setSubcategories(response.data);
                    setOriginalOrder([...response.data]);
                } else {
                    setSubcategories([]);
                    setOriginalOrder([]);
                }
            } catch (err) {
                console.error("Error fetching subcategories:", err);
                toast.error("Failed to load subcategories");
                setSubcategories([]);
                setOriginalOrder([]);
            } finally {
                setLoadingSubcategories(false);
            }
        } else {
            setSubcategories([]);
            setOriginalOrder([]);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
        // Improved ghost image handling could be added here

        // Firefox requires setData
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedItem === null) return;

        // If dropped on the same item, do nothing
        if (draggedItem === dropIndex) {
            setDraggedItem(null);
            return;
        }

        const newSubcategories = [...subcategories];
        const draggedSubcategory = newSubcategories[draggedItem];

        // Remove dragged item
        newSubcategories.splice(draggedItem, 1);

        // Insert at new position
        newSubcategories.splice(dropIndex, 0, draggedSubcategory);

        // Update order numbers temporarily for display (optional, but good visual feedback)
        // Note: The actual order update happens on Save
        const reorderedSubcategories = newSubcategories.map((subcategory, index) => ({
            ...subcategory,
            order: index + 1,
        }));

        setSubcategories(reorderedSubcategories);
        setDraggedItem(null);
    };

    const handleUpdateOrder = async () => {
        if (!selectedCategory) {
            toast.error('Please select a category');
            return;
        }

        if (subcategories.length === 0) {
            toast.error('No subcategories to update');
            return;
        }

        try {
            setSaving(true);

            // Prepare data for API
            // Map subcategories to { id, order }
            const reorderData = {
                subcategories: subcategories.map((sub, index) => ({
                    id: sub._id,
                    order: index + 1 // 1-based order
                }))
            };

            const response = await updateSubCategoryOrder(reorderData);

            if (response.success) {
                toast.success('Subcategory order updated successfully!');
                setOriginalOrder([...subcategories]); // Update original state to match current
            } else {
                toast.error('Failed to update order');
            }
        } catch (err: any) {
            console.error("Error updating order:", err);
            toast.error(err.response?.data?.message || 'Failed to update order');
        } finally {
            setSaving(false);
        }
    };

    const handleResetOrder = () => {
        if (originalOrder.length > 0) {
            setSubcategories([...originalOrder]);
            toast.success('Order reset to original (unsaved)');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Subcategory Ordering"
                description="Rearrange display order of subcategories within parent categories"
            />

            <div className="max-w-2xl mx-auto">
                <Card className="border-border shadow-sm">
                    <CardHeader className="bg-muted/50 border-b border-border pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-primary" /> Reorder Subcategories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {/* Category Selection */}
                        <div className="space-y-4 mb-8">
                            <Label>Select Category</Label>
                            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Choose a parent category..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category._id} value={category._id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subcategory List */}
                        <div className="space-y-4">
                            {selectedCategory && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-bold tracking-wider px-2">
                                    <span>Subcategory & Order</span>
                                    <span>Drag to Reorder</span>
                                </div>
                            )}

                            {loadingSubcategories ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                                    <div className="text-muted-foreground text-sm font-medium">Loading subcategories...</div>
                                </div>
                            ) : subcategories.length > 0 ? (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                    {subcategories.map((subcategory, index) => (
                                        <div
                                            key={subcategory._id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={`
                                                group flex items-center justify-between p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing
                                                ${draggedItem === index
                                                    ? 'opacity-40 border-dashed border-primary bg-primary/5'
                                                    : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-muted/80 text-muted-foreground w-8 h-8 flex items-center justify-center rounded-md font-mono text-sm font-bold">
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium text-sm">{subcategory.name}</span>
                                            </div>

                                            <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            ) : selectedCategory ? (
                                <div className="py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                                    <div className="text-muted-foreground text-sm font-medium">No subcategories found for this category</div>
                                </div>
                            ) : (
                                <div className="py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                                    <ArrowUpDown className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                    <div className="text-muted-foreground text-sm font-medium">Please select a category to start reordering</div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {subcategories.length > 0 && (
                            <div className="flex gap-3 pt-6 mt-6 border-t border-border">
                                <Button
                                    onClick={handleUpdateOrder}
                                    className="flex-1 font-bold"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save New Order
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleResetOrder}
                                    className="flex-1"
                                    disabled={saving}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
