import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { getAppSettings, updateAppSettings, AppSettings } from '../../../services/api/admin/adminSettingsService';
import PageHeader from "../components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    CreditCard,
    Truck,
    Route,
    MapPin,
    Banknote,
    Save,
    Percent,
    Settings2,
    ShieldCheck,
    AlertCircle,
    Info,
    Smartphone
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AdminBillingSettings() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [platformFee, setPlatformFee] = useState<number>(0);
    const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(0);
    const [deliveryCharges, setDeliveryCharges] = useState<number>(0);

    // Distance Based Config
    const [isDistanceBased, setIsDistanceBased] = useState(false);
    const [baseCharge, setBaseCharge] = useState<number>(0);
    const [baseDistance, setBaseDistance] = useState<number>(0);
    const [kmRate, setKmRate] = useState<number>(0);
    const [deliveryBoyKmRate, setDeliveryBoyKmRate] = useState<number>(0);
    const [googleMapsKey, setGoogleMapsKey] = useState<string>('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await getAppSettings();
            if (response && response.success && response.data) {
                const data = response.data;
                setPlatformFee(data.platformFee || 0);
                setFreeDeliveryThreshold(data.freeDeliveryThreshold || 0);
                setDeliveryCharges(data.deliveryCharges || 0);

                if (data.deliveryConfig) {
                    setIsDistanceBased(data.deliveryConfig.isDistanceBased || false);
                    setBaseCharge(data.deliveryConfig.baseCharge || 0);
                    setBaseDistance(data.deliveryConfig.baseDistance || 0);
                    setKmRate(data.deliveryConfig.kmRate || 0);
                    setDeliveryBoyKmRate(data.deliveryConfig.deliveryBoyKmRate || 0);
                    setGoogleMapsKey(data.deliveryConfig.googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
                } else {
                    setGoogleMapsKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
                }
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updatePayload: any = {
                platformFee,
                freeDeliveryThreshold,
                deliveryCharges,
                deliveryConfig: {
                    isDistanceBased,
                    baseCharge,
                    baseDistance,
                    kmRate,
                    deliveryBoyKmRate,
                    googleMapsKey
                }
            };

            const response = await updateAppSettings(updatePayload);
            if (response.success) {
                showToast('Billing configurations updated!', 'success');
            } else {
                showToast('Failed to sync settings', 'error');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Error updating settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Monetization & Logistics"
                description="Fine-tune your revenue engine and delivery cost structures."
            >
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 font-black uppercase tracking-widest h-10 shadow-lg shadow-primary/20"
                >
                    {saving ? "Deploying..." : <><Save className="h-4 w-4" /> Save Ledger</>}
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* General Fee Panel */}
                <Card className="border-border bg-card shadow-sm lg:col-span-1">
                    <CardHeader className="bg-primary/5 border-b border-border">
                        <CardTitle className="text-md font-bold flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-primary" /> Core Economics
                        </CardTitle>
                        <CardDescription>Baseline platform charges & dynamic thresholds.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Handling / Platform Fee</Label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={platformFee}
                                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                                    className="pl-9 h-11 bg-muted/30 border-border"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">INR</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground px-1 italic">Applied globally to every check-out event.</p>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Gratis Delivery Floor</Label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={freeDeliveryThreshold}
                                    onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                                    className="pl-9 h-11 bg-muted/30 border-border"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">MIN</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground px-1 italic">Free shipping triggered for carts exceeding this amount.</p>
                        </div>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-[10px] leading-relaxed text-amber-700 font-medium">
                                    Economics directly impact conversion. Ensure thresholds align with average ticket size.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Logistics Engine Panel */}
                <Card className="border-border bg-card shadow-sm lg:col-span-2">
                    <CardHeader className="bg-muted/20 border-b border-border flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-md font-bold">Logistics Pricing Engine</CardTitle>
                            <CardDescription>Define how delivery costs are computed for the platform.</CardDescription>
                        </div>
                        <Settings2 className="h-5 w-5 text-muted-foreground/50" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Tabs value={isDistanceBased ? "distance" : "fixed"} onValueChange={(val) => setIsDistanceBased(val === "distance")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted border border-border">
                                <TabsTrigger value="fixed" className="font-bold text-xs gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                                    <ShieldCheck className="h-4 w-4" /> Fixed Rate Model
                                </TabsTrigger>
                                <TabsTrigger value="distance" className="font-bold text-xs gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                                    <Route className="h-4 w-4" /> Distance Matrix V2
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="fixed" className="pt-8 space-y-6">
                                <div className="space-y-1.5 max-w-xs">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Flat Delivery Surcharge</Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={deliveryCharges}
                                            onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                            className="pl-9 h-11 bg-muted/30 border-border"
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic">Standard fee for all deliveries under the floor threshold.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="distance" className="pt-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Base Logistics Fee</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={baseCharge}
                                                    onChange={(e) => setBaseCharge(Number(e.target.value))}
                                                    className="h-11 bg-muted/30 border-border"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black">INR</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Base Distance Unit</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={baseDistance}
                                                    onChange={(e) => setBaseDistance(Number(e.target.value))}
                                                    className="h-11 bg-muted/30 border-border"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary">KM</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Marginal Per-KM Charge</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={kmRate}
                                                    onChange={(e) => setKmRate(Number(e.target.value))}
                                                    className="h-11 bg-muted/30 border-border"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-500">+ INR</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Agent Micro-Commission</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={deliveryBoyKmRate}
                                                    onChange={(e) => setDeliveryBoyKmRate(Number(e.target.value))}
                                                    className="h-11 bg-muted/30 border-border"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600">INC/KM</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Geospatial Intelligence Key</Label>
                                        <Badge variant="outline" className="text-[8px] bg-blue-500/5 text-blue-600">GOOGLE MAPS PLATFORM</Badge>
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={googleMapsKey}
                                            onChange={(e) => setGoogleMapsKey(e.target.value)}
                                            placeholder="AIzaSyA..."
                                            className="pl-10 h-11 bg-muted/30 border-border font-mono text-xs"
                                        />
                                    </div>
                                    <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                        <p className="text-[9px] leading-relaxed text-blue-700 font-medium italic">
                                            Distance-based fee computation requires an active Places/Distance Matrix API key.
                                            Fallback to straight-line distance if key is invalid.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-center gap-6 py-12 opacity-20 pointer-events-none grayscale">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">PCI-DSS COMPLIANT</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                    <Smartphone className="h-6 w-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">APP-SYNC v4.1</span>
                </div>
            </div>
        </div>
    );
}
