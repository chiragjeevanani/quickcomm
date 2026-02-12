import { useState, useEffect } from 'react';
import {
    Search,
    Download,
    MapPin,
    Eye,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Store,
    Mail,
    Phone,
    Layers,
    ShieldCheck,
    CreditCard,
    Target,
    AlertCircle
} from 'lucide-react';
import {
    getAllSellers,
    updateSellerStatus,
    deleteSeller,
    Seller as SellerType,
    updateSeller
} from '../../../services/api/sellerService';
import SellerServiceMap from '../components/SellerServiceMap';
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
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from '../../../context/ToastContext';

interface Seller {
    _id: string;
    id?: number;
    name: string;
    sellerName: string;
    storeName: string;
    phone: string;
    mobile: string;
    email: string;
    logo?: string;
    balance: number;
    commission: number;
    categories: string[];
    status: 'Approved' | 'Pending' | 'Rejected';
    needApproval: boolean;
    category?: string;
    address?: string;
    city?: string;
    serviceableArea?: string;
    panCard?: string;
    taxName?: string;
    taxNumber?: string;
    searchLocation?: string;
    latitude?: string;
    longitude?: string;
    serviceRadiusKm?: number;
    accountName?: string;
    bankName?: string;
    branch?: string;
    accountNumber?: string;
    ifsc?: string;
    profile?: string;
    idProof?: string;
    addressProof?: string;
    requireProductApproval?: boolean;
    viewCustomerDetails?: boolean;
}

const mapSellerToFrontend = (seller: SellerType): Seller => ({
    _id: seller._id,
    id: parseInt(seller._id.slice(-6), 16) || 0,
    name: seller.sellerName,
    sellerName: seller.sellerName,
    storeName: seller.storeName,
    phone: seller.mobile,
    mobile: seller.mobile,
    email: seller.email,
    logo: seller.logo,
    balance: seller.balance || 0,
    commission: seller.commission || 0,
    categories: seller.categories || [],
    status: seller.status,
    needApproval: seller.status === 'Pending',
    category: seller.category,
    address: seller.address,
    city: seller.city,
    serviceableArea: seller.serviceableArea,
    panCard: seller.panCard,
    taxName: seller.taxName,
    taxNumber: seller.taxNumber,
    searchLocation: seller.searchLocation,
    latitude: seller.latitude,
    longitude: seller.longitude,
    serviceRadiusKm: seller.serviceRadiusKm,
    accountName: seller.accountName,
    bankName: seller.bankName,
    branch: seller.branch,
    accountNumber: seller.accountNumber,
    ifsc: seller.ifsc,
    profile: seller.profile,
    idProof: seller.idProof,
    addressProof: seller.addressProof,
    requireProductApproval: seller.requireProductApproval,
    viewCustomerDetails: seller.viewCustomerDetails,
});

export default function AdminManageSellerList() {
    const { showToast } = useToast();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [rowsPerPage, setRowsPerPage] = useState("10");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newRadius, setNewRadius] = useState<number>(10);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const response = await getAllSellers();
            if (response.success && response.data) {
                setSellers(response.data.map(mapSellerToFrontend));
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to fetch sellers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
        try {
            setIsUpdating(true);
            const response = await updateSellerStatus(id, status);
            if (response.success) {
                showToast(`Seller ${status.toLowerCase()} Successfully`, 'success');
                setIsEditModalOpen(false);
                fetchSellers();
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateRadius = async () => {
        if (!selectedSeller) return;
        try {
            setIsUpdating(true);
            const response = await updateSeller(selectedSeller._id, { serviceRadiusKm: newRadius });
            if (response.success) {
                showToast('Service radius updated', 'success');
                fetchSellers();
            }
        } catch (error: any) {
            showToast('Failed to update radius', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const activeSellers = sellers.filter(s => {
        const matchSearch = s.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const columns = [
        {
            header: "Store",
            accessorKey: "storeName",
            cell: (s: Seller) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border rounded-lg shadow-sm">
                        <AvatarImage src={s.logo} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary">
                            <Store className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground leading-tight">{s.storeName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">{s.sellerName}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Contact",
            accessorKey: "email",
            cell: (s: Seller) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground group">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs group-hover:text-foreground transition-colors">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground group">
                        <Phone className="h-3 w-3" />
                        <span className="text-xs group-hover:text-foreground transition-colors">{s.phone}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Earnings",
            accessorKey: "balance",
            cell: (s: Seller) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">₹{s.balance.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground font-bold">{s.commission}% Commission</span>
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (s: Seller) => (
                <Badge className={
                    s.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        s.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }>
                    {s.status}
                </Badge>
            )
        },
        {
            header: "Action",
            accessorKey: "_id",
            cell: (s: Seller) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => { setSelectedSeller(s); setIsEditModalOpen(true); }} className="gap-2">
                            <Edit3 className="h-4 w-4" /> Manage Seller
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                            <Layers className="h-4 w-4" /> Products
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                            <MapPin className="h-4 w-4" /> Location
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-500 focus:text-rose-500 focus:bg-rose-50 gap-2">
                            <Trash2 className="h-4 w-4" /> Delete Store
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Manage Sellers"
                description="Verify seller documentation, manage storefronts and set commission rates."
            >
                <Button variant="outline" size="sm" className="gap-2 font-bold uppercase tracking-tighter shadow-sm" onClick={fetchSellers}>
                    Refresh List
                </Button>
                <Button size="sm" className="gap-2 font-bold uppercase tracking-tighter shadow-lg shadow-primary/20">
                    <Store className="h-4 w-4" /> Add Seller
                </Button>
            </PageHeader>

            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by store or owner..."
                                    className="pl-9 bg-muted/50 border-border focus-visible:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stores</SelectItem>
                                    <SelectItem value="Approved">Verified Only</SelectItem>
                                    <SelectItem value="Pending">Approval Pending</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                <SelectTrigger className="w-full sm:w-24 bg-muted/50 border-border">
                                    <SelectValue placeholder="Show" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="ghost" size="sm" className="gap-2 font-bold uppercase tracking-tighter">
                            <Download className="h-4 w-4" /> Export CSV
                        </Button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={activeSellers.slice((currentPage - 1) * parseInt(rowsPerPage), currentPage * parseInt(rowsPerPage))}
                        loading={loading}
                        emptyMessage="No sellers found matching your criteria."
                    />

                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground font-medium">
                            Showing <span className="text-foreground font-bold">{activeSellers.length}</span> platform partners
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
                            <div className="flex items-center justify-center h-8 min-w-[32px] px-2 rounded-md bg-primary text-primary-foreground text-xs font-bold">
                                {currentPage}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={activeSellers.length <= currentPage * parseInt(rowsPerPage) || loading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border p-0">
                    {selectedSeller && (
                        <div className="flex flex-col">
                            <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-primary-foreground/20 rounded-xl shadow-lg">
                                        <AvatarImage src={selectedSeller.logo} className="object-cover" />
                                        <AvatarFallback className="bg-white/10 text-2xl font-bold">
                                            {selectedSeller.storeName.substring(0, 1)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedSeller.storeName}</h2>
                                        <div className="flex items-center gap-2 mt-1 opacity-90">
                                            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground bg-white/10">{selectedSeller.status}</Badge>
                                            <span className="text-xs font-medium">{selectedSeller.category}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Tabs defaultValue="info" className="w-full">
                                <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none">
                                    <TabsTrigger value="info" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-muted/50 transition-all font-bold uppercase tracking-tighter text-[10px]">
                                        Business Info
                                    </TabsTrigger>
                                    <TabsTrigger value="verification" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-muted/50 transition-all font-bold uppercase tracking-tighter text-[10px]">
                                        KYC & Legal
                                    </TabsTrigger>
                                    <TabsTrigger value="location" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-muted/50 transition-all font-bold uppercase tracking-tighter text-[10px]">
                                        Service Area
                                    </TabsTrigger>
                                    <TabsTrigger value="banking" className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-muted/50 transition-all font-bold uppercase tracking-tighter text-[10px]">
                                        Payout Settings
                                    </TabsTrigger>
                                </TabsList>

                                <div className="p-6">
                                    <TabsContent value="info" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Owner Name</Label>
                                                <Input value={selectedSeller.sellerName} readOnly className="bg-muted/30 border-border" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Store Category</Label>
                                                <Input value={selectedSeller.category} readOnly className="bg-muted/30 border-border" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Registered Email</Label>
                                                <Input value={selectedSeller.email} readOnly className="bg-muted/30 border-border" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Mobile</Label>
                                                <Input value={selectedSeller.phone} readOnly className="bg-muted/30 border-border" />
                                            </div>
                                        </div>
                                        <div className="space-y-1 pt-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Store Address</Label>
                                            <div className="p-3 bg-muted/30 rounded-lg border border-border text-sm text-foreground">
                                                {selectedSeller.address}, {selectedSeller.city}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="verification" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <Card className="bg-muted/20 border-border shadow-none">
                                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                                    <ShieldCheck className="h-8 w-8 text-primary opacity-40" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">PAN Number</p>
                                                        <p className="font-bold text-sm">{selectedSeller.panCard || 'Not Uploaded'}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-muted/20 border-border shadow-none">
                                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                                    <ShieldCheck className="h-8 w-8 text-primary opacity-40" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">{selectedSeller.taxName || 'GST Number'}</p>
                                                        <p className="font-bold text-sm">{selectedSeller.taxNumber || 'Not Uploaded'}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-muted/20 border-border shadow-none">
                                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                                    <Store className="h-8 w-8 text-primary opacity-40" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Service Area</p>
                                                        <p className="font-bold text-sm">{selectedSeller.serviceableArea || 'Global'}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 border-dashed">
                                                <Eye className="h-4 w-4" /> View ID Proof
                                            </Button>
                                            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 border-dashed">
                                                <Eye className="h-4 w-4" /> View Address Proof
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="location" className="mt-0 space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <Target className="h-5 w-5 text-primary" />
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">Delivery Radius Control</p>
                                                    <p className="text-xs text-muted-foreground">Set how far the store can deliver from its location.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border border-border">
                                                <Input
                                                    type="number"
                                                    className="w-20 h-8 text-right bg-transparent border-none focus-visible:ring-0 font-bold"
                                                    value={newRadius}
                                                    onChange={(e) => setNewRadius(parseInt(e.target.value))}
                                                />
                                                <span className="text-xs font-bold text-muted-foreground mr-2">KM</span>
                                                <Button size="sm" className="h-7 text-[10px] font-bold uppercase h-8 px-4" onClick={handleUpdateRadius} disabled={isUpdating}>Update</Button>
                                            </div>
                                        </div>
                                        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border bg-muted/20 relative">
                                            {selectedSeller.latitude && selectedSeller.longitude ? (
                                                <SellerServiceMap
                                                    latitude={parseFloat(selectedSeller.latitude)}
                                                    longitude={parseFloat(selectedSeller.longitude)}
                                                    radiusKm={newRadius}
                                                    storeName={selectedSeller.storeName}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                                    <AlertCircle className="h-10 w-10 opacity-20 mb-2" />
                                                    <p className="text-sm font-medium">GPS Coordinates Not Available</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="banking" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <CreditCard className="h-4 w-4" />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Account Information</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Beneficiary Name</p>
                                                        <p className="font-bold text-foreground">{selectedSeller.accountName || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Account Number</p>
                                                        <p className="font-bold text-foreground font-mono tracking-wider">{selectedSeller.accountNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Store className="h-4 w-4" />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Bank Details</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Bank & Branch</p>
                                                        <p className="font-bold text-foreground">{selectedSeller.bankName} - {selectedSeller.branch}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">IFSC Code</p>
                                                        <p className="font-bold text-foreground font-mono">{selectedSeller.ifsc || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>

                            <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-between">
                                <Button variant="ghost" className="text-rose-500 hover:bg-rose-50" onClick={() => setIsEditModalOpen(false)}>Close Manager</Button>
                                {selectedSeller.status === 'Pending' ? (
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 gap-2 font-bold transition-all px-6" onClick={() => handleUpdateStatus(selectedSeller._id, 'Rejected')} disabled={isUpdating}>
                                            <XCircle className="h-4 w-4" /> Reject Store
                                        </Button>
                                        <Button className="bg-primary text-primary-foreground gap-2 font-bold px-8 shadow-lg shadow-primary/20" onClick={() => handleUpdateStatus(selectedSeller._id, 'Approved')} disabled={isUpdating}>
                                            <CheckCircle className="h-4 w-4" /> Verify & Approve
                                        </Button>
                                    </div>
                                ) : (
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10">Save Changes</Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
