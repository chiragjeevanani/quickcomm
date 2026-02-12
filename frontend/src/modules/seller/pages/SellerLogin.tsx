import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { sendOTP, verifyOTP } from '../../../services/api/auth/sellerAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { fadeIn, slideUp } from '../lib/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SellerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOTP(mobileNumber);
      if (response.success) {
        setShowOTP(true);
        showToast('OTP sent successfully', 'success');
      } else {
        showToast(response.message || 'Error sending OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error sending OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      showToast('Please enter a valid 4-digit OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(mobileNumber, otp);
      if (response.success) {
        // Explicitly set userType to 'Seller' so contexts (like OrdersContext) 
        // handle this user correctly and don't try to fetch customer data
        login(response.data.token, {
          ...response.data.user,
          userType: 'Seller'
        });
        showToast('Logged in successfully', 'success');
        navigate('/seller');
      } else {
        showToast(response.message || 'Invalid OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mb-4">
            <ShoppingBag className="text-primary-foreground w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Seller Panel</h1>
          <p className="text-muted-foreground font-bold mt-2 uppercase tracking-tighter text-[10px]">Manage your business with ease</p>
        </motion.div>

        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
        >
          <Card className="border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
            <CardHeader className="space-y-1 pb-6 bg-muted/30 border-b border-border">
              <CardTitle className="text-2xl font-bold text-center text-foreground">
                {showOTP ? 'Verify OTP' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                {showOTP
                  ? `Enter the code sent to +91 ${mobileNumber}`
                  : 'Enter your mobile number to access your account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {!showOTP ? (
                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter ml-1">Mobile Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-border pr-2">
                        <span className="text-xs font-bold text-muted-foreground">+91</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder="00000 00000"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="pl-16 h-12 text-lg tracking-widest border-border bg-background text-foreground focus:ring-primary h-12"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || mobileNumber.length !== 10}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold transition-all shadow-lg shadow-primary/20 gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Get OTP <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <OTPInput
                      length={4}
                      onComplete={(value) => setOtp(value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      disabled={loading || otp.length !== 4}
                      className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          Verify & Login <ShieldCheck className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowOTP(false)}
                      className="text-xs font-bold uppercase tracking-tighter text-primary hover:text-primary/80 transition-colors"
                    >
                      Change Mobile Number
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Links */}
        <motion.p
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="text-center mt-8 text-muted-foreground text-[10px] font-bold uppercase tracking-tighter"
        >
          Don't have an account?{' '}
          <Link to="/seller/signup" className="text-primary font-bold hover:underline">
            Register as Seller
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
