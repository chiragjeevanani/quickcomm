import { useState } from 'react';
import PageHeader from "../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "../../../context/ToastContext";
import {
  FileText,
  Eye,
  Save,
  Trash2,
  Scale,
  ShieldAlert,
  History,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminCustomerAppPolicy() {
  const { showToast } = useToast();
  const [policyContent, setPolicyContent] = useState(`Welcome to QuickCommerce Protocol!

By using our customer application, you agree to the following operational parameters:

1. Account Registry
   - High-fidelity information only.
   - Credentials must be encrypted on local storage.
   - Notify central node of any registry breaches.

2. Order Execution
   - Real-time inventory synchronization.
   - Dynamic price shifts based on supply-demand vectors.
   - We reserve the right to abort any transaction.

3. Financial Protocol
   - Immediate settlement at order checkout.
   - PCI-DSS compliant payment tunnels only.
   - Local taxation logic applied at final node.

4. Logistics & Fulfillment
   - 10-minute delivery is a target, not a guarantee.
   - Service radius enforced by geospatial boundaries.
   - Real-time agent tracking enabled.

5. Returns & Void Protocols
   - Return requests accepted within 7 diurnal cycles.
   - Original packaging integrity required.
   - Refund settlement via primary payment channel.

6. Data Sovereignty
   - User data handled via AES-256 encryption.
   - No third-party data leakage without protocol consent.

7. System Liability
   - Liability capped at total order valuation.

8. Protocol Evolution
   - Terms subject to real-time updates.

Last updated: FEB 2026`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Customer App Protocol updated successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Customer Compliance Protocol"
        description="Edit the legal and operational framework governing user interactions with the platform."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 border-border" onClick={() => showToast("Syncing archive...", "info")}>
            <History className="h-4 w-4" /> Version Archive
          </Button>
          <Button className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20" onClick={handleSubmit}>
            <Save className="h-4 w-4" /> Deploy Policy
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="bg-muted/50 p-1 border border-border h-12 mb-6">
          <TabsTrigger value="editor" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-8">
            <FileText className="h-3.5 w-3.5" /> Macro Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-8">
            <Eye className="h-3.5 w-3.5" /> High-Fidelity Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-0">
          <Card className="border-border bg-card shadow-sm border-2 border-primary/5">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                <Scale className="h-4 w-4" /> Legal Content Node
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5 font-mono">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Protocol Text Body</Label>
                <Textarea
                  value={policyContent}
                  onChange={(e) => setPolicyContent(e.target.value)}
                  placeholder="Initialize policy content..."
                  className="min-h-[500px] bg-muted/20 border-border text-xs leading-relaxed focus-visible:ring-primary/20"
                />
              </div>
              <div className="flex items-center justify-between pt-4">
                <p className="text-[9px] text-muted-foreground font-medium flex items-center gap-1.5 italic">
                  <ShieldAlert className="h-3 w-3 text-amber-500" /> Changes made here will be instantly reflected across all customer nodes.
                </p>
                <Button variant="ghost" size="sm" className="h-9 gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest" onClick={() => setPolicyContent('')}>
                  <Trash2 className="h-3.5 w-3.5" /> Purge Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card className="border-border bg-card shadow-lg border-2 border-emerald-500/10">
            <CardHeader className="bg-emerald-500/5 border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Live Deployment Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 sm:p-12">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-[13px] text-foreground font-medium leading-[1.8] tracking-tight bg-background p-10 rounded-3xl border-2 border-border shadow-inner max-h-[600px] overflow-y-auto custom-scrollbar">
                  {policyContent || 'Awaiting protocol initialization...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-center gap-12 py-12 opacity-15 pointer-events-none grayscale">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">LEGAL_CORE v1.2</span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">SYNC_READY</span>
        </div>
      </div>
    </div>
  );
}
