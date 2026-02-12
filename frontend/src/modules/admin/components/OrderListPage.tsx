import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Download,
    Calendar,
    Eye,
    MoreVertical,
} from "lucide-react";
import {
    getAllOrders,
    type Order,
} from "../../../services/api/admin/adminOrderService";
import { useAuth } from "../../../context/AuthContext";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

interface OrderListPageProps {
    title?: string;
    description?: string;
    defaultStatus?: string;
    fixedStatus?: boolean;
}

export default function OrderListPage({
    title = "Order Management",
    description = "View and manage customer orders",
    defaultStatus = "all",
    fixedStatus = false,
}: OrderListPageProps) {
    const { isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    // const [dateRange, setDateRange] = useState(""); // TODO: Implement date range filter in cleaner way if needed
    const [status, setStatus] = useState(defaultStatus);
    const [entriesPerPage, setEntriesPerPage] = useState("10");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // If fixedStatus is true, status should always remain the defaultStatus
    // We can just rely on `status` state being initialized to defaultStatus and not showing the dropdown

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);

                const params: any = {
                    page: currentPage,
                    limit: parseInt(entriesPerPage),
                };

                if (status !== "all") params.status = status;
                if (searchQuery) params.search = searchQuery;

                const response = await getAllOrders(params);
                if (response.success) {
                    setOrders(response.data);
                } else {
                    setOrders([]);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load orders.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [isAuthenticated, token, currentPage, entriesPerPage, status, searchQuery]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Delivered":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">{status}</Badge>;
            case "Cancelled":
            case "Rejected":
            case "Returned":
                return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20">{status}</Badge>;
            case "Pending":
            case "Payment Pending":
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">{status}</Badge>;
            case "Shipped":
            case "Out for Delivery":
            case "Out For Delivery":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">{status}</Badge>;
            case "Processed":
            case "Received":
                return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20">{status}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const columns = [
        {
            header: "Order ID",
            accessorKey: "orderNumber",
            cell: (o: Order) => (
                <span className="font-bold text-primary hover:underline cursor-pointer" onClick={() => navigate(`/admin/orders/${o._id}`)}>
                    {o.orderNumber}
                </span>
            )
        },
        {
            header: "Customer",
            accessorKey: "customerName",
            cell: (o: Order) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{o.customerName || (typeof o.customer === 'object' ? o.customer.name : 'Unknown')}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Verified Customer</span>
                </div>
            )
        },
        {
            header: "Order Date",
            accessorKey: "orderDate",
            cell: (o: Order) => o.orderDate ? new Date(o.orderDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : "-"
        },
        {
            header: "Amount",
            accessorKey: "total",
            cell: (o: Order) => <span className="font-bold text-foreground">₹{(o.total || 0).toFixed(2)}</span>
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (o: Order) => getStatusBadge(o.status)
        },
        {
            header: "Delivery Status",
            accessorKey: "deliveryBoyStatus",
            cell: (o: Order) => (
                <Badge variant="outline" className={o.deliveryBoyStatus === 'Assigned' || o.deliveryBoyStatus === 'Delivered' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/30 text-rose-500 bg-rose-500/5'}>
                    {o.deliveryBoyStatus || "Not Assigned"}
                </Badge>
            )
        },
        {
            header: "Action",
            accessorKey: "_id",
            cell: (o: Order) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => navigate(`/admin/orders/${o._id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Invoice
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    const handleExport = () => {
        if (!orders || orders.length === 0) return;

        const headers = [
            "Order ID",
            "Customer",
            "Address",
            "Order Date",
            "Status",
            "Delivery Status",
            "Amount",
        ];

        const csvContent = [
            headers.join(","),
            ...orders.map((order) =>
                [
                    order.orderNumber || "",
                    `"${order.customerName || ""}"`, // Quote to handle commas in names
                    `"${order.deliveryAddress?.address || ""}"`,
                    order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "",
                    order.status || "",
                    order.deliveryBoyStatus || "Not Assigned",
                    `"${(order.total || 0).toFixed(2)}"`,
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `orders_export_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title={title}
                description={description}
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-bold uppercase tracking-tighter"
                    onClick={handleExport}
                    disabled={orders.length === 0}
                >
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </PageHeader>

            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Order ID, Customer..."
                                    className="pl-9 bg-muted/50 border-border focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            {!fixedStatus && (
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border capitalize">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Received">Received</SelectItem>
                                        <SelectItem value="Processed">Processed</SelectItem>
                                        <SelectItem value="Shipped">Shipped</SelectItem>
                                        <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                                        <SelectItem value="Delivered">Delivered</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        <SelectItem value="Returned">Returned</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                                <SelectTrigger className="w-full sm:w-24 bg-muted/50 border-border">
                                    <SelectValue placeholder="Show" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range Place holder */}
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                            {/* <div className="flex items-center bg-muted/50 border border-border rounded-lg px-3 py-1.5 gap-2 w-full sm:w-auto cursor-pointer hover:bg-muted/80 transition-colors">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Date Filter</span>
              </div> */}
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={orders}
                        loading={loading}
                        emptyMessage="No orders found."
                        onRowClick={(row) => navigate(`/admin/orders/${row._id}`)}
                    />

                    {/* Pagination controls are generic enough in structure but could be improved. 
               For now relying on simple Next/Prev roughly implemented in DataTable logic 
               or if we need custom pagination here: */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-muted-foreground">
                            Page {currentPage} (Showing {orders.length} entries)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={orders.length < parseInt(entriesPerPage) || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
