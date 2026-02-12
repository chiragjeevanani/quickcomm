import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Store,
    Palette,
    CreditCard,
    Lock,
    Save,
    MapPin,
    Camera,
    CheckCircle2,
    Info
} from "lucide-react";

import { getSellerProfile, updateSellerProfile } from "../../../services/api/auth/sellerAuthService";
import { useAuth } from "../../../context/AuthContext";
import { getCategories, Category } from "../../../services/api/categoryService";
import GoogleMapsAutocomplete from "../../../components/GoogleMapsAutocomplete";
import LocationPickerMap from "../../../components/LocationPickerMap";
import { useToast } from "@/context/ToastContext";
import { fadeIn } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SellerAccountSettings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saveLoading, setSaveLoading] = useState(false);
    const { showToast } = useToast();

    const [sellerData, setSellerData] = useState({
        sellerName: "",
        email: "",
        mobile: "",
        storeName: "",
        category: "",
        address: "",
        city: "",
        searchLocation: "",
        latitude: "",
        longitude: "",
        serviceRadiusKm: "10",
        panCard: "",
        taxName: "",
        taxNumber: "",
        accountName: "",
        bankName: "",
        branch: "",
        accountNumber: "",
        ifsc: "",
        profile: "",
        logo: "",
        storeBanner: "",
        storeDescription: "",
        commission: 0,
        status: ""
    });

    useEffect(() => {
        fetchProfile();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await getCategories();
            if (res.success) setCategories(res.data);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await getSellerProfile();
            if (response.success) {
                const data = response.data;
                const locationCoords = data.location?.coordinates || [];
                setSellerData({
                    ...data,
                    latitude: data.latitude || (locationCoords[1]?.toString() || ""),
                    longitude: data.longitude || (locationCoords[0]?.toString() || ""),
                    searchLocation: data.searchLocation || data.address || "",
                    serviceRadiusKm: (data.serviceRadiusKm || 10).toString(),
                });
            } else {
                showToast(response.message || "Failed to fetch profile", "error");
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || "Error loading profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSellerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setSellerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaveLoading(true);

            if (sellerData.searchLocation && (!sellerData.latitude || !sellerData.longitude)) {
                showToast("Please select a valid location using the map picker", "error");
                return;
            }

            const radius = parseFloat(sellerData.serviceRadiusKm);
            if (isNaN(radius) || radius < 0.1 || radius > 100) {
                showToast("Service radius must be between 0.1 and 100 kilometers", "error");
                return;
            }

            const response = await updateSellerProfile({
                ...sellerData,
                serviceRadiusKm: radius,
            });

            if (response.success) {
                setIsEditing(false);
                const data = response.data;
                const locationCoords = data.location?.coordinates || [];
                setSellerData({
                    ...data,
                    latitude: data.latitude || (locationCoords[1]?.toString() || ""),
                    longitude: data.longitude || (locationCoords[0]?.toString() || ""),
                    searchLocation: data.searchLocation || data.address || "",
                    serviceRadiusKm: (data.serviceRadiusKm || 10).toString(),
                });
                if (updateUser) {
                    updateUser({
                        ...user,
                        ...data,
                        id: data._id || user?.id
                    });
                }
                showToast("Profile updated successfully", "success");
            } else {
                showToast(response.message || "Failed to update profile", "error");
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || "Error updating profile", "error");
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
                <div className="h-10 w-48 bg-muted rounded"></div>
                <div className="flex gap-6">
                    <div className="w-1/4 h-[400px] bg-muted/50 rounded"></div>
                    <div className="w-3/4 h-[600px] bg-muted/50 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
                    <p className="text-sm text-muted-foreground font-bold tracking-tight">Manage your profile, store details, and branding</p>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" className="border-border text-foreground hover:bg-accent" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={saveLoading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saveLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Sidebar Info Card */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="border-border bg-card overflow-hidden">
                        <div className="h-24 bg-primary relative">
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-full border-4 border-card bg-card overflow-hidden shadow-md">
                                        <img
                                            src={sellerData.profile || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {isEditing && (
                                        <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-4 h-4 text-white" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-12 pb-6 text-center">
                            <h3 className="font-bold text-foreground">{sellerData.sellerName}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{sellerData.email}</p>
                            <Badge className="mt-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                {sellerData.status || "Active"}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="py-4 border-b border-border">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4 pb-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-bold">Commission</span>
                                <span className="font-bold text-foreground">{sellerData.commission}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-bold">Service Radius</span>
                                <span className="font-bold text-foreground">{sellerData.serviceRadiusKm} KM</span>
                            </div>
                            <div className="pt-2 border-t border-border flex items-center gap-2 text-[10px] text-primary font-bold bg-primary/10 p-2 rounded uppercase tracking-tighter">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified Seller Account
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs Content */}
                <div className="lg:col-span-9">
                    <Tabs defaultValue="profile" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-4 w-full bg-muted/50 h-11 p-1 mb-6 border border-border shadow-sm">
                            <TabsTrigger value="profile" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                <User className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Profile</span>
                            </TabsTrigger>
                            <TabsTrigger value="store" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                <Store className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Store</span>
                            </TabsTrigger>
                            <TabsTrigger value="branding" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                <Palette className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Branding</span>
                            </TabsTrigger>
                            <TabsTrigger value="bank" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                <CreditCard className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Billing</span>
                            </TabsTrigger>
                        </TabsList>

                        <AnimatePresence mode="wait">
                            <TabsContent value="profile" className="mt-0 outline-none">
                                <Card className="border-border bg-card">
                                    <CardHeader className="border-b border-border">
                                        <CardTitle className="text-lg text-foreground">Personal Information</CardTitle>
                                        <CardDescription className="text-muted-foreground">Update your personal details and contact info</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Full Name</Label>
                                                <Input
                                                    name="sellerName"
                                                    value={sellerData.sellerName}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="border-border bg-background text-foreground focus:ring-primary h-11 shadow-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Email Address</Label>
                                                <Input
                                                    name="email"
                                                    value={sellerData.email}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    type="email"
                                                    className="border-border bg-background text-foreground focus:ring-primary h-11 shadow-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Mobile Number</Label>
                                                <Input
                                                    name="mobile"
                                                    value={sellerData.mobile}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    type="tel"
                                                    className="border-border bg-background text-foreground focus:ring-primary h-11 shadow-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Account Status</Label>
                                                <Input
                                                    value={sellerData.status || "Active"}
                                                    disabled={true}
                                                    className="bg-muted border-border text-muted-foreground h-11"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="store" className="mt-0 outline-none">
                                <Card className="border-border bg-card">
                                    <CardHeader className="border-b border-border">
                                        <CardTitle className="text-lg text-foreground">Store Configuration</CardTitle>
                                        <CardDescription className="text-muted-foreground">Basic store details and delivery settings</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Store Name</Label>
                                                <Input
                                                    name="storeName"
                                                    value={sellerData.storeName}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="border-border bg-background text-foreground focus:ring-primary h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Primary Category</Label>
                                                <Select
                                                    disabled={!isEditing}
                                                    value={sellerData.category}
                                                    onValueChange={(val) => handleSelectChange("category", val)}
                                                >
                                                    <SelectTrigger className="border-border bg-background text-foreground h-11">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover text-popover-foreground border-border">
                                                        {categories.map(cat => (
                                                            <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">City</Label>
                                                <Input
                                                    name="city"
                                                    value={sellerData.city}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="border-border bg-background text-foreground h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Service Radius (KM)</Label>
                                                <Select
                                                    disabled={!isEditing}
                                                    value={sellerData.serviceRadiusKm}
                                                    onValueChange={(val) => handleSelectChange("serviceRadiusKm", val)}
                                                >
                                                    <SelectTrigger className="border-border bg-background text-foreground h-11">
                                                        <SelectValue placeholder="Radius" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover text-popover-foreground border-border">
                                                        <SelectItem value="1">1 KM</SelectItem>
                                                        <SelectItem value="2">2 KM</SelectItem>
                                                        <SelectItem value="5">5 KM</SelectItem>
                                                        <SelectItem value="10">10 KM</SelectItem>
                                                        <SelectItem value="20">20 KM</SelectItem>
                                                        <SelectItem value="50">50 KM</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-border">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-1.5 text-foreground">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    Store Location Address
                                                </Label>
                                                {isEditing ? (
                                                    <div className="space-y-4">
                                                        <GoogleMapsAutocomplete
                                                            value={sellerData.searchLocation || sellerData.address || ""}
                                                            onChange={(address: string, lat: number, lng: number, placeName: string, components?: { city?: string; state?: string }) => {
                                                                setSellerData(prev => ({
                                                                    ...prev,
                                                                    searchLocation: address,
                                                                    latitude: lat.toString(),
                                                                    longitude: lng.toString(),
                                                                    address: address,
                                                                    city: components?.city || prev.city,
                                                                }));
                                                            }}
                                                            placeholder="Search your store address..."
                                                            disabled={!isEditing}
                                                        />
                                                        <div className="h-[250px] rounded-lg border border-border overflow-hidden shadow-inner">
                                                            <LocationPickerMap
                                                                initialLat={parseFloat(sellerData.latitude) || 26.9124}
                                                                initialLng={parseFloat(sellerData.longitude) || 75.7873}
                                                                onLocationSelect={(lat, lng) => {
                                                                    setSellerData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="p-3 bg-muted/50 rounded text-[10px] text-muted-foreground font-bold uppercase tracking-tighter border border-border flex items-center gap-2">
                                                            <Info className="w-3.5 h-3.5 text-primary" />
                                                            Drag the marker to pinpoint your store's exact entrance for deliveries.
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Textarea
                                                        value={sellerData.address || sellerData.searchLocation || ""}
                                                        disabled={true}
                                                        rows={2}
                                                        className="bg-muted border-border text-muted-foreground resize-none opacity-80"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="branding" className="mt-0 outline-none">
                                <Card className="border-border bg-card">
                                    <CardHeader className="border-b border-border">
                                        <CardTitle className="text-lg text-foreground">Store Branding</CardTitle>
                                        <CardDescription className="text-muted-foreground">Customize how customers see your store on the app</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="space-y-3">
                                            <Label className="text-foreground">Store Banner (1200x400 recommended)</Label>
                                            <div className="relative group rounded-xl overflow-hidden bg-muted border border-border aspect-[21/9] shadow-inner">
                                                <img
                                                    src={sellerData.storeBanner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop"}
                                                    alt="Banner"
                                                    className="w-full h-full object-cover"
                                                />
                                                {isEditing && (
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="sm" variant="secondary" className="gap-2 shadow-lg">
                                                            <Camera className="w-4 h-4" /> Change Banner
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-1 space-y-3">
                                                <Label className="text-foreground">Store Logo</Label>
                                                <div className="relative group w-32 h-32 rounded-xl border border-border bg-background overflow-hidden p-2 shadow-sm">
                                                    <img
                                                        src={sellerData.logo || "https://api.dicebear.com/7.x/initials/svg?seed=" + (sellerData.storeName || "ST")}
                                                        alt="Logo"
                                                        className="w-full h-full object-contain"
                                                    />
                                                    {isEditing && (
                                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Camera className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <Label className="text-foreground">Store Description</Label>
                                                <Textarea
                                                    name="storeDescription"
                                                    value={sellerData.storeDescription || ""}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    rows={5}
                                                    placeholder="Welcome to our store! We specialize in fresh organic produce..."
                                                    className="border-border bg-background text-foreground focus:ring-primary shadow-xs resize-none h-32"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="bank" className="mt-0 outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-border bg-card">
                                        <CardHeader className="border-b border-border">
                                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                                <CreditCard className="w-5 h-5 text-indigo-500" />
                                                Bank Details
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground">Payout destination data</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-6">
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Account Name</Label>
                                                <Input name="accountName" value={sellerData.accountName} onChange={handleInputChange} disabled={!isEditing} className="border-border bg-background text-foreground h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Bank Name</Label>
                                                <Input name="bankName" value={sellerData.bankName} onChange={handleInputChange} disabled={!isEditing} className="border-border bg-background text-foreground h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Account Number</Label>
                                                <Input name="accountNumber" value={sellerData.accountNumber} onChange={handleInputChange} disabled={!isEditing} className="border-border bg-background text-foreground h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">IFSC Code</Label>
                                                <Input name="ifsc" value={sellerData.ifsc} onChange={handleInputChange} disabled={!isEditing} className="border-border bg-background text-foreground h-11 uppercase" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border bg-card">
                                        <CardHeader className="border-b border-border">
                                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                                <Lock className="w-5 h-5 text-rose-500" />
                                                Tax Information
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground">Required for regulatory compliance</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-6">
                                            <div className="space-y-2">
                                                <Label className="text-foreground">PAN Card Number</Label>
                                                <Input name="panCard" value={sellerData.panCard} onChange={handleInputChange} disabled={!isEditing} className="border-border bg-background text-foreground h-11 uppercase" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Tax Number (GST)</Label>
                                                <Input name="taxNumber" value={sellerData.taxNumber} onChange={handleInputChange} disabled={!isEditing} className="border-border bg-background text-foreground h-11 uppercase" />
                                            </div>
                                            <div className="mt-8 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 flex gap-3">
                                                <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter leading-relaxed">
                                                    Changing bank or tax details will require admin re-verification before next payout.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </AnimatePresence>
                    </Tabs>
                </div>
            </div>
        </motion.div>
    );
};

export default SellerAccountSettings;
