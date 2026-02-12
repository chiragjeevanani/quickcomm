import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Download, Search } from "lucide-react";
import {
  getCoupons,
  createCoupon,
  deleteCoupon,
  type Coupon,
} from "../../../services/api/admin/adminCouponService";
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
import { Textarea } from "@/components/ui/textarea";

export default function AdminCoupon() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    userType: "",
    numberOfTimes: "Single Time Valid",
    couponExpiryDate: "",
    couponCode: "",
    couponTitle: "",
    couponStatus: "",
    couponMinOrderAmount: "",
    couponValue: "",
    couponType: "Percentage",
    couponDescription: "",
  });

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCoupons({ limit: 100 });
      if (response.success) {
        setCoupons(response.data);
      } else {
        setError("Failed to load coupons");
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setError("Failed to load coupons. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    fetchCoupons();
  }, [isAuthenticated, token]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, couponCode: code }));
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.userType ||
      !formData.couponTitle ||
      !formData.couponCode ||
      !formData.couponExpiryDate ||
      !formData.couponStatus ||
      !formData.couponMinOrderAmount ||
      !formData.couponValue ||
      !formData.couponDescription
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setUploading(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const couponData = {
        code: formData.couponCode.toUpperCase(),
        description: formData.couponDescription,
        discountType: formData.couponType === "Percentage" ? ("Percentage" as const) : ("Fixed" as const),
        discountValue: parseFloat(formData.couponValue),
        minimumPurchase: parseFloat(formData.couponMinOrderAmount),
        startDate: today,
        endDate: formData.couponExpiryDate,
        usageLimit: formData.numberOfTimes === "Single Time Valid" ? 1 : undefined,
        applicableTo: "All" as const,
      };

      const response = await createCoupon(couponData);

      if (response.success) {
        fetchCoupons();
        showToast("Coupon created successfully!", "success");

        // Reset form
        setFormData({
          userType: "",
          numberOfTimes: "Single Time Valid",
          couponExpiryDate: "",
          couponCode: "",
          couponTitle: "",
          couponStatus: "",
          couponMinOrderAmount: "",
          couponValue: "",
          couponType: "Percentage",
          couponDescription: "",
        });
      } else {
        showToast("Failed to create coupon", "error");
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
        error.message ||
        "Failed to create coupon. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const response = await deleteCoupon(id);
      if (response.success) {
        setCoupons(coupons.filter((coupon) => coupon._id !== id));
        showToast("Coupon deleted successfully", "success");
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to delete coupon", "error");
    }
  };

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: "Code",
      accessorKey: "code",
      cell: (c: Coupon) => (
        <span className="font-bold text-primary">{c.code}</span>
      )
    },
    {
      header: "Discount",
      accessorKey: "discountValue",
      cell: (c: Coupon) => (
        <span className="font-medium">
          {c.discountType === "Percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
        </span>
      )
    },
    {
      header: "Type",
      accessorKey: "discountType",
      cell: (c: Coupon) => (
        <Badge variant="outline">{c.discountType}</Badge>
      )
    },
    {
      header: "Min Purchase",
      accessorKey: "minimumPurchase",
      cell: (c: Coupon) => c.minimumPurchase ? `₹${c.minimumPurchase}` : "N/A"
    },
    {
      header: "Expiry",
      accessorKey: "endDate",
      cell: (c: Coupon) => new Date(c.endDate).toLocaleDateString()
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (c: Coupon) => (
        <Badge className={c.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}>
          {c.isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (c: Coupon) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(c._id)}
          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupon Management"
        description="Create and manage discount coupons for customers."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      {/* Add Coupon Form */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Coupon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCoupon} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userType">User Type <span className="text-rose-500">*</span></Label>
                <Select
                  name="userType"
                  value={formData.userType}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, userType: val }))}
                  disabled={uploading}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Select User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Users">All Users</SelectItem>
                    <SelectItem value="Specific User">Specific User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfTimes">Usage Limit <span className="text-rose-500">*</span></Label>
                <Select
                  name="numberOfTimes"
                  value={formData.numberOfTimes}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, numberOfTimes: val }))}
                  disabled={uploading}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Time Valid">Single Time Valid</SelectItem>
                    <SelectItem value="Multi Time Valid">Multi Time Valid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponExpiryDate">Expiry Date <span className="text-rose-500">*</span></Label>
                <Input
                  type="date"
                  name="couponExpiryDate"
                  value={formData.couponExpiryDate}
                  onChange={handleInputChange}
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="couponCode">Coupon Code <span className="text-rose-500">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="Enter or generate"
                    className="bg-muted/50 border-border"
                  />
                  <Button
                    type="button"
                    onClick={generateCouponCode}
                    variant="outline"
                    size="icon"
                    title="Generate Code"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponTitle">Title <span className="text-rose-500">*</span></Label>
                <Input
                  type="text"
                  name="couponTitle"
                  value={formData.couponTitle}
                  onChange={handleInputChange}
                  placeholder="Coupon title"
                  className="bg-muted/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponStatus">Status <span className="text-rose-500">*</span></Label>
                <Select
                  name="couponStatus"
                  value={formData.couponStatus}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, couponStatus: val }))}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="couponMinOrderAmount">Min Order Amount <span className="text-rose-500">*</span></Label>
                <Input
                  type="number"
                  name="couponMinOrderAmount"
                  value={formData.couponMinOrderAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-muted/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponValue">Discount Value <span className="text-rose-500">*</span></Label>
                <Input
                  type="number"
                  name="couponValue"
                  value={formData.couponValue}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-muted/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponType">Discount Type <span className="text-rose-500">*</span></Label>
                <Select
                  name="couponType"
                  value={formData.couponType}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, couponType: val }))}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponDescription">Description <span className="text-rose-500">*</span></Label>
              <Textarea
                name="couponDescription"
                value={formData.couponDescription}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter coupon description"
                className="bg-muted/50 border-border resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full font-bold uppercase tracking-wide"
            >
              {uploading ? "Creating..." : "Create Coupon"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">All Coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code..."
                className="pl-9 bg-muted/50 border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            data={filteredCoupons}
            loading={loading}
            emptyMessage="No coupons found."
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing <span className="font-bold text-foreground">{filteredCoupons.length}</span> coupons
            </p>
            <p>Page {currentPage}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
