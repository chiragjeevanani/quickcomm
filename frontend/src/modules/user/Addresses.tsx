import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Plus, MapPin, Home,
    Briefcase, Trash2, Edit2, CheckCircle2,
    Search, Navigation, ChevronRight, MoreVertical,
    Phone
} from 'lucide-react';
import { getAddresses, deleteAddress, Address } from '../../services/api/customerAddressService';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Addresses() {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const res = await getAddresses();
            if (res.success && Array.isArray(res.data)) {
                setAddresses(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        if (!window.confirm('Are you sure you want to delete this address?')) return;

        try {
            await deleteAddress(id);
            setAddresses(addresses.filter(a => a._id !== id));
        } catch (error) {
            console.error('Failed to delete address:', error);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50/30 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-neutral-100 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-xl hover:bg-neutral-100"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">Saved Addresses</h1>
                    </div>
                    <Button
                        onClick={() => navigate('/checkout/address')}
                        className="h-12 px-6 rounded-2xl bg-neutral-900 hover:bg-green-600 text-white font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        <Plus size={16} className="mr-2" />
                        Add New
                    </Button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="rounded-[2.5rem] border-neutral-100 bg-white p-8 overflow-hidden">
                                <div className="flex items-start gap-6">
                                    <Skeleton className="w-16 h-16 rounded-[1.5rem] flex-shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-6 w-1/2" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-neutral-50 flex justify-between">
                                    <div className="flex gap-4">
                                        <Skeleton className="h-3 w-12" />
                                        <Skeleton className="h-3 w-8" />
                                    </div>
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : addresses.length > 0 ? (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {addresses.map((addr) => (
                                <motion.div
                                    key={addr._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="rounded-[2.5rem] border-neutral-100 bg-white p-8 shadow-sm hover:shadow-xl hover:shadow-neutral-200/50 transition-all group overflow-hidden relative">
                                        {addr.isDefault && (
                                            <div className="absolute top-0 right-0">
                                                <div className="bg-green-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                                                    Default
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-6">
                                            <div className={cn(
                                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110",
                                                addr.type === 'Home' ? 'bg-blue-50 text-blue-600' :
                                                    addr.type === 'Work' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                                            )}>
                                                {addr.type === 'Home' ? <Home size={28} /> :
                                                    addr.type === 'Work' ? <Briefcase size={28} /> : <Navigation size={28} />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tighter truncate">
                                                        {addr.fullName}
                                                    </h3>
                                                    <Badge variant="outline" className="rounded-lg border-neutral-100 font-black text-[8px] px-2 py-0 uppercase tracking-widest">
                                                        {addr.type}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-neutral-500 leading-relaxed uppercase tracking-tight line-clamp-2">
                                                        {addr.address}
                                                    </p>
                                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                                                        {addr.city}, {addr.pincode}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-4 text-neutral-900 font-bold text-xs uppercase tracking-tight">
                                                        <Phone size={14} className="text-neutral-300" />
                                                        {addr.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-neutral-50 flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleDelete(addr._id)}
                                                    className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-[0.2em] transition-colors"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    className="text-[10px] font-black text-neutral-400 hover:text-neutral-900 uppercase tracking-[0.2em] transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </div>

                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-neutral-50">
                                                <MoreVertical size={18} className="text-neutral-300" />
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-100 flex items-center justify-center text-neutral-300 mb-8">
                            <MapPin size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter mb-2">No addresses yet</h2>
                        <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8">Add your delivery locations for faster checkout</p>
                        <Button
                            onClick={() => navigate('/checkout/address')}
                            className="h-16 px-12 rounded-3xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200"
                        >
                            Add New Address
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
