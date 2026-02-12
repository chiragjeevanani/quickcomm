import { useState, useEffect, useMemo } from "react";
import {
  FolderTree,
  List,
  Search,
  Plus,
  Trash2,
  Download,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderPlus,
  Eye,
  Settings2
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  bulkDeleteCategories,
  type Category,
  type CreateCategoryData,
  type UpdateCategoryData,
} from "../../../services/api/admin/adminProductService";
import { useAuth } from "../../../context/AuthContext";
import CategoryFormModal from "../components/CategoryFormModal";
import CategoryTreeView from "../components/CategoryTreeView";
import CategoryListView from "../components/CategoryListView";
import {
  buildCategoryTree,
  searchCategories,
  filterCategoriesByStatus,
} from "../../../utils/categoryUtils";
import PageHeader from "../components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "../../../context/ToastContext";

const flattenTree = (cats: Category[]): Category[] => {
  const result: Category[] = [];
  cats.forEach((cat) => {
    const { children, ...catWithoutChildren } = cat;
    let normalizedParentId: string | null = null;
    if (catWithoutChildren.parentId) {
      if (typeof catWithoutChildren.parentId === "string") {
        normalizedParentId = catWithoutChildren.parentId;
      } else if (typeof catWithoutChildren.parentId === "object" && catWithoutChildren.parentId !== null) {
        normalizedParentId = (catWithoutChildren.parentId as { _id?: string })._id || null;
      }
    }
    result.push({
      ...catWithoutChildren,
      parentId: normalizedParentId,
      childrenCount: cat.childrenCount || (children && children.length > 0 ? children.length : 0),
    } as Category);
    if (children && children.length > 0) result.push(...flattenTree(children));
  });
  return result;
};

export default function AdminCategory() {
  const { showToast } = useToast();
  const { isAuthenticated, token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "create-subcategory">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [listPage, setListPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isAuthenticated && token) fetchCategories();
  }, [isAuthenticated, token]);

  const fetchCategories = async (preserveExpandedIds?: Set<string>) => {
    try {
      setLoading(true);
      const response = await getCategories({ includeChildren: true });
      if (response.success) {
        setCategories(response.data);
        if (preserveExpandedIds && preserveExpandedIds.size > 0) {
          setExpandedIds(preserveExpandedIds);
        } else {
          const allIds = new Set<string>();
          const collectIds = (cats: Category[]) => {
            cats.forEach((cat) => {
              allIds.add(cat._id);
              if (cat.children && cat.children.length > 0) collectIds(cat.children);
            });
          };
          collectIds(response.data);
          setExpandedIds(allIds);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const flatCategories = flattenTree(categories);
    let filtered = [...flatCategories];
    if (searchQuery.trim()) {
      filtered = searchCategories(filtered, searchQuery);
      const matchingParentIds = new Set(filtered.map((cat) => cat._id));
      const childrenOfMatches = flatCategories.filter(cat => cat.parentId && matchingParentIds.has(cat.parentId));
      const allFiltered = [...filtered, ...childrenOfMatches];
      filtered = Array.from(new Map(allFiltered.map((cat) => [cat._id, cat])).values());
    }
    filtered = filterCategoriesByStatus(filtered, statusFilter);
    return filtered;
  }, [categories, searchQuery, statusFilter]);

  const categoryTree = useMemo(() => {
    if (viewMode === "tree") return buildCategoryTree(filteredCategories);
    return [];
  }, [filteredCategories, viewMode]);

  const handleFormSubmit = async (data: any) => {
    try {
      const response = modalMode === "edit" && editingCategory
        ? await updateCategory(editingCategory._id, data)
        : await createCategory(data);

      if (response.success) {
        showToast(`Category ${modalMode === 'edit' ? 'updated' : 'created'} successfully`, 'success');
        setModalOpen(false);
        if (modalMode === "create-subcategory" && parentCategory) {
          const newExpandedIds = new Set(expandedIds);
          newExpandedIds.add(parentCategory._id);
          fetchCategories(newExpandedIds);
        } else fetchCategories();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Architecture"
        description="Organize your product catalog with multi-level hierarchies and custom icons."
      >
        <Button variant="outline" size="sm" className="gap-2 font-bold uppercase tracking-tighter" onClick={() => fetchCategories()}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync
        </Button>
        <Button size="sm" className="gap-2 font-bold uppercase tracking-tighter shadow-lg shadow-primary/20" onClick={() => { setModalMode("create"); setParentCategory(null); setModalOpen(true); }}>
          <FolderPlus className="h-4 w-4" /> New Category
        </Button>
      </PageHeader>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search catalog architecture..."
                  className="pl-9 bg-muted/30 border-border focus-visible:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="bg-muted/50 p-1 border border-border rounded-lg h-10">
                <TabsList className="bg-transparent h-8">
                  <TabsTrigger value="tree" className="text-[10px] font-bold uppercase tracking-tighter gap-1.5 h-8 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FolderTree className="h-3 w-3" /> Tree
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-[10px] font-bold uppercase tracking-tighter gap-1.5 h-8 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <List className="h-3 w-3" /> List
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-full sm:w-36 bg-muted/30 border-border">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Operational</SelectItem>
                  <SelectItem value="Inactive">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'tree' && (
                <div className="flex bg-muted/50 rounded-lg p-1 border border-border">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase px-2" onClick={() => setExpandedIds(new Set(categories.map(c => c._id)))}>Expand</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase px-2" onClick={() => setExpandedIds(new Set())}>Collapse</Button>
                </div>
              )}
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" className="gap-2 h-9 px-4 font-bold uppercase tracking-tighter">
                  <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.size})
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-9 px-4 font-bold uppercase tracking-tighter text-muted-foreground gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          <div className="relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-card/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">Rebuilding Index...</span>
                </div>
              </div>
            )}

            {viewMode === "tree" ? (
              <div className="border border-border rounded-xl p-4 bg-muted/10">
                <CategoryTreeView
                  categories={categoryTree}
                  onAddSubcategory={(p) => { setModalMode("create-subcategory"); setParentCategory(p); setModalOpen(true); }}
                  onEdit={(c) => { setModalMode("edit"); setEditingCategory(c); setModalOpen(true); }}
                  onDelete={async (c) => {
                    if (window.confirm(`Are you sure you want to delete ${c.name}?`)) {
                      try {
                        await deleteCategory(c._id);
                        showToast('Category deleted', 'success');
                        fetchCategories();
                      } catch (err: any) {
                        showToast(err.message || 'Delete failed', 'error');
                      }
                    }
                  }}
                  onToggleStatus={async (c) => {
                    try {
                      const newStatus = c.status === 'Active' ? 'Inactive' : 'Active';
                      await toggleCategoryStatus(c._id, newStatus);
                      showToast(`Status updated to ${newStatus}`, 'success');
                      fetchCategories();
                    } catch (err: any) {
                      showToast(err.message || 'Update failed', 'error');
                    }
                  }}
                  expandedIds={expandedIds}
                  onToggleExpand={(id) => setExpandedIds(prev => {
                    const n = new Set(prev);
                    n.has(id) ? n.delete(id) : n.add(id);
                    return n;
                  })}
                />
              </div>
            ) : (
              <CategoryListView
                categories={filteredCategories}
                selectedIds={selectedIds}
                onSelect={(id) => setSelectedIds(prev => {
                  const n = new Set(prev);
                  n.has(id) ? n.delete(id) : n.add(id);
                  return n;
                })}
                onSelectAll={() => setSelectedIds(selectedIds.size === filteredCategories.length ? new Set() : new Set(filteredCategories.map(c => c._id)))}
                onEdit={(c) => { setModalMode("edit"); setEditingCategory(c); setModalOpen(true); }}
                onDelete={async (c) => {
                  if (window.confirm(`Are you sure you want to delete ${c.name}?`)) {
                    try {
                      await deleteCategory(c._id);
                      showToast('Category deleted', 'success');
                      fetchCategories();
                    } catch (err: any) {
                      showToast(err.message || 'Delete failed', 'error');
                    }
                  }
                }}
                currentPage={listPage}
                itemsPerPage={itemsPerPage}
                onPageChange={setListPage}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleFormSubmit}
          category={editingCategory || undefined}
          parentCategory={parentCategory || undefined}
          mode={modalMode}
          allCategories={categories}
        />
      )}
    </div>
  );
}
