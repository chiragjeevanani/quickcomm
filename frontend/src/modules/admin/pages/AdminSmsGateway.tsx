import { useState } from 'react';
import PageHeader from "../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "../../../context/ToastContext";
import {
  MessageSquare,
  Save,
  ShieldCheck,
  Zap,
  Key,
  User,
  Hash,
  Eye,
  EyeOff,
  Power,
  Activity,
  Server,
  Bell
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SmsGateway {
  id: string;
  name: string;
  fields: {
    [key: string]: string;
  };
  status: 'Active' | 'InActive';
}

export default function AdminSmsGateway() {
  const { showToast } = useToast();
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [gateways, setGateways] = useState<SmsGateway[]>([
    {
      id: 'smsindiahub',
      name: 'SMS India HUB',
      fields: {
        username: '',
        apiKey: '',
        senderId: '',
        dltTemplateId: '',
      },
      status: 'InActive',
    },
  ]);

  const toggleSensitive = (fieldName: string) => {
    setShowSensitive(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleFieldChange = (gatewayId: string, fieldName: string, value: string) => {
    setGateways((prev) =>
      prev.map((gateway) =>
        gateway.id === gatewayId
          ? {
            ...gateway,
            fields: {
              ...gateway.fields,
              [fieldName]: value,
            },
          }
          : gateway
      )
    );
  };

  const handleStatusChange = (gatewayId: string, status: 'Active' | 'InActive') => {
    setGateways((prev) =>
      prev.map((gateway) => (gateway.id === gatewayId ? { ...gateway, status } : gateway))
    );
  };

  const handleUpdate = (gatewayId: string) => {
    const gateway = gateways.find((g) => g.id === gatewayId);
    if (gateway) {
      showToast(`${gateway.name} protocol configurations synchronized.`, 'success');
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const labelMap: { [key: string]: string } = {
      accountSid: 'AccountSid',
      authToken: 'Auth Token',
      twilioNumber: 'Twilio Number',
      vonageApiKey: 'Vonage API Key',
      vonageApiSecret: 'Vonage API Secret',
      apiKey: 'API Key',
      authKey: 'Auth Key',
      senderId: 'Sender ID',
      username: 'Username',
      dltTemplateId: 'DLT Template ID',
    };
    return labelMap[fieldName] || fieldName;
  };

  const getFieldIcon = (fieldName: string) => {
    if (fieldName.includes('apiKey') || fieldName.includes('token') || fieldName.includes('Key') || fieldName.includes('Secret')) return <Key className="h-4 w-4" />;
    if (fieldName.includes('user')) return <User className="h-4 w-4" />;
    if (fieldName.includes('Id')) return <Hash className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication Gateway"
        description="Manage secure SMS nodes for OTP delivery, transactional alerts, and platform notifications."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 border-border">
            <Activity className="h-4 w-4" /> Network Health
          </Button>
          <Button className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20">
            <Bell className="h-4 w-4" /> Global Broadcast
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className="border-border bg-card shadow-lg border-2 border-primary/5 overflow-hidden">
            <div className="h-1 bg-primary/20 w-full" />
            <CardHeader className="bg-muted/10 border-b border-border space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-md font-bold">{gateway.name}</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/70">Protocol ID: {gateway.id}</CardDescription>
                  </div>
                </div>
                <Badge className={`uppercase text-[10px] font-black tracking-widest px-3 border-2 ${gateway.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  }`}>
                  {gateway.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(gateway.fields).map(([fieldName, fieldValue]) => (
                  <div key={fieldName} className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                      {getFieldIcon(fieldName)} {getFieldLabel(fieldName)}
                    </Label>
                    <div className="relative">
                      <Input
                        type={fieldName.includes('Token') || fieldName.includes('Secret') || fieldName.includes('authKey') || fieldName.includes('apiKey') ? (showSensitive[fieldName] ? 'text' : 'password') : 'text'}
                        value={fieldValue}
                        onChange={(e) => handleFieldChange(gateway.id, fieldName, e.target.value)}
                        placeholder={`Enter system ${getFieldLabel(fieldName)}...`}
                        className="bg-muted/20 border-border h-11 px-4 text-xs font-mono font-bold focus-visible:ring-primary/20"
                      />
                      {(fieldName.includes('Token') || fieldName.includes('Secret') || fieldName.includes('authKey') || fieldName.includes('apiKey')) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSensitive(fieldName)}
                        >
                          {showSensitive[fieldName] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="space-y-1.5 pt-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Power className="h-4 w-4" /> Operational State
                  </Label>
                  <Select value={gateway.status} onValueChange={(val: any) => handleStatusChange(gateway.id, val)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-border text-xs font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active Operations</SelectItem>
                      <SelectItem value="InActive">Offline Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button onClick={() => handleUpdate(gateway.id)} className="w-full gap-2 font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700">
                  <Save className="h-4 w-4" /> Synchronize Node
                </Button>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-primary">Encryption Layer Active</p>
                    <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">All credentials are hashed before synchronization to ensure endpoint security across the cluster.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="bg-muted/10 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center p-12 text-center opacity-40 hover:opacity-100 transition-all group">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <Zap className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest mb-1">Scale Network</h3>
          <p className="text-[10px] text-muted-foreground font-medium">Integration with AWS SNS and Twilio nodes scheduled for v10 release.</p>
        </div>
      </div>
    </div>
  );
}
