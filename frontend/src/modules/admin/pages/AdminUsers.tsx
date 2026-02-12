import { useState, useEffect } from 'react';
import { getUsers, updateUserStatus, type User as UserType } from '../../../services/api/admin/adminMiscService';
import { useAuth } from '../../../context/AuthContext';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Search,
    Download,
    User,
    Mail,
    Phone,
    Shield,
    ShieldOff,
    Calendar,
    Wallet,
    ShoppingBag,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    FilterX,
    MoreHorizontal,
    ArrowUpRight,
    Users
} from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AdminUsers() {
    const { isAuthenticated, token } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [rowsPerPage, setRowsPerPage] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            return;
        }

        const fetchUsers = async () => {
            try {
                setLoading(true);
                const params: any = {
                    page: currentPage,
                    limit: parseInt(rowsPerPage),
                };

                if (statusFilter !== 'All') params.status = statusFilter;
                if (searchTerm) params.search = searchTerm;

                const response = await getUsers(params);
                if (response.success) {
                    setUsers(response.data);
                    if (response.pagination) {
                        setTotalPages(response.pagination.pages);
                        setTotalUsers(response.pagination.total);
                    }
                }
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Error fetching users', 'error');
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchUsers, searchTerm ? 500 : 0);
        return () => clearTimeout(timer);
    }, [isAuthenticated, token, currentPage, rowsPerPage, statusFilter, searchTerm]);

    const handleExport = () => {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Registration', 'Status', 'Wallet', 'Orders', 'Spent'];
        const csvContent = [
            headers.join(','),
            ...users.map(u => [
                u._id.slice(-6),
                `"${u.name}"`,
                `"${u.email}"`,
                `"${u.phone || ''}"`,
                `"${new Date(u.registrationDate).toLocaleDateString()}"`,
                u.status,
                u.walletAmount.toFixed(2),
                u.totalOrders,
                u.totalSpent.toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleStatusUpdate = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
            const response = await updateUserStatus(userId, newStatus as any);
            if (response.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus as any } : u));
                showToast(`User ${newStatus === 'Active' ? 'activated' : 'suspended'} successfully!`, 'success');
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Status update failed', 'error');
        }
    };

    const columns = [
        {
            header: "Member / ID",
            accessorKey: "name",
            cell: (u: UserType) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-inner uppercase">
                        {u.name[0]}{u.name.split(' ')[1]?.[0] || ''}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground leading-tight text-xs">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">UID: {u._id.slice(-6).toUpperCase()}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Contact Channels",
            accessorKey: "email",
            cell: (u: UserType) => (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-foreground font-medium">
                        <Mail className="h-3 w-3 text-muted-foreground" /> {u.email}
                    </div>
                    {u.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Phone className="h-2.5 w-2.5" /> {u.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Financial Audit",
            accessorKey: "totalSpent",
            cell: (u: UserType) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 font-bold text-foreground text-xs text-teal-600">
                        <Wallet className="h-3 w-3" /> ₹{u.walletAmount.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">
                        <TrendingUp className="h-2.5 w-2.5" /> Spent: ₹{u.totalSpent.toFixed(2)}
                    </div>
                </div>
            )
        },
        {
            header: "Engagement",
            accessorKey: "totalOrders",
            cell: (u: UserType) => (
                <div className="flex flex-col">
                    <Badge variant="secondary" className="gap-1 font-bold text-[10px] bg-muted w-fit">
                        <ShoppingBag className="h-2.5 w-2.5" /> {u.totalOrders} Orders
                    </Badge>
                    <span className="text-[9px] text-muted-foreground mt-1 uppercase tracking-tight flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" /> Since {new Date(u.registrationDate).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
            header: "Security",
            accessorKey: "status",
            cell: (u: UserType) => (
                <div className="flex flex-col gap-2">
                    <Badge className={
                        u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm' :
                            u.status === 'Suspended' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }>
                        {u.status}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-[9px] font-bold uppercase tracking-widest ${u.status === 'Active' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        onClick={() => handleStatusUpdate(u._id, u.status)}
                    >
                        {u.status === 'Active' ? <ShieldOff className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                        {u.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Customer Central"
                description="Comprehensive directory of platform users, purchase histories, and wallet balances."
            >
                <Button variant="outline" size="sm" className="gap-2 shadow-sm font-bold uppercase tracking-tight h-9" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export Ledger
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Users</p>
                            <p className="text-xl font-black text-foreground">{totalUsers}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                            <ArrowUpRight className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Engagement</p>
                            <p className="text-xl font-black text-foreground">High Growth</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active nodes</p>
                            <p className="text-xl font-black text-foreground">{users.filter(u => u.status === 'Active').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shadow-inner">
                            <ShieldOff className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suspended</p>
                            <p className="text-xl font-black text-foreground">{users.filter(u => u.status === 'Suspended').length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/10 border-b border-border pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-lg font-bold">User Ledger</CardTitle>
                            <Badge variant="outline" className="font-bold border-primary/20 bg-primary/5 text-primary">LIVE AUDIT</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email..."
                                    className="pl-9 h-10 bg-card border-border shadow-inner text-sm"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-32 h-10 bg-card border-border text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="Active">Active Only</SelectItem>
                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={rowsPerPage} onValueChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-24 h-10 bg-card border-border text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 Rows</SelectItem>
                                    <SelectItem value="25">25 Rows</SelectItem>
                                    <SelectItem value="50">50 Rows</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <DataTable
                        columns={columns}
                        data={users}
                        loading={loading}
                        emptyMessage="No customer records identified in the registry."
                    />

                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2rem] italic">
                            SYNCED: {totalUsers} REGISTERED CUSTOMERS
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
                                className="h-9 w-9 p-0 rounded-lg shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center justify-center px-4 h-9 bg-primary text-white font-black text-xs rounded-lg shadow-md">
                                {currentPage}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages || loading}
                                className="h-9 w-9 p-0 rounded-lg shadow-sm"
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
