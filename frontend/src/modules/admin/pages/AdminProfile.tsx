import { useState, useEffect } from 'react';
import { getProfile, updateProfile, type AdminProfile as AdminProfileType } from '../../../services/api/admin/adminProfileService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from "../../../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    Mail,
    Phone,
    Shield,
    Calendar,
    Edit2,
    Save,
    X,
    Camera,
    ChevronRight,
    Verified,
    Activity,
    Clock,
    UserCircle2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AdminProfile() {
    const { isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<AdminProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await getProfile();
                if (response.success && response.data) {
                    setProfile(response.data);
                    setFormData({
                        firstName: response.data.firstName,
                        lastName: response.data.lastName,
                        email: response.data.email,
                        mobile: response.data.mobile,
                    });
                }
            } catch (err) {
                showToast('Failed to load profile intelligence', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [isAuthenticated]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) return showToast('Full name required', 'warning');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return showToast('Valid email required', 'warning');
        if (!/^[0-9]{10}$/.test(formData.mobile)) return showToast('10-digit mobile required', 'warning');

        try {
            setSaving(true);
            const response = await updateProfile(formData);
            if (response.success && response.data) {
                setProfile(response.data);
                showToast('Master identity synchronized!', 'success');
                setIsEditing(false);

                const userData = localStorage.getItem('userData');
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    Object.assign(parsedData, formData);
                    localStorage.setItem('userData', JSON.stringify(parsedData));
                }
            }
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Synchronization failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                mobile: profile.mobile,
            });
        }
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Admin Identity"
                description="Manage your platform credentials and administrative profile."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Identity Card */}
                <Card className="border-border bg-card shadow-sm lg:col-span-1 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/80 to-primary relative">
                        <div className="absolute inset-0 bg-grid-white/10" />
                    </div>
                    <CardContent className="pt-0 -mt-16 flex flex-col items-center text-center pb-8 px-6">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-card shadow-xl">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-black">
                                    {profile.firstName[0]}{profile.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-white shadow-md border border-border flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-all">
                                <Camera className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2 justify-center">
                                {profile.firstName} {profile.lastName}
                                <Verified className="h-5 w-5 text-primary fill-primary/10" />
                            </h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{profile.role}</p>
                        </div>

                        <div className="grid grid-cols-2 w-full gap-4 mt-8 pt-8 border-t border-border">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</span>
                                <Badge className="mt-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm">
                                    <Activity className="h-3 w-3 mr-1" /> ACTIVE
                                </Badge>
                            </div>
                            <div className="flex flex-col items-center border-l border-border">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Node ID</span>
                                <span className="mt-1 font-mono text-[10px] font-bold bg-muted px-2 py-0.5 rounded">SYSTEM_ROOT</span>
                            </div>
                        </div>

                        <div className="w-full mt-6 space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-medium p-3 bg-muted/20 border border-border/50 rounded-xl">
                                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Established</span>
                                <span className="text-foreground">{new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Intelligence Matrix (Form) */}
                <Card className="border-border bg-card shadow-sm lg:col-span-2">
                    <CardHeader className="border-b border-border bg-muted/10 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Profile Intelligence</CardTitle>
                                <CardDescription>Synchronize your personal data with the core system.</CardDescription>
                            </div>
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-2 font-bold uppercase tracking-tight h-9">
                                    <Edit2 className="h-4 w-4" /> Edit Core
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Given Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        readOnly={!isEditing}
                                        className={`pl-9 h-11 bg-muted/30 border-border font-medium ${!isEditing && 'opacity-70 grayscale pointer-events-none'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Family Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        readOnly={!isEditing}
                                        className={`pl-9 h-11 bg-muted/30 border-border font-medium ${!isEditing && 'opacity-70 grayscale pointer-events-none'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">System Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        readOnly={!isEditing}
                                        className={`pl-9 h-11 bg-muted/30 border-border font-medium ${!isEditing && 'opacity-70 grayscale pointer-events-none'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Mobile Access Line</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        readOnly={!isEditing}
                                        maxLength={10}
                                        className={`pl-9 h-11 bg-muted/30 border-border font-medium ${!isEditing && 'opacity-70 grayscale pointer-events-none'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 opacity-50">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Security Role</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        value={profile.role}
                                        readOnly
                                        className="pl-9 h-11 bg-muted border-border font-black text-xs uppercase tracking-widest pointer-events-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex items-center gap-3 pt-6 border-t border-border">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="gap-2 font-black uppercase tracking-widest h-11 px-8 shadow-lg shadow-primary/20"
                                >
                                    {saving ? "Syncing..." : <><Save className="h-4 w-4" /> Update Matrix</>}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleCancel}
                                    className="gap-2 font-bold uppercase tracking-tight h-11 px-8 text-muted-foreground"
                                >
                                    <X className="h-4 w-4" /> Abort
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-center p-12 opacity-10 pointer-events-none grayscale">
                <UserCircle2 className="h-12 w-12" />
                <Separator orientation="vertical" className="h-8 mx-6" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proprietary Admin Engine</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Version Alpha-9 • Multi-factor Enabled</span>
                </div>
            </div>
        </div>
    );
}
