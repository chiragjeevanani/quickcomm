import { useState, useEffect } from 'react';
import { getAllSellers, Seller as SellerType } from '../../../services/api/sellerService';
import SellerServiceMap from '../components/SellerServiceMap';
import PageHeader from "../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  MapPin,
  Search,
  Store,
  User,
  Phone,
  Mail,
  Navigation,
  FilterX,
  Globe,
  Compass,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  LocateFixed
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface Seller {
  _id: string;
  sellerName: string;
  storeName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  searchLocation?: string;
  latitude?: string;
  longitude?: string;
  serviceRadiusKm?: number;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export default function AdminSellerLocation() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const response = await getAllSellers();
        if (response.success && response.data) {
          const mappedSellers: Seller[] = response.data.map((seller: SellerType) => ({
            _id: seller._id,
            sellerName: seller.sellerName || 'Unknown',
            storeName: seller.storeName || 'Unknown Store',
            email: seller.email || '',
            phone: seller.mobile || '',
            address: seller.address,
            city: seller.city,
            searchLocation: seller.searchLocation,
            latitude: seller.latitude,
            longitude: seller.longitude,
            serviceRadiusKm: seller.serviceRadiusKm,
            status: seller.status || 'Pending',
          }));

          const sellersWithLocation = mappedSellers.filter(
            (seller) => seller.latitude && seller.longitude
          );

          setSellers(sellersWithLocation);
          if (sellersWithLocation.length > 0) setSelectedSeller(sellersWithLocation[0]);
        }
      } catch (error) {
        console.error('Error fetching sellers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || seller.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'Pending': return <Clock className="h-3 w-3 mr-1" />;
      case 'Rejected': return <XCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Rejected': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geospatial Intelligence"
        description="Monitor seller operating zones and service radius across the platform landscape."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 border-border">
            <Globe className="h-4 w-4" /> Global Matrix
          </Button>
          <Button className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20">
            <Compass className="h-4 w-4" /> Calibration
          </Button>
        </div>
      </PageHeader>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Universal Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, store, city, or address..."
                className="pl-9 h-11 bg-muted/20 border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Registry Status</Label>
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="h-11 bg-muted/20 border-border">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Operations</SelectItem>
                <SelectItem value="Approved">Approved Only</SelectItem>
                <SelectItem value="Pending">Pending Audit</SelectItem>
                <SelectItem value="Rejected">Rejected Nodes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" className="h-11 gap-2 text-muted-foreground hover:text-foreground" onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}>
            <FilterX className="h-4 w-4" /> Reset
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Section */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="border-border bg-card shadow-lg overflow-hidden border-2 border-primary/10">
            <div className="h-1 bg-primary/20 w-full" />
            <CardContent className="p-0">
              <div className="h-[500px] w-full relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm z-10">
                    <Activity className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                ) : selectedSeller && selectedSeller.latitude && selectedSeller.longitude ? (
                  <SellerServiceMap
                    latitude={parseFloat(selectedSeller.latitude)}
                    longitude={parseFloat(selectedSeller.longitude)}
                    radiusKm={selectedSeller.serviceRadiusKm || 10}
                    storeName={selectedSeller.storeName}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-muted/10 text-muted-foreground/50 border-4 border-dashed border-border m-4 rounded-3xl">
                    <LocateFixed className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-sm font-black uppercase tracking-widest">Awaiting Spatial Input</p>
                    <p className="text-[10px] mt-2 font-medium">Select a node from the registry to initialize mapping.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedSeller && (
            <Card className="border-border bg-gradient-to-br from-card to-muted/30 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-md font-bold">{selectedSeller.storeName}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Active Operations Zone</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3 w-3" /> Location Geometry
                  </Label>
                  <p className="text-xs font-bold leading-relaxed">{selectedSeller.address || "N/A"}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">{selectedSeller.city || "Registry Hidden"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 mb-2">
                    <User className="h-3 w-3" /> Administrative Lead
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 text-[9px] font-black tracking-tighter bg-primary/5 text-primary">ADMIN</Badge>
                    <p className="text-xs font-bold">{selectedSeller.sellerName}</p>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                      <Phone className="h-2.5 w-2.5" /> {selectedSeller.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                      <Mail className="h-2.5 w-2.5" /> {selectedSeller.email}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 mb-2">
                    <LocateFixed className="h-3 w-3" /> Telemetry Data
                  </Label>
                  <div className="flex flex-col gap-2">
                    <Badge className={`w-fit uppercase text-[10px] font-black tracking-[0.1em] px-3 py-1 border ${getStatusStyles(selectedSeller.status)}`}>
                      {getStatusIcon(selectedSeller.status)} {selectedSeller.status}
                    </Badge>
                    <div className="p-3 rounded-xl bg-background/50 border border-border shadow-inner mt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground">Radius:</span>
                        <span className="text-primary">{selectedSeller.serviceRadiusKm} KM</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (selectedSeller.serviceRadiusKm || 0) * 5)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sellers List Section */}
        <div className="lg:col-span-4 h-full flex flex-col gap-4">
          <Card className="border-border bg-card shadow-sm flex-1 flex flex-col overflow-hidden max-h-[750px]">
            <CardHeader className="bg-muted/10 border-b border-border py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                Node Registry
                <Badge variant="outline" className="font-mono text-[10px]">{filteredSellers.length} NODES</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto custom-scrollbar">
              {filteredSellers.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">No matching nodes identified.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredSellers.map((seller) => (
                    <button
                      key={seller._id}
                      onClick={() => setSelectedSeller(seller)}
                      className={`w-full p-5 text-left transition-all relative group flex items-start gap-4 ${selectedSeller?._id === seller._id
                          ? 'bg-primary/5 border-l-4 border-l-primary'
                          : 'hover:bg-muted/50 border-l-4 border-l-transparent'
                        }`}
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${selectedSeller?._id === seller._id
                          ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20'
                          : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:shadow-sm'
                        }`}>
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-black text-xs uppercase tracking-tight truncate transition-colors ${selectedSeller?._id === seller._id ? 'text-primary' : 'text-foreground'
                            }`}>
                            {seller.storeName}
                          </h3>
                          <Badge className={`text-[8px] font-black tracking-widest px-1.5 h-4 border ${getStatusStyles(seller.status)}`}>
                            {seller.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mb-2">{seller.sellerName}</p>
                        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/60 font-medium">
                          <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {seller.city}</span>
                          <span className="flex items-center gap-1"><Navigation className="h-2.5 w-2.5" /> {seller.serviceRadiusKm}km</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-4 bg-muted/20 border border-border rounded-xl flex flex-col gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Encryption Bridge Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Spatial Sync Protocol 7.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
