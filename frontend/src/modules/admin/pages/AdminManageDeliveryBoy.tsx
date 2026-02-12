import { useState, useEffect } from 'react';
import {
    getDeliveryBoys,
    updateDeliveryBoyStatus,
    updateDeliveryBoyAvailability,
    deleteDeliveryBoy,
    type DeliveryBoy,
} from '../../../services/api/admin/adminDeliveryService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Search,
    Download,
    Trash2,
    CheckCircle2,
    XCircle,
    Truck,
    MapPin,
    Phone,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    CircleSlash,
    UserCheck,
    UserX,
    FilterX
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AdminManageDeliveryBoy() {
    const { isAuthenticated, token } = useAuth();
    const { showToast } = useToast();
    const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [availabilityFilter, setAvailabilityFilter] = useState('All');
    const [rowsPerPage, setRowsPerPage] = useState("10");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [totalPages, setTotalPages] = useState(1);
    const [totalDeliveryBoys, setTotalDeliveryBoys] = useState(0);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            return;
        }

        const fetchDeliveryBoys = async () => {
            try {
                setLoading(true);

                const params: any = {
                    page: currentPage,
                    limit: parseInt(rowsPerPage),
                    search: searchTerm || undefined,
                    sortBy: sortColumn || undefined,
                    sortOrder: sortDirection,
                };

                if (statusFilter !== 'All') {
                    params.status = statusFilter;
                }

                if (availabilityFilter !== 'All') {
                    params.available = availabilityFilter;
                }

                const response = await getDeliveryBoys(params);

                if (response.success) {
                    setDeliveryBoys(response.data);
                    if (response.pagination) {
                        setTotalPages(response.pagination.pages);
                        setTotalDeliveryBoys(response.pagination.total);
                    }
                } else {
                    showToast(response.message || 'Failed to load delivery boys', 'error');
                }
            } catch (err: any) {
                console.error('Error fetching delivery boys:', err);
                showToast(err.response?.data?.message || 'Failed to load delivery boys', 'error');
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchDeliveryBoys();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timer);
    }, [isAuthenticated, token, currentPage, rowsPerPage, searchTerm, statusFilter, availabilityFilter, sortColumn, sortDirection]);

    const handleStatusChange = async (deliveryBoyId: string, newStatus: 'Active' | 'Inactive') => {
        try {
            setProcessing(deliveryBoyId);
            const response = await updateDeliveryBoyStatus(deliveryBoyId, newStatus);

            if (response.success) {
                setDeliveryBoys(prev => prev.map(db =>
                    db._id === deliveryBoyId ? { ...db, status: newStatus } : db
                ));
                showToast(`Agent status updated to ${newStatus}`, 'success');
            } else {
                showToast(response.message || 'Failed to update status', 'error');
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Error updating status', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleAvailabilityChange = async (deliveryBoyId: string, newAvailability: 'Available' | 'Not Available') => {
        try {
            setProcessing(deliveryBoyId);
            const response = await updateDeliveryBoyAvailability(deliveryBoyId, newAvailability);

            if (response.success) {
                setDeliveryBoys(prev => prev.map(db =>
                    db._id === deliveryBoyId ? { ...db, available: newAvailability } : db
                ));
                showToast(`Agent availability updated to ${newAvailability}`, 'success');
            } else {
                showToast(response.message || 'Failed to update availability', 'error');
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Error updating availability', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (deliveryBoyId: string) => {
        if (!window.confirm('Are you sure you want to delete this delivery boy? This action cannot be undone.')) {
            return;
        }

        try {
            setProcessing(deliveryBoyId);
            const response = await deleteDeliveryBoy(deliveryBoyId);

            if (response.success) {
                showToast('Delivery boy deleted successfully', 'success');
                setDeliveryBoys(prev => prev.filter(db => db._id !== deliveryBoyId));
            } else {
                showToast(response.message || 'Failed to delete delivery boy', 'error');
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Error deleting delivery boy', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleExport = () => {
        const headers = ['Id', 'Name', 'Mobile', 'Address', 'City', 'Commission', 'Balance', 'Cash Collected', 'Status', 'Available'];
        const csvContent = [
            headers.join(','),
            ...deliveryBoys.map(db => [
                db._id.slice(-6),
                `"${db.name}"`,
                db.mobile,
                `"${db.address}"`,
                `"${db.city}"`,
                db.commissionType === 'Percentage' ? `${db.commission}%` : 'Fixed',
                db.balance,
                db.cashCollected,
                db.status,
                db.available
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `delivery_agents_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const columns = [
        {
            header: "Agent / Info",
            accessorKey: "name",
            cell: (db: DeliveryBoy) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                        <Truck className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground leading-tight">{db.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">ID: {db._id.slice(-6)}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Contact",
            accessorKey: "mobile",
            cell: (db: DeliveryBoy) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {db.mobile}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[150px] truncate">
                        <MapPin className="h-3 w-3" /> {db.city}
                    </div>
                </div>
            )
        },
        {
            header: "Earnings / Cash",
            accessorKey: "balance",
            cell: (db: DeliveryBoy) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">₹{db.balance.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground font-bold">Cash: ₹{db.cashCollected.toFixed(2)}</span>
                </div>
            )
        },
        {
            header: "Commission",
            accessorKey: "commission",
            cell: (db: DeliveryBoy) => (
                <div className="flex flex-col text-xs">
                    {db.commissionType === 'Percentage' ? (
                        <>
                            <span className="font-bold">{db.commission}%</span>
                            <span className="text-[10px] text-muted-foreground font-medium">Min: ₹{db.minAmount}</span>
                        </>
                    ) : (
                        <span className="font-medium bg-muted px-2 py-0.5 rounded-md w-fit text-[10px] uppercase tracking-tighter">Fixed Amount</span>
                    )}
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (db: DeliveryBoy) => (
                <div className="flex flex-col gap-1.5">
                    <Badge className={
                        db.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    }>
                        {db.status}
                    </Badge>
                    <Badge variant="outline" className={
                        db.available === 'Available' ? 'border-emerald-500/30 text-emerald-600 font-bold text-[9px]' :
                            'border-amber-500/30 text-amber-600 font-bold text-[9px]'
                    }>
                        {db.available}
                    </Badge>
                </div>
            )
        },
        {
            header: "Action",
            accessorKey: "_id",
            cell: (db: DeliveryBoy) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" disabled={processing === db._id}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                            onClick={() => handleStatusChange(db._id, db.status === 'Active' ? 'Inactive' : 'Active')}
                            className="gap-2"
                        >
                            {db.status === 'Active' ? <UserX className="h-4 w-4 text-rose-500" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
                            {db.status === 'Active' ? 'Deactivate Agent' : 'Activate Agent'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleAvailabilityChange(db._id, db.available === 'Available' ? 'Not Available' : 'Available')}
                            className="gap-2"
                        >
                            {db.available === 'Available' ? <CircleSlash className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            Mark as {db.available === 'Available' ? 'Not Available' : 'Available'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleDelete(db._id)}
                            className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 gap-2 font-bold"
                        >
                            <Trash2 className="h-4 w-4" /> Remove Agent
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Delivery Fleet Management"
                description="Manage delivery agents, track their status, earnings and availability."
            >
                <Button variant="outline" size="sm" className="gap-2 shadow-sm font-bold uppercase tracking-tight" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export Agents
                </Button>
            </PageHeader>

            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-lg font-bold">Active Fleet</CardTitle>
                        <CardDescription>View and manage all registered delivery personnel.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold uppercase tracking-tighter text-[10px]">
                            {totalDeliveryBoys} Total Registered
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search agents by name, mobile, city..."
                                    className="pl-9 bg-muted/50 border-border focus-visible:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="Active">Active Only</SelectItem>
                                    <SelectItem value="Inactive">Inactive Only</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border">
                                    <SelectValue placeholder="Availability" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Any Availability</SelectItem>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Not Available">Not Available</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                <SelectTrigger className="w-full sm:w-24 bg-muted/50 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(statusFilter !== 'All' || availabilityFilter !== 'All' || searchTerm) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground gap-2"
                                onClick={() => {
                                    setStatusFilter('All');
                                    setAvailabilityFilter('All');
                                    setSearchTerm('');
                                }}
                            >
                                <FilterX className="h-4 w-4" /> Clear
                            </Button>
                        )}
                    </div>

                    <DataTable
                        columns={columns}
                        data={deliveryBoys}
                        loading={loading}
                        emptyMessage="No delivery agents found matching your filters."
                    />

                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground font-medium">
                            Showing <span className="text-foreground font-bold">{deliveryBoys.length}</span> agents on this page
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center justify-center h-8 min-w-[32px] px-2 rounded-md bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                {currentPage} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages || loading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
