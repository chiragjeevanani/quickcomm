import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Download,
  Printer,
  Clock,
  Calendar,
  Hash,
  Package,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  FileText,
  User,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import jsPDF from 'jspdf';
import { getOrderById, updateOrderStatus, OrderDetail } from '../../../services/api/orderService';
import { useToast } from "@/context/ToastContext";
import { fadeIn, slideUp } from "../lib/animations";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SellerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch order detail from API
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;

      setLoading(true);
      setError('');
      try {
        const response = await getOrderById(id);
        if (response.success && response.data) {
          setOrderDetail(response.data);
          setOrderStatus(response.data.status);
        } else {
          setError(response.message || 'Failed to fetch order details');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderDetail) return;

    setIsUpdating(true);
    try {
      const response = await updateOrderStatus(orderDetail.id, { status: newStatus as any });
      if (response.success) {
        setOrderStatus(newStatus);
        setOrderDetail({ ...orderDetail, status: newStatus as any });
        showToast(`Order status updated to ${newStatus}`, "success");
      } else {
        showToast(response.message || 'Failed to update order status', "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update order status', "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString + 'T00:00:00');
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      else if (day === 2 || day === 22) suffix = 'nd';
      else if (day === 3 || day === 23) suffix = 'rd';
      return `${day}${suffix} ${month}, ${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const handleExportPDF = () => {
    if (!orderDetail) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(margin, yPos, contentWidth, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Dhakad Snazzy - 10 Minute App', margin + 5, yPos + 10);

    yPos += 20;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dhakad Snazzy - 10 Minute App', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('From: Dhakad Snazzy - 10 Minute App', margin, yPos);
    yPos += 6;
    doc.text('Phone: 8956656429', margin, yPos);
    yPos += 6;
    doc.text('Email: info@dhakadsnazzy.com', margin, yPos);
    yPos += 12;

    const rightX = pageWidth - margin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(orderDetail.orderDate)}`, rightX, yPos - 30, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #${orderDetail.invoiceNumber}`, rightX, yPos - 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order ID: ${orderDetail.id}`, rightX, yPos - 14, { align: 'right' });
    doc.text(`Delivery Date: ${formatDate(orderDetail.deliveryDate)}`, rightX, yPos - 8, { align: 'right' });
    doc.text(`Time Slot: ${orderDetail.timeSlot}`, rightX, yPos - 2, { align: 'right' });

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 10, 'F');

    const colWidths = [
      contentWidth * 0.08,
      contentWidth * 0.40,
      contentWidth * 0.15,
      contentWidth * 0.15,
      contentWidth * 0.10,
      contentWidth * 0.12,
    ];

    let xPos = margin;
    const headers = ['Sr.', 'Product', 'Price', 'Tax ₹ (%)', 'Qty', 'Subtotal'];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPos + 7);
      xPos += colWidths[index];
    });

    yPos += 12;

    orderDetail.items.forEach((item) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'normal');
      xPos = margin;
      const rowData = [
        item.srNo.toString(),
        item.product,
        `₹${item.price.toFixed(2)}`,
        `${item.tax.toFixed(2)} (${item.taxPercent.toFixed(2)}%)`,
        item.qty.toString(),
        `₹${item.subtotal.toFixed(2)}`,
      ];

      rowData.forEach((data, index) => {
        const maxWidth = colWidths[index] - 4;
        let text = data;
        if (doc.getTextWidth(text) > maxWidth && index === 1) {
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(text, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);
      yPos += 10;
    });

    const totalSubtotal = orderDetail.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = orderDetail.items.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = totalSubtotal + totalTax;

    yPos += 5;
    checkPageBreak(30);

    doc.setFontSize(10);
    doc.text('Subtotal:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`₹${totalSubtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.text('Tax:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`₹${totalTax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`₹${grandTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });

    yPos = pageHeight - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Bill Generated by Dhakad Snazzy Seller Panel', pageWidth / 2, yPos, { align: 'center' });

    doc.save(`Invoice_${orderDetail.invoiceNumber}.pdf`);
    showToast("Invoice downloaded successfully", "success");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none px-3 py-1">Accepted</Badge>;
      case 'On the way':
        return <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-none px-3 py-1">On the way</Badge>;
      case 'Delivered':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none px-3 py-1">Delivered</Badge>;
      case 'Cancelled':
      case 'Rejected':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none px-3 py-1">{status}</Badge>;
      case 'Received':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">New Order</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground hover:bg-muted border-none px-3 py-1">{status}</Badge>;
    }
  };

  const totalSubtotal = orderDetail?.items.reduce((sum, item) => sum + item.subtotal, 0) || 0;
  const totalTax = orderDetail?.items.reduce((sum, item) => sum + item.tax, 0) || 0;
  const grandTotal = totalSubtotal + totalTax;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Order</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error || "The order you're looking for was not found."}</p>
        <Button onClick={() => navigate('/seller/orders')} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Actions */}
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/seller/orders')} className="rounded-full shadow-sm border-border bg-card">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl font-bold text-foreground">Order Details</h1>
              <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground uppercase">#{orderDetail.id.slice(-8)}</Badge>
            </div>
            <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Placed on {formatDate(orderDetail.orderDate)} at {orderDetail.timeSlot}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.print()} className="border-border bg-card text-foreground hover:bg-accent">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportPDF} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Bar */}
          <motion.div variants={slideUp} initial="initial" animate="animate">
            <Card className="border-border bg-card overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Order Lifecycle</h3>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Current Status: {orderStatus}</p>
                  </div>
                </div>
                {getStatusBadge(orderStatus)}
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Update Status</Label>
                    <div className="flex items-center gap-3">
                      {orderStatus === 'Received' ? (
                        <div className="flex gap-3 w-full">
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 shadow-lg shadow-emerald-500/10"
                            onClick={() => handleStatusUpdate('Accepted')}
                            disabled={isUpdating}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Accept Order
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1 h-10 shadow-lg shadow-destructive/10"
                            onClick={() => {
                              if (window.confirm('Reject this order?')) handleStatusUpdate('Rejected');
                            }}
                            disabled={isUpdating}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Order
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={orderStatus}
                          onValueChange={handleStatusUpdate}
                          disabled={isUpdating || ['Delivered', 'Cancelled', 'Rejected'].includes(orderStatus)}
                        >
                          <SelectTrigger className="w-full md:w-[240px] h-10 border-border bg-background text-foreground focus:ring-primary">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-muted-foreground" />
                              <SelectValue placeholder="Update Status" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-popover text-popover-foreground border-border">
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="On the way">On the way</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            {orderStatus === 'Rejected' && <SelectItem value="Rejected">Rejected</SelectItem>}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                    <Info className="w-4 h-4" />
                    Updating status notifies the customer instantly.
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Items Table */}
          <motion.div variants={slideUp} initial="initial" animate="animate" custom={1}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg text-foreground">Items in Order</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">Total {orderDetail.items.length} items listed below</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border">
                      <TableHead className="w-[80px] text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Sr.</TableHead>
                      <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Product Information</TableHead>
                      <TableHead className="text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Unit</TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Price</TableHead>
                      <TableHead className="text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Qty</TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetail.items.map((item) => (
                      <TableRow key={item.srNo} className="border-border hover:bg-muted/30 transition-colors">
                        <TableCell className="text-center text-muted-foreground font-mono text-[10px]">{item.srNo}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground line-clamp-1">{item.product}</span>
                            <span className="text-[10px] text-muted-foreground">Tax: ₹{item.tax.toFixed(2)} ({item.taxPercent}%)</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal border-none">
                            {item.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-foreground">x{item.qty}</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">₹{item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals Summary */}
                <div className="p-6 bg-muted/20">
                  <div className="flex flex-col items-end space-y-3">
                    <div className="flex justify-between w-full max-w-[280px] text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{totalSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-full max-w-[280px] text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                      <span>Tax Amount</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-full max-w-[280px] text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-500">FREE</span>
                    </div>
                    <Separator className="w-full max-w-[280px] bg-border" />
                    <div className="flex justify-between w-full max-w-[280px]">
                      <span className="text-lg font-extrabold text-foreground">Grand Total</span>
                      <span className="text-xl font-extrabold text-primary">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Customer & Invoice Details */}
        <div className="space-y-6">
          {/* Customer Card */}
          <motion.div variants={slideUp} initial="initial" animate="animate" custom={2}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">Arjun Sharma</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Customer ID: CUST-8291</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary/60" />
                    <span className="text-foreground">+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary/60" />
                    <span className="text-foreground">arjun.s@example.com</span>
                  </div>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    Delivery Address
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg text-xs leading-relaxed text-muted-foreground italic">
                    Flat No. 405, Skyscraper Apartments, Near Central Park, Sector 42, Gurgaon, Haryana - 122001
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-primary border-primary/20 hover:bg-primary/10 h-9 text-[11px] font-bold uppercase tracking-wider">
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                    View on Google Maps
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment & Invoice Card */}
          <motion.div variants={slideUp} initial="initial" animate="animate" custom={3}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Payment Method</span>
                    <span className="text-sm font-bold text-emerald-600">Online UPI</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Transaction ID</span>
                    <span className="font-mono text-foreground">TXN_9201837465</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Invoice Number</span>
                    <span className="font-bold text-foreground">{orderDetail.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Payment Status</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/20">Paid</Badge>
                  </div>
                </div>

                <Separator className="bg-border" />

                <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border/50">
                  <p className="text-[11px] text-muted-foreground text-center italic">
                    "Customer has requested eco-friendly packaging if possible."
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer Branding */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="pt-8 flex flex-col items-center justify-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-[10px] text-primary-foreground font-bold shadow-sm">A</div>
          <span className="text-xs font-bold tracking-tighter text-foreground uppercase">Appzeto Seller Ecosystem</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Professional Order Management System v2.0</p>
      </motion.div>
    </div>
  );
}

const Info = ({ className }: { className?: string }) => (
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
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);


