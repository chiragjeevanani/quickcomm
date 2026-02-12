import { useState, useEffect, useMemo } from 'react';
import {
  getHeaderCategoriesAdmin,
  createHeaderCategory,
  updateHeaderCategory,
  deleteHeaderCategory,
  HeaderCategory
} from '../../../services/api/headerCategoryService';
import { themes } from '../../../utils/themes';
import { ICON_LIBRARY, getIconByName, IconDef } from '../../../utils/iconLibrary';

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
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  X,
  LayoutGrid,
  Palette
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminHeaderCategory() {
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [headerCategoryName, setHeaderCategoryName] = useState('');
  const [selectedIconLibrary, setSelectedIconLibrary] = useState('Custom'); // Default to Custom for SVG
  const [headerCategoryIcon, setHeaderCategoryIcon] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // This maps to relatedCategory
  const [selectedTheme, setSelectedTheme] = useState('all'); // This maps to slug
  const [selectedStatus, setSelectedStatus] = useState<'Published' | 'Unpublished'>('Published');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Icon search state
  const [iconSearchTerm, setIconSearchTerm] = useState('');

  // Table states
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const themeOptions = Object.keys(themes);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getHeaderCategoriesAdmin();
      setHeaderCategories(data);
    } catch (error) {
      console.error('Failed to fetch header categories', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Smart Icon Suggestions
  useEffect(() => {
    if (headerCategoryName && !editingId) {
      // Logic handled in useMemo
    }
  }, [headerCategoryName]);

  const filteredIcons = useMemo(() => {
    const term = iconSearchTerm || headerCategoryName || '';
    if (!term.trim()) return ICON_LIBRARY;

    const lowerTerm = term.toLowerCase();

    return [...ICON_LIBRARY].sort((a, b) => {
      const aScore = getMatchScore(a, lowerTerm);
      const bScore = getMatchScore(b, lowerTerm);
      return bScore - aScore;
    });
  }, [iconSearchTerm, headerCategoryName]);

  function getMatchScore(icon: IconDef, term: string) {
    let score = 0;
    if (icon.name.includes(term)) score += 10;
    if (icon.label.toLowerCase().includes(term)) score += 10;
    if (icon.tags.some(t => t.includes(term))) score += 5;
    if (icon.tags.some(t => term.includes(t))) score += 5;
    return score;
  }

  const filteredCategories = headerCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.relatedCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedCategories = filteredCategories.slice(startIndex, endIndex);

  const resetForm = () => {
    setHeaderCategoryName('');
    setSelectedIconLibrary('Custom');
    setHeaderCategoryIcon('');
    setSelectedCategory('');
    setSelectedTheme('all');
    setSelectedStatus('Published');
    setEditingId(null);
    setIconSearchTerm('');
  };

  const handleAddOrUpdate = async () => {
    if (!headerCategoryName.trim()) return toast.error('Please enter a header category name');
    if (!headerCategoryIcon.trim()) return toast.error('Please select an icon. If your category is unique, try searching for a generic icon.');
    if (!selectedTheme) return toast.error('Please select a theme');

    try {
      const payload = {
        name: headerCategoryName,
        iconLibrary: selectedIconLibrary,
        iconName: headerCategoryIcon,
        slug: selectedTheme, // Use theme as slug for color mapping
        relatedCategory: selectedCategory,
        status: selectedStatus,
      };

      if (editingId) {
        await updateHeaderCategory(editingId, payload);
        toast.success('Header Category updated successfully!');
      } else {
        await createHeaderCategory(payload);
        toast.success('Header Category added successfully!');
      }

      fetchCategories();
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string) => {
    const category = headerCategories.find(c => c._id === id);
    if (category) {
      setEditingId(category._id);
      setHeaderCategoryName(category.name);
      setSelectedIconLibrary(category.iconLibrary);
      setHeaderCategoryIcon(category.iconName);
      setSelectedCategory(category.relatedCategory || '');
      setSelectedTheme(category.slug);
      setSelectedStatus(category.status);
      setIconSearchTerm('');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this header category?')) {
      try {
        await deleteHeaderCategory(id);
        toast.success('Header Category deleted successfully!');
        fetchCategories();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete category');
      }
    }
  };

  // Define columns for DataTable
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (item: HeaderCategory) => (
        <span className="font-medium text-sm">{item.name}</span>
      )
    },
    {
      header: "Icon",
      accessorKey: "iconName",
      cell: (item: HeaderCategory) => (
        <div className="flex items-center gap-2">
          <div className="text-primary w-5 h-5 flex items-center justify-center">
            {getIconByName(item.iconName)}
          </div>
          <span className="text-xs text-muted-foreground font-mono hidden xl:inline">
            {item.iconName}
          </span>
        </div>
      )
    },
    {
      header: "Theme",
      accessorKey: "slug",
      cell: (item: HeaderCategory) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border capitalize">
          <div
            className="w-2 h-2 rounded-full mr-1.5"
            style={{ background: themes[item.slug]?.primary[0] || '#ccc' }}
          />
          {item.slug}
        </span>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: HeaderCategory) => (
        <Badge variant={item.status === 'Published' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      accessorKey: "_id",
      cell: (item: HeaderCategory) => (
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
        title="Header Categories"
        description="Manage top-level categories and themes"
      >
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-bold text-foreground">{headerCategories.length}</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Add/Edit Form */}
        <Card className="lg:col-span-1 h-fit border-border shadow-sm">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-4 w-4 text-primary" /> Edit Header Category
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-primary" /> Add Header Category
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="catName">Category Name</Label>
              <Input
                id="catName"
                placeholder="e.g. Dairy, Books"
                value={headerCategoryName}
                onChange={(e) => setHeaderCategoryName(e.target.value)}
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Select Icon</Label>
                <div className="relative w-32">
                  <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={iconSearchTerm}
                    onChange={(e) => setIconSearchTerm(e.target.value)}
                    className="h-7 text-xs pl-7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-muted/30 p-2 rounded-lg border border-border h-48 overflow-y-auto custom-scrollbar">
                {filteredIcons.length > 0 ? filteredIcons.map((option) => {
                  const isSelected = headerCategoryIcon === option.name;
                  return (
                    <div
                      key={option.name}
                      onClick={() => {
                        setHeaderCategoryIcon(option.name);
                        setSelectedIconLibrary('Custom');
                      }}
                      className={`
                        cursor-pointer flex flex-col items-center justify-center p-2 rounded-md border transition-all h-20
                        ${isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary text-primary'
                          : 'bg-card border-border hover:border-primary/50 text-muted-foreground'}
                      `}
                      title={option.label}
                    >
                      <div className="scale-75">
                        {option.svg}
                      </div>
                      <span className="text-[9px] font-medium text-center truncate w-full mt-1">
                        {option.label}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
                    No icons found
                  </div>
                )}
              </div>
            </div>

            {/* Theme Picker */}
            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="grid grid-cols-5 gap-2 bg-muted/30 p-2 rounded-lg border border-border">
                {themeOptions.map(themeKey => {
                  const themeObj = themes[themeKey];
                  const color = themeObj.primary[0];
                  const isSelected = selectedTheme === themeKey;

                  return (
                    <div
                      key={themeKey}
                      onClick={() => setSelectedTheme(themeKey)}
                      title={themeKey}
                      className={`
                                cursor-pointer flex flex-col items-center justify-center p-1.5 rounded-md transition-all
                                ${isSelected ? 'bg-background shadow-sm ring-2 ring-primary' : 'hover:bg-background/80'}
                            `}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-sm border border-border"
                        style={{ background: color }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Related Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Related Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="mobiles">Mobiles</SelectItem>
                  <SelectItem value="grocery">Grocery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={(val: any) => setSelectedStatus(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddOrUpdate}
                className="flex-1 font-bold"
              >
                <Save className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Save"}
              </Button>

              {editingId && (
                <Button
                  variant="outline"
                  onClick={resetForm}
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
                <LayoutGrid className="h-4 w-4 text-primary" /> Header Categories
              </CardTitle>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="p-4">
              <DataTable
                columns={columns}
                data={displayedCategories}
                loading={loading}
                emptyMessage="No categories found."
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
