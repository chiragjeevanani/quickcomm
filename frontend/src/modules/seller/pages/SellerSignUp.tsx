import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Store,
  MapPin,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Building,
  Mail,
  Smartphone,
  Info,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { register, sendOTP, verifyOTP } from '../../../services/api/auth/sellerAuthService';
import OTPInput from '../../../components/OTPInput';
import GoogleMapsAutocomplete from '../../../components/GoogleMapsAutocomplete';
import LocationPickerMap from '../../../components/LocationPickerMap';
import { useAuth } from '../../../context/AuthContext';
import { getHeaderCategoriesPublic, HeaderCategory } from '../../../services/api/headerCategoryService';
import { useToast } from "@/context/ToastContext";
import { fadeIn, slideUp } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  { id: 'personal', title: 'Personal', icon: User },
  { id: 'store', title: 'Store', icon: Store },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'billing', title: 'Billing', icon: CreditCard },
];

export default function SellerSignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<HeaderCategory[]>([]);

  const [formData, setFormData] = useState({
    sellerName: '',
    mobile: '',
    email: '',
    storeName: '',
    category: '',
    categories: [] as string[],
    address: '',
    city: '',
    panCard: '',
    taxName: '',
    taxNumber: '',
    searchLocation: '',
    latitude: '',
    longitude: '',
    serviceRadiusKm: '10',
    accountName: '',
    bankName: '',
    branch: '',
    accountNumber: '',
    ifsc: '',
  });

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getHeaderCategoriesPublic();
        if (Array.isArray(res)) {
          setCategories(res.filter(cat => cat.status === 'Published'));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (name === 'serviceRadiusKm') {
      const cleanedValue = value.replace(/[^0-9.]/g, '');
      const parts = cleanedValue.split('.');
      const finalValue = parts.length > 2 ? `${parts[0]}.${parts[1]}` : cleanedValue;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleCategory = (catName: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(catName);
      const nextCategories = exists
        ? prev.categories.filter(c => c !== catName)
        : [...prev.categories, catName];
      return {
        ...prev,
        categories: nextCategories,
        category: nextCategories[0] || '',
      };
    });
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 0:
        if (!formData.sellerName || !formData.mobile || !formData.email) {
          showToast("Please fill in all personal details", "error");
          return false;
        }
        if (formData.mobile.length !== 10) {
          showToast("Mobile number must be 10 digits", "error");
          return false;
        }
        if (!formData.email.includes('@')) {
          showToast("Please enter a valid email", "error");
          return false;
        }
        return true;
      case 1:
        if (!formData.storeName || formData.categories.length === 0) {
          showToast("Please enter store name and select at least one category", "error");
          return false;
        }
        return true;
      case 2:
        if (!formData.latitude || !formData.longitude || !formData.city) {
          showToast("Please select your store location and city", "error");
          return false;
        }
        return true;
      case 3:
        return true; // Optional step
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const response = await register({
        sellerName: formData.sellerName,
        mobile: formData.mobile,
        email: formData.email,
        storeName: formData.storeName,
        category: formData.categories[0],
        categories: formData.categories,
        address: formData.address || formData.searchLocation,
        city: formData.city,
        searchLocation: formData.searchLocation,
        latitude: formData.latitude,
        longitude: formData.longitude,
        serviceRadiusKm: formData.serviceRadiusKm,
        taxName: formData.taxName,
        taxNumber: formData.taxNumber,
        panCard: formData.panCard,
        ifsc: formData.ifsc
      });

      if (response.success) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        try {
          await sendOTP(formData.mobile);
          setShowOTP(true);
          showToast("Registration successful! OTP sent to your mobile.", "success");
        } catch (otpErr: any) {
          showToast(otpErr.response?.data?.message || 'Failed to send OTP.', "error");
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Registration failed.', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    try {
      const response = await verifyOTP(formData.mobile, otp);
      if (response.success && response.data) {
        login(response.data.token, {
          ...response.data.user,
          userType: 'Seller',
        });
        showToast("Welcome aboard! Account verified successfully.", "success");
        navigate('/seller', { replace: true });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid OTP.', "error");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIcon = (index: number) => {
    const StepIcon = STEPS[index].icon;
    const isActive = currentStep === index;
    const isCompleted = currentStep > index;

    return (
      <div className="flex flex-col items-center relative z-10">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' :
            isCompleted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
        >
          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
        </div>
        <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {STEPS[index].title}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl w-full">
        {/* Branding */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mb-4 cursor-pointer" onClick={() => navigate('/seller/login')}>
            <Building className="text-primary-foreground w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Become a Partner</h1>
          <p className="text-muted-foreground font-bold mt-2 uppercase tracking-tighter text-[10px]">Start your business journey with Dhakad Snazzy</p>
        </motion.div>

        {!showOTP ? (
          <div className="space-y-6">
            {/* Stepper Header */}
            <div className="relative px-8 pt-2 pb-6">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-[1.8rem] px-20">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between relative">
                {STEPS.map((_, i) => renderStepIcon(i))}
              </div>
            </div>

            <Card className="border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[300px]"
                  >
                    {/* STEP 0: PERSONAL INFO */}
                    {currentStep === 0 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-foreground">Personal Information</CardTitle>
                          <CardDescription className="text-muted-foreground">We'll use these details to contact you regarding your application.</CardDescription>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sellerName" className="text-foreground">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="sellerName"
                                name="sellerName"
                                placeholder="Your Name"
                                value={formData.sellerName}
                                onChange={handleInputChange}
                                className="pl-10 h-11 border-border bg-background text-foreground focus:ring-primary"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mobile" className="text-foreground">Mobile Number</Label>
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pr-2 border-r border-border">
                                  <span className="text-[10px] font-bold text-muted-foreground mr-1">+91</span>
                                </div>
                                <Input
                                  id="mobile"
                                  name="mobile"
                                  type="tel"
                                  placeholder="00000 00000"
                                  value={formData.mobile}
                                  onChange={handleInputChange}
                                  className="pl-14 h-11 border-border bg-background text-foreground focus:ring-primary"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-foreground">Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  placeholder="email@example.com"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  className="pl-10 h-11 border-border bg-background text-foreground focus:ring-primary"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 1: STORE INFO */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-foreground">Store Profile</CardTitle>
                          <CardDescription className="text-muted-foreground">Tell us about your business and categories.</CardDescription>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="storeName" className="text-foreground">Store/Business Name</Label>
                            <div className="relative">
                              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="storeName"
                                name="storeName"
                                placeholder="Dhakad Snazzy Gurgaon"
                                value={formData.storeName}
                                onChange={handleInputChange}
                                className="pl-10 h-11 border-border bg-background text-foreground focus:ring-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-foreground">
                              Business Categories
                              <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Pick one or more</span>
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/50 rounded-xl border border-border max-h-[220px] overflow-y-auto">
                              {categories.length === 0 ? (
                                <div className="col-span-full h-20 flex items-center justify-center text-xs text-muted-foreground italic font-bold uppercase tracking-tighter">
                                  Loading categories...
                                </div>
                              ) : (
                                categories.map((cat) => (
                                  <div
                                    key={cat._id}
                                    onClick={() => toggleCategory(cat.name)}
                                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.categories.includes(cat.name)
                                      ? 'bg-primary text-primary-foreground border-primary shadow-md transform scale-[1.02]'
                                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                      }`}
                                  >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                      {formData.categories.includes(cat.name) ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : (
                                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <span className="text-[11px] font-bold truncate tracking-tight">{cat.name}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: LOCATION */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-foreground">Store Location</CardTitle>
                          <CardDescription className="text-muted-foreground">Customers will see results based on this location. Maximize visibility with accurate pinning.</CardDescription>
                        </div>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground mb-1 block">Search Address</Label>
                              <GoogleMapsAutocomplete
                                value={formData.searchLocation}
                                onChange={(address: string, lat: number, lng: number, placeName: string, components?: { city?: string; state?: string }) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    searchLocation: address,
                                    latitude: lat.toString(),
                                    longitude: lng.toString(),
                                    address: address,
                                    city: components?.city || prev.city,
                                  }));
                                }}
                                placeholder="Search for store location..."
                              />
                            </div>
                            <div className="w-24">
                              <Label className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground mb-1 block">City</Label>
                              <Input
                                placeholder="City"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="h-10 text-xs border-border bg-background text-foreground"
                              />
                            </div>
                          </div>

                          {formData.latitude && formData.longitude && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold uppercase tracking-tighter text-primary">Drag to Pin Exact Entry Point</Label>
                                <div className="text-[10px] text-muted-foreground font-bold tracking-tight">{formData.latitude.slice(0, 8)}, {formData.longitude.slice(0, 8)}</div>
                              </div>
                              <div className="h-[200px] rounded-xl border-2 border-border overflow-hidden shadow-inner bg-muted">
                                <LocationPickerMap
                                  initialLat={parseFloat(formData.latitude)}
                                  initialLng={parseFloat(formData.longitude)}
                                  onLocationSelect={(lat, lng) => {
                                    setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-primary uppercase tracking-tighter">Service Radius</div>
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Define your delivery range</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-16 h-8 text-center text-sm font-bold border-primary/20 bg-background text-foreground"
                                value={formData.serviceRadiusKm}
                                onChange={handleInputChange}
                                name="serviceRadiusKm"
                              />
                              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">KM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: BILLING */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-foreground">Billing & Identity (Optional)</CardTitle>
                          <CardDescription className="text-muted-foreground">You can provide these details now or later from setup.</CardDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="panCard" className="text-foreground">PAN Card Number</Label>
                            <Input id="panCard" name="panCard" placeholder="ABCDE1234F" value={formData.panCard} onChange={handleInputChange} className="border-border bg-background text-foreground focus:ring-primary h-11 uppercase" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="taxNumber" className="text-foreground">GSTIN / Tax Number</Label>
                            <Input id="taxNumber" name="taxNumber" placeholder="Optional" value={formData.taxNumber} onChange={handleInputChange} className="border-border bg-background text-foreground focus:ring-primary h-11 uppercase" />
                          </div>
                          <div className="space-y-2 col-span-full">
                            <Label htmlFor="taxName" className="text-foreground">Registered Tax Name</Label>
                            <Input id="taxName" name="taxName" placeholder="Business Legal Name" value={formData.taxName} onChange={handleInputChange} className="border-border bg-background text-foreground focus:ring-primary h-11" />
                          </div>
                          <Separator className="col-span-full my-2 bg-border" />
                          <div className="space-y-2 col-span-full">
                            <Label htmlFor="ifsc" className="text-foreground">Bank IFSC Code</Label>
                            <Input id="ifsc" name="ifsc" placeholder="SBIN0001234" value={formData.ifsc} onChange={handleInputChange} className="border-border bg-background text-foreground focus:ring-primary h-11 uppercase" />
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Your financial data is encrypted and stored securely according to RBI guidelines.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 0 || loading}
                    className="text-muted-foreground font-bold hover:bg-muted"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>

                  <Button
                    onClick={nextStep}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] shadow-lg shadow-primary/20"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {currentStep === STEPS.length - 1 ? 'Start Selling' : 'Next Step'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
              Already a partner? <span onClick={() => navigate('/seller/login')} className="text-primary font-bold hover:underline cursor-pointer">Login to Workspace</span>
            </p>
          </div>
        ) : (
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Card className="border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Verification Needed</CardTitle>
                <CardDescription className="text-muted-foreground">We've sent a 4-digit code to <b className="text-foreground">+91 {formData.mobile}</b></CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex justify-center mb-10">
                  <OTPInput
                    length={4}
                    onComplete={handleOTPComplete}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => handleOTPComplete('')} // This handles via parent state if needed, but OTPInput onComplete is primary
                    disabled={loading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                  </Button>

                  <div className="flex items-center justify-between px-2">
                    <button
                      onClick={() => setShowOTP(false)}
                      className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Change Details
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await sendOTP(formData.mobile);
                          showToast("OTP resent successfully", "success");
                        } catch (err) {
                          showToast("Failed to resend OTP", "error");
                        }
                      }}
                      className="text-[10px] font-bold uppercase tracking-tighter text-primary hover:text-primary/80 transition-colors"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Dynamic Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-[0.05]">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-primary/30 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

const Truck = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18h2" />
    <path d="M21 18h1a1 1 0 0 0 1-1v-6l-4-4h-4" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);


