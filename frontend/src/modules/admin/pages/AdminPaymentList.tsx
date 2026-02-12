import { useState, useEffect } from "react";
import {
  getPaymentMethodConfigs as getPaymentMethods,
  updatePaymentMethod,
  updatePaymentMethodStatus,
  type PaymentMethodConfig as PaymentMethod,
} from "../../../services/api/admin/adminPaymentService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  Globe,
  Settings2,
  Key,
  Lock,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
  Wallet
} from "lucide-react";

export default function AdminPaymentList() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const defaultPaymentMethods: PaymentMethod[] = [
    {
      _id: 'cod',
      name: 'Cash On Delivery (COD)',
      description: 'Collect physical currency upon package hand-over.',
      status: 'Active',
      hasApiKeys: false,
      type: 'cod',
    },
    {
      _id: 'razorpay',
      name: 'Razorpay Gateway',
      description: 'Primary digital tunnel for cards, UPI, and banking.',
      status: 'Active',
      hasApiKeys: true,
      apiKey: '',
      secretKey: '',
      provider: 'razorpay',
      type: 'gateway',
    },
  ];

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        if (!isAuthenticated || !token) {
          setPaymentMethods(defaultPaymentMethods);
          return;
        }
        const response = await getPaymentMethods();
        if (response.success && response.data.length > 0) {
          setPaymentMethods(response.data);
        } else {
          setPaymentMethods(defaultPaymentMethods);
        }
      } catch (err: any) {
        setPaymentMethods(defaultPaymentMethods);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentMethods();
  }, [isAuthenticated, token]);

  const handleUpdate = (id: string, field: string, value: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method._id === id ? { ...method, [field]: value } : method
      )
    );
  };

  const handleStatusChange = async (id: string, checked: boolean) => {
    const newStatus = checked ? "Active" : "InActive";
    try {
      const response = await updatePaymentMethodStatus(id, newStatus);
      if (response.success) {
        setPaymentMethods((prev) =>
          prev.map((method) =>
            method._id === id ? { ...method, status: newStatus } : method
          )
        );
        showToast(`Gateway ${newStatus === 'Active' ? 'Enabled' : 'Disabled'}`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Status sync failed", 'error');
    }
  };

  const handleSyncGateWay = async (id: string) => {
    const method = paymentMethods.find((m) => m._id === id);
    if (!method) return;

    try {
      setUpdating(id);
      const updateData: any = {
        description: method.description,
        status: method.status,
        apiKey: method.apiKey || "",
        secretKey: method.secretKey || "",
      };

      const response = await updatePaymentMethod(id, updateData);
      if (response.success) {
        showToast(`${method.name} encryption keys synchronized!`, 'success');
      } else {
        showToast(response.message || "Encryption sync failed", 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Sync error", 'error');
    } finally {
      setUpdating(null);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Payment Infostructure"
        description="Configure digital tunnels and physical collection models for the commerce engine."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paymentMethods.map((method) => (
          <Card key={method._id} className="border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-primary/5 border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    {method.type === 'cod' ? <Banknote className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-md font-bold">{method.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                      {method.provider || 'Local'} Provider
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{method.status}</span>
                  <Switch
                    checked={method.status === 'Active'}
                    onCheckedChange={(checked) => handleStatusChange(method._id, checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 flex-1">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Gateway Description</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    value={method.description}
                    onChange={(e) => handleUpdate(method._id, "description", e.target.value)}
                    className="pl-9 h-11 bg-muted/30 border-border text-xs font-medium"
                  />
                </div>
              </div>

              {method.hasApiKeys && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Public API Key</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        value={method.apiKey || ""}
                        onChange={(e) => handleUpdate(method._id, "apiKey", e.target.value)}
                        placeholder="rzp_live_..."
                        className="pl-9 h-11 bg-muted/30 border-border font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Secret Access Key</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="password"
                        value={method.secretKey || ""}
                        onChange={(e) => handleUpdate(method._id, "secretKey", e.target.value)}
                        placeholder="••••••••••••••••"
                        className="pl-9 h-11 bg-muted/30 border-border font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!method.hasApiKeys && (
                <div className="p-4 bg-muted/20 border border-border border-dashed rounded-xl flex items-center justify-center text-center">
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    No external API credentials required for physical collection models.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border mt-auto">
                <Button
                  onClick={() => handleSyncGateWay(method._id)}
                  disabled={updating === method._id}
                  className="w-full gap-2 font-black uppercase tracking-widest h-11 shadow-md"
                >
                  {updating === method._id ? "Encrypting..." : <><Save className="h-4 w-4" /> Sync Cryptography</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-blue-700 uppercase tracking-tight">Security Protocol Notice</h4>
          <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">
            All payment credentials are encrypted using AES-256 before storage. Never share your secret keys with anyone.
            Disabling a gateway will immediately halt all transaction intake via that channel.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-12 opacity-15 pointer-events-none grayscale">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">GATEWAY MAPPING v2.1</span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">PCI-DSS CORE</span>
        </div>
      </div>
    </div>
  );
}
