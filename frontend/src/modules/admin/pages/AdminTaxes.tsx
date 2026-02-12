import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Download, Search, X } from "lucide-react";
import {
  createTax,
  getTaxes,
  updateTax,
  deleteTax,
  type Tax,
  type CreateTaxData,
  type UpdateTaxData,
} from "../../../services/api/admin/adminTaxService";
import { useAuth } from "../../../context/AuthContext";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AdminTaxes() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [taxTitle, setTaxTitle] = useState("");
  const [percentage, setPercentage] = useState("");
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchTaxes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTaxes({
          search: searchTerm,
          page: currentPage,
          limit: parseInt(rowsPerPage),
        });

        if (response.success) {
          setTaxes(response.data);
        } else {
          setError("Failed to load taxes");
        }
      } catch (err: any) {
        console.error("Error fetching taxes:", err);
        setError(
          err.response?.data?.message ||
          "Failed to load taxes. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTaxes();
  }, [
    isAuthenticated,
    token,
    searchTerm,
    currentPage,
    rowsPerPage,
  ]);

  const handleAddTax = async () => {
    if (!taxTitle.trim() || !percentage.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    const percentageValue = parseFloat(percentage);
    if (
      isNaN(percentageValue) ||
      percentageValue < 0 ||
      percentageValue > 100
    ) {
      showToast("Please enter a valid percentage (0-100)", "error");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingTax) {
        const updateData: UpdateTaxData = {
          name: taxTitle,
          percentage: percentageValue,
        };

        const response = await updateTax(editingTax._id, updateData);

        if (response.success) {
          setTaxes(
            taxes.map((tax) =>
              tax._id === editingTax._id
                ? { ...tax, name: taxTitle, percentage: percentageValue }
                : tax
            )
          );
          showToast("Tax updated successfully!", "success");
          setEditingTax(null);
        } else {
          showToast("Failed to update tax", "error");
        }
      } else {
        const taxData: CreateTaxData = {
          name: taxTitle,
          percentage: percentageValue,
        };

        const response = await createTax(taxData);

        if (response.success) {
          setTaxes([...taxes, response.data]);
          showToast("Tax added successfully!", "success");
        } else {
          showToast("Failed to add tax", "error");
        }
      }

      setTaxTitle("");
      setPercentage("");
    } catch (err: any) {
      console.error("Error saving tax:", err);
      showToast(
        err.response?.data?.message || "Failed to save tax. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tax: Tax) => {
    setTaxTitle(tax.name);
    setPercentage(tax.percentage.toString());
    setEditingTax(tax);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tax?")) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await deleteTax(id);

      if (response.success) {
        setTaxes(taxes.filter((tax) => tax._id !== id));
        showToast("Tax deleted successfully!", "success");

        if (editingTax?._id === id) {
          setEditingTax(null);
          setTaxTitle("");
          setPercentage("");
        }
      } else {
        showToast("Failed to delete tax", "error");
      }
    } catch (err: any) {
      console.error("Error deleting tax:", err);
      showToast(
        err.response?.data?.message || "Failed to delete tax. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ["Sr No", "Tax Name", "Tax Percentage", "Status"];
    const csvContent = [
      headers.join(","),
      ...taxes.map((tax, index) =>
        [index + 1, `"${tax.name}"`, tax.percentage, tax.status].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `taxes_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: "Tax Name",
      accessorKey: "name",
      cell: (t: Tax) => <span className="font-medium">{t.name}</span>
    },
    {
      header: "Percentage",
      accessorKey: "percentage",
      cell: (t: Tax) => <span className="font-bold text-primary">{t.percentage}%</span>
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (t: Tax) => (
        <Badge className={t.status === "Active" ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}>
          {t.status}
        </Badge>
      )
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (t: Tax) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(t)}
            disabled={submitting}
            className="h-8 w-8 text-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(t._id)}
            disabled={submitting}
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
        title="Tax Management"
        description="Configure tax rates for products and services."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Tax Panel */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {editingTax ? "Edit Tax" : "Add New Tax"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxTitle">Tax Name</Label>
              <Input
                type="text"
                id="taxTitle"
                value={taxTitle}
                onChange={(e) => setTaxTitle(e.target.value)}
                placeholder="e.g. GST, VAT"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage</Label>
              <Input
                type="number"
                id="percentage"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="0.00"
                min="0"
                max="100"
                step="0.01"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAddTax}
                disabled={submitting}
                className="w-full font-bold uppercase tracking-wide"
              >
                {submitting ? "Processing..." : editingTax ? "Update Tax" : "Add Tax"}
              </Button>

              {editingTax && (
                <Button
                  onClick={() => {
                    setEditingTax(null);
                    setTaxTitle("");
                    setPercentage("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Tax Table */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">All Taxes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search taxes..."
                  className="pl-9 bg-muted/50 border-border"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-24 bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={taxes}
              loading={loading}
              emptyMessage="No taxes found."
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing <span className="font-bold text-foreground">{taxes.length}</span> taxes
              </p>
              <p>Page {currentPage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
