import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon, LogOut, ChevronRight, ShoppingBag,
  HelpCircle, Book, Heart, FileText, Info, Phone,
  Calendar, CheckCircle2, MapPin, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, CustomerProfile } from '../../services/api/customerService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Account() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstNumber, setGstNumber] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getProfile();
        if (response.success) {
          setProfile(response.data);
        } else {
          setError('Failed to load profile');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
        if (err.response?.status === 401) {
          authLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, navigate, authLogout]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleGstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGstModal(false);
  };

  // Show login/signup prompt for unregistered users
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Modern Header for Guest */}
        <div className="relative h-[45vh] overflow-hidden flex flex-col justify-end px-8 pb-12">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-green-100/50 to-white" />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-green-400 rounded-full blur-[100px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1.2 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 1 }}
            className="absolute top-1/2 -left-24 w-64 h-64 bg-teal-400 rounded-full blur-[80px]"
          />

          <div className="relative z-10 max-w-2xl mx-auto w-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl shadow-green-200 flex items-center justify-center mx-auto mb-8 border-4 border-white"
            >
              <UserIcon size={40} className="text-green-600" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black text-neutral-900 uppercase tracking-tighter mb-4"
            >
              Unlock More
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-bold text-neutral-500 uppercase tracking-widest"
            >
              Login to access your orders & profile
            </motion.p>
          </div>
        </div>

        <div className="px-8 -mt-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto"
          >
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-16 rounded-[2rem] bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-green-200 group"
            >
              <span>Get Started</span>
              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="text-center p-4">
                <p className="text-xl font-black text-neutral-900">20k+</p>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Happy Users</p>
              </div>
              <div className="text-center p-4 border-l border-neutral-100">
                <p className="text-xl font-black text-neutral-900">50+</p>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Cities</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header Skeleton */}
        <div className="relative h-[40vh] overflow-hidden flex flex-col justify-end px-8 pb-12 bg-neutral-900">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
              <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem]" />
              <div className="text-center md:text-left flex-1 space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex gap-6 justify-center md:justify-start">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 lg:px-12 -mt-8 relative z-20">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-[2rem]" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3 w-32 ml-2" />
              <div className="space-y-2">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="pb-24 md:pb-8 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-teal-600 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'User';
  const displayPhone = profile?.phone || user?.phone || '';
  const displayDateOfBirth = profile?.dateOfBirth;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Premium Profile Header */}
      <div className="relative h-[40vh] overflow-hidden flex flex-col justify-end px-8 pb-12">
        <div className="absolute inset-0 bg-neutral-900" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-24 -right-24 w-[30rem] h-[30rem] bg-green-500 rounded-full blur-[120px]"
        />

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] bg-white p-2 shadow-2xl relative"
            >
              <div className="w-full h-full rounded-[2.5rem] bg-neutral-100 flex items-center justify-center overflow-hidden">
                <UserIcon size={64} className="text-neutral-300" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 size={24} />
              </div>
            </motion.div>

            <div className="text-center md:text-left flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row items-center md:items-baseline gap-2 md:gap-4 mb-2"
              >
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                  {displayName}
                </h1>
                <Badge className="bg-green-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3">
                  Verified
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6"
              >
                <div className="flex items-center gap-2 text-white/60 font-bold text-sm">
                  <Phone size={16} className="text-green-500" />
                  <span>{displayPhone}</span>
                </div>
                {displayDateOfBirth && (
                  <div className="flex items-center gap-2 text-white/60 font-bold text-sm">
                    <Calendar size={16} className="text-green-500" />
                    <span>{formatDate(displayDateOfBirth)}</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 lg:px-12 -mt-8 relative z-20">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Business & Seller Actions */}
          {user?.userType === 'Seller' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] ml-2">Shop Management</h3>
              <Card
                onClick={() => navigate('/seller')}
                className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] border-green-100 p-6 flex items-center justify-between bg-gradient-to-br from-green-50 to-white"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-200">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-neutral-900 uppercase tracking-tight">Seller Dashboard</span>
                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest opacity-80">Manage your store & orders</span>
                  </div>
                </div>
                <ChevronRight className="text-green-600 group-hover:translate-x-1 transition-transform" />
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] ml-2">Business Opportunities</h3>
              <Card
                onClick={() => navigate('/seller/login')}
                className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] border-neutral-100 p-6 flex items-center justify-between bg-white border-dashed border-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-neutral-900 uppercase tracking-tight">Sell on Dhakad Snazzy</span>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest group-hover:text-green-600 transition-colors">Start your business today</span>
                  </div>
                </div>
                <ChevronRight className="text-neutral-300 group-hover:text-green-600 group-hover:translate-x-1 transition-transform" />
              </Card>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Orders', icon: ShoppingBag, color: 'blue', path: '/orders' },
              { label: 'Wishlist', icon: Heart, color: 'red', path: '/wishlist' },
              { label: 'Saved Addresses', icon: MapPin, color: 'orange', path: '/address-book' },
              { label: 'Support', icon: HelpCircle, color: 'purple', path: '/faq' },
            ].map((item, i) => (
              <Card
                key={i}
                onClick={() => navigate(item.path)}
                className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] border-neutral-100 p-6 flex flex-col items-center text-center bg-white"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                  `bg-${item.color}-50 text-${item.color}-600 group-hover:bg-${item.color}-100`
                )}>
                  <item.icon size={28} />
                </div>
                <span className="text-sm font-black text-neutral-900 uppercase tracking-tighter">{item.label}</span>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] ml-2">Personal Management</h3>
            <div className="grid gap-2">
              {[
                { label: 'About Us', icon: Info, onClick: () => navigate('/about-us') },
                { label: 'GST Details', icon: FileText, onClick: () => setShowGstModal(true) },
                { label: 'Legal & Privacy', icon: Book, onClick: () => { } },
              ].map((item, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  onClick={item.onClick}
                  className="w-full h-16 rounded-2xl justify-between px-6 hover:bg-neutral-50 group border border-transparent hover:border-neutral-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-white group-hover:text-green-600 transition-colors">
                      <item.icon size={20} />
                    </div>
                    <span className="text-sm font-black text-neutral-900 uppercase tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
                </Button>
              ))}

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full h-16 rounded-2xl justify-between px-6 hover:bg-red-50 group border border-transparent hover:border-red-100 mt-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white transition-colors">
                    <LogOut size={20} />
                  </div>
                  <span className="text-sm font-black text-red-600 uppercase tracking-tight">Sign Out</span>
                </div>
                <ChevronRight size={18} className="text-red-200 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* GST Sheet Modal */}
      <Sheet open={showGstModal} onOpenChange={setShowGstModal}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-0 overflow-hidden border-none max-w-2xl mx-auto h-[60vh]">
          <div className="h-full flex flex-col bg-white">
            <div className="px-8 pt-8 pb-4 border-b border-neutral-100">
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl font-black text-neutral-900 uppercase tracking-tighter">Business profile</SheetTitle>
                <p className="text-sm font-bold text-neutral-500 mt-1">Add GST details for tax invoices</p>
              </SheetHeader>
            </div>

            <div className="p-8 flex-1 overflow-y-auto bg-neutral-50/30">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">GSTIN Number</label>
                  <Input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="27AAAAA0000A1Z5"
                    className="h-16 rounded-3xl border-2 border-neutral-100 focus-visible:border-green-600 focus-visible:ring-0 text-lg font-black tracking-widest"
                  />
                  <div className="flex items-start gap-3 mt-4 p-4 rounded-2xl bg-white border border-neutral-100">
                    <Info size={18} className="text-green-600 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-neutral-500 leading-relaxed">
                      By providing your GSTIN, you'll be able to claim input tax credit on eligible business purchases. Ensure the name matches your GST registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-neutral-100">
              <Button
                disabled={!gstNumber.trim()}
                onClick={handleGstSubmit}
                className="w-full h-16 rounded-3xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-green-200"
              >
                Save Business Profile
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
