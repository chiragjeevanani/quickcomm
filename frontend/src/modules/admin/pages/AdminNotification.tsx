import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Bell } from 'lucide-react';
import {
  getNotifications,
  createNotification,
  deleteNotification,
  Notification as NotificationType,
  CreateNotificationData,
} from '../../../services/api/admin/adminNotificationService';
import { useToast } from '../../../context/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminNotification() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    recipientType: 'All' as 'All' | 'Admin' | 'Seller' | 'Customer' | 'Delivery',
    title: '',
    message: '',
  });

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [filterRecipientType, setFilterRecipientType] = useState<string>('All');

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, rowsPerPage, filterRecipientType]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: parseInt(rowsPerPage),
      };

      if (filterRecipientType !== 'All') {
        params.recipientType = filterRecipientType;
      }

      const response = await getNotifications(params);

      if (response.success && response.data) {
        setNotifications(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
          setTotalNotifications(response.pagination.total);
        }
      } else {
        showToast(response.message || 'Failed to fetch notifications', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error fetching notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Please enter both title and message', 'error');
      return;
    }

    setLoading(true);
    try {
      const notificationData: CreateNotificationData = {
        recipientType: formData.recipientType,
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: 'Info',
        priority: 'Medium',
      };

      const response = await createNotification(notificationData);

      if (response.success) {
        showToast('Notification sent successfully!', 'success');
        setFormData({
          recipientType: 'All',
          title: '',
          message: '',
        });
        fetchNotifications();
      } else {
        showToast(response.message || 'Failed to send notification', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error sending notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteNotification(id);
      if (response.success) {
        showToast('Notification deleted successfully!', 'success');
        fetchNotifications();
      } else {
        showToast(response.message || 'Failed to delete notification', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRecipientDisplayName = (recipientType: string): string => {
    if (recipientType === 'All') return 'All Users';
    return recipientType;
  };

  // Client-side search filter
  let filteredNotifications = notifications;
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredNotifications = filteredNotifications.filter((notification) =>
      notification.title.toLowerCase().includes(searchLower) ||
      notification.message.toLowerCase().includes(searchLower) ||
      notification.recipientType.toLowerCase().includes(searchLower)
    );
  }

  const columns = [
    {
      header: "Users",
      accessorKey: "recipientType",
      cell: (n: NotificationType) => (
        <Badge variant="outline">{getRecipientDisplayName(n.recipientType)}</Badge>
      )
    },
    {
      header: "Title",
      accessorKey: "title",
      cell: (n: NotificationType) => <span className="font-medium">{n.title}</span>
    },
    {
      header: "Message",
      accessorKey: "message",
      cell: (n: NotificationType) => (
        <span className="text-muted-foreground line-clamp-2">{n.message}</span>
      )
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (n: NotificationType) => (
        <span className="text-sm">{formatDate(n.createdAt)}</span>
      )
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (n: NotificationType) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(n._id)}
          disabled={loading}
          className="h-8 w-8 text-rose-500 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Management"
        description="Send notifications to users and manage sent notifications."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Notification Panel */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientType">Select User Type</Label>
                <Select
                  name="recipientType"
                  value={formData.recipientType}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, recipientType: val as any }))}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Users</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Seller">Seller</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="Enter Title"
                  className="bg-muted/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="Enter Message"
                  rows={6}
                  className="bg-muted/50 border-border resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold uppercase tracking-wide"
              >
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* View Notification Table */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Sent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-normal">Filter by Type:</Label>
                <Select
                  value={filterRecipientType}
                  onValueChange={(val) => {
                    setFilterRecipientType(val);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                >
                  <SelectTrigger className="w-32 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Seller">Seller</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-9 bg-muted/50 border-border"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                />
              </div>

              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-24 bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={filteredNotifications}
              loading={loading}
              emptyMessage="No notifications found."
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing <span className="font-bold text-foreground">{filteredNotifications.length}</span> of <span className="font-bold text-foreground">{totalNotifications}</span> notifications
              </p>
              <p>Page {currentPage} of {totalPages}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
