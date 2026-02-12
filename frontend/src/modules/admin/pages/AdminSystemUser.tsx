import { useState, useEffect } from 'react';
import {
  getAllSystemUsers,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
  SystemUser as SystemUserType,
  CreateSystemUserData,
  UpdateSystemUserData,
} from '../../../services/api/admin/adminSystemUserService';
import { useToast } from "../../../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Key,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  FilterX,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AdminSystemUser() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    role: '' as '' | 'Admin' | 'Super Admin',
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const roles: ('Admin' | 'Super Admin')[] = ['Admin', 'Super Admin'];

  useEffect(() => {
    fetchSystemUsers();
  }, [currentPage, rowsPerPage, searchTerm]);

  const fetchSystemUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllSystemUsers({
        page: currentPage,
        limit: parseInt(rowsPerPage),
        search: searchTerm || undefined,
        sortBy: 'firstName',
        sortOrder: 'asc',
      });

      if (response.success && response.data) {
        setSystemUsers(response.data);
        if (response.pagination) {
          setTotalUsers(response.pagination.total);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error fetching system users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      role: '',
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setEditingId(null);
  };

  const handleAddSystemUser = async () => {
    if (!formData.role) return showToast('Please select a role', 'warning');
    if (!formData.firstName.trim()) return showToast('First name required', 'warning');
    if (!formData.lastName.trim()) return showToast('Last name required', 'warning');
    if (!/^[0-9]{10}$/.test(formData.mobile)) return showToast('10-digit mobile required', 'warning');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return showToast('Valid email required', 'warning');
    if (editingId === null && !formData.password.trim()) return showToast('Password required', 'warning');
    if (formData.password.trim() && formData.password.length < 6) return showToast('Password min 6 chars', 'warning');
    if (formData.password !== formData.confirmPassword) return showToast('Passwords do not match', 'warning');

    setLoading(true);
    try {
      if (editingId !== null) {
        const updateData: UpdateSystemUserData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobile: formData.mobile,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password.trim()) updateData.password = formData.password;

        const response = await updateSystemUser(editingId, updateData);
        if (response.success) {
          showToast('System user updated!', 'success');
          resetForm();
          fetchSystemUsers();
        }
      } else {
        const createData: CreateSystemUserData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobile: formData.mobile,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };

        const response = await createSystemUser(createData);
        if (response.success) {
          showToast('System user added!', 'success');
          resetForm();
          fetchSystemUsers();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const user = systemUsers.find((u) => u.id === id);
    if (user) {
      setFormData({
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
        password: '',
        confirmPassword: '',
      });
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this system user?')) return;
    setLoading(true);
    try {
      const response = await deleteSystemUser(id);
      if (response.success) {
        showToast('System user deleted!', 'success');
        fetchSystemUsers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Identity / ID",
      accessorKey: "firstName",
      cell: (u: SystemUserType) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-inner">
            {u.firstName[0]}{u.lastName[0]}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight text-xs">{u.firstName} {u.lastName}</span>
            <span className="text-[10px] text-muted-foreground font-mono">ID: {u.id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
      )
    },
    {
      header: "Contact / Security",
      accessorKey: "email",
      cell: (u: SystemUserType) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-foreground font-medium">
            <Mail className="h-3 w-3 text-muted-foreground" /> {u.email}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Phone className="h-3 w-3" /> {u.mobile}
          </div>
        </div>
      )
    },
    {
      header: "Access Level",
      accessorKey: "role",
      cell: (u: SystemUserType) => (
        <Badge className={
          u.role === 'Super Admin' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm' :
            'bg-primary/10 text-primary border-primary/20'
        }>
          {u.role === 'Super Admin' ? <ShieldAlert className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
          {u.role}
        </Badge>
      )
    },
    {
      header: "Action",
      accessorKey: "id",
      cell: (u: SystemUserType) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(u.id)}
            className="h-8 w-8 text-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(u.id)}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const totalPages = Math.ceil(totalUsers / parseInt(rowsPerPage));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal System Users"
        description="Provision administrative access and manage corporate roles for the platform."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Entry Form */}
        <Card className="border-border bg-card shadow-sm h-fit sticky top-6">
          <CardHeader className="bg-teal-600 rounded-t-lg">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {editingId ? "Update Permissions" : "Provision New User"}
            </CardTitle>
            <CardDescription className="text-teal-50/70 italic">Manage internal staff identities and platform access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Access Role <span className="text-rose-500">*</span></Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: 'Admin' | 'Super Admin') => handleInputChange('role', val)}
                >
                  <SelectTrigger className="h-11 bg-muted/50 border-border">
                    <SelectValue placeholder="Select staff role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">First Name <span className="text-rose-500">*</span></Label>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="h-11 bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Last Name <span className="text-rose-500">*</span></Label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="h-11 bg-muted/50 border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Contact Email <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="staff@vcommerce.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="h-11 bg-muted/50 border-border pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Mobile Line <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="9876543210"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      className="h-11 bg-muted/50 border-border pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {editingId ? "Update Passkey" : "Set Passkey"} {editingId === null && <span className="text-rose-500">*</span>}
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="h-11 bg-muted/50 border-border pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Secret <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="h-11 bg-muted/50 border-border pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={handleAddSystemUser}
                disabled={loading}
                className="w-full font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20"
              >
                {loading ? "Syncing Identity..." : editingId ? "Update Access" : "Grant Access"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm} className="w-full h-10 font-bold">
                  Cancel Operation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Active Staff */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  {totalUsers}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Administrative Staff</CardTitle>
                  <CardDescription>Review and manage active system operators.</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchSystemUsers}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search operators..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-10 bg-muted/30 border-border"
                />
              </div>
              <Select value={rowsPerPage} onValueChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-24 h-10 bg-muted/30 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Staff</SelectItem>
                  <SelectItem value="25">25 Staff</SelectItem>
                  <SelectItem value="50">50 Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={systemUsers}
              loading={loading}
              emptyMessage="No system operators identified in the audit."
            />

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                Security Node: {totalUsers} ACTIVE ENTITIES
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="h-9 px-3 font-black border-primary/20 text-primary bg-primary/5">
                  {currentPage} / {totalPages || 1}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
