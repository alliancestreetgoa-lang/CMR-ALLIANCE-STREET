import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth, canManageUsers } from "@/lib/auth";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Shield, ShieldAlert, User as UserIcon, Loader2, Pencil, Globe } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type UserData = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "employee";
  allowedCountries: string | null;
  createdAt: string;
};

const COUNTRIES = ["UK", "UAE"] as const;

function parseCountries(val: string | null): string[] {
  if (!val) return [];
  return val.split(",").map((c) => c.trim()).filter(Boolean);
}

function formatCountries(selected: string[]): string | null {
  if (selected.length === 0) return null;
  return selected.join(",");
}

function CountryBadges({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">All countries</span>;
  const countries = parseCountries(value);
  return (
    <div className="flex gap-1 flex-wrap">
      {countries.map((c) => (
        <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
          {c}
        </Badge>
      ))}
    </div>
  );
}

function CountryCheckboxes({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (country: string) => {
    const next = selected.includes(country)
      ? selected.filter((c) => c !== country)
      : [...selected, country];
    onChange(next);
  };

  return (
    <div className="flex gap-2">
      {COUNTRIES.map((c) => {
        const active = selected.includes(c);
        return (
          <button
            key={c}
            type="button"
            data-testid={`checkbox-country-${c.toLowerCase()}`}
            onClick={() => toggle(c)}
            className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<"ALL" | "UK" | "UAE">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "employee">("employee");
  const [newPassword, setNewPassword] = useState("");
  const [newCountries, setNewCountries] = useState<string[]>([]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "employee">("employee");
  const [editPassword, setEditPassword] = useState("");
  const [editCountries, setEditCountries] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      const data = await api.get("/api/users");
      setUsers(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    if (currentUser?.role !== "super_admin" && user.role === "super_admin") return false;
    if (!user.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (countryFilter !== "ALL") {
      if (user.role === "super_admin") return true;
      const countries = parseCountries(user.allowedCountries);
      if (!countries.includes(countryFilter)) return false;
    }
    return true;
  });

  const handleAddUser = async () => {
    if (!newName || !newPassword) return;
    
    setSubmitting(true);
    try {
      await api.post("/api/users", {
        name: newName,
        password: newPassword,
        role: newRole,
        allowedCountries: formatCountries(newCountries),
      });
      
      toast({ title: "Success", description: "User created successfully" });
      
      setNewName("");
      setNewRole("employee");
      setNewPassword("");
      setNewCountries([]);
      setIsDialogOpen(false);
      
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create user", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.delete(`/api/users/${userId}`);
      toast({ title: "Success", description: "User removed successfully" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove user", variant: "destructive" });
    }
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role === "super_admin" ? "admin" : user.role);
    setEditPassword("");
    setEditCountries(parseCountries(user.allowedCountries));
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!editingUser || !editName) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name: editName,
        role: editRole,
        allowedCountries: formatCountries(editCountries),
      };
      if (editPassword) payload.password = editPassword;

      await api.patch(`/api/users/${editingUser.id}`, payload);
      toast({ title: "Success", description: "User updated successfully" });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update user", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case "super_admin":
        return <Badge className="bg-primary hover:bg-primary/90"><ShieldAlert className="w-3 h-3 mr-1"/> Super Admin</Badge>;
      case "admin":
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200"><Shield className="w-3 h-3 mr-1"/> Admin</Badge>;
      default:
        return <Badge variant="outline"><UserIcon className="w-3 h-3 mr-1"/> Employee</Badge>;
    }
  };

  const canAdd = currentUser?.role === "super_admin" || currentUser?.role === "admin";
  const isSuperAdmin = currentUser?.role === "super_admin";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage system access, roles, and country permissions.</p>
          </div>
          
          {canAdd && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20" data-testid="button-add-user">
                  <Plus className="mr-2 h-4 w-4" /> Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user and set which countries they can access.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Username</Label>
                    <Input id="name" data-testid="input-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" placeholder="Enter username" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Password</Label>
                    <Input id="password" type="password" data-testid="input-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="col-span-3" placeholder="Enter password" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                      <SelectTrigger className="col-span-3" data-testid="select-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentUser?.role === "super_admin" && (
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        )}
                        {currentUser?.role === "super_admin" && (
                          <SelectItem value="admin">Admin</SelectItem>
                        )}
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">
                      <span className="flex items-center gap-1 justify-end">
                        <Globe className="w-3 h-3" /> Countries
                      </span>
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <CountryCheckboxes selected={newCountries} onChange={setNewCountries} />
                      <p className="text-[11px] text-muted-foreground">
                        Select one or both to restrict access. Leave both unselected for all countries.
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddUser} disabled={submitting} data-testid="button-submit-user">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-users"
                />
              </div>
              <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                {(["ALL", "UK", "UAE"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={countryFilter === f ? "secondary" : "ghost"}
                    size="sm"
                    data-testid={`filter-country-${f.toLowerCase()}`}
                    onClick={() => setCountryFilter(f)}
                    className={`text-xs px-3 ${countryFilter === f ? "shadow-sm" : ""}`}
                  >
                    {f === "ALL" ? "All" : f}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Country Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        <Avatar className="h-9 w-9" data-testid={`img-avatar-${user.id}`}>
                          <AvatarFallback className="bg-primary/10 text-primary">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-username-${user.id}`}>{user.name}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell data-testid={`text-countries-${user.id}`}>
                        {user.role === "super_admin" ? (
                          <span className="text-xs text-muted-foreground italic">Unrestricted</span>
                        ) : (
                          <CountryBadges value={user.allowedCountries} />
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {currentUser?.id !== user.id && canManageUsers(currentUser?.role, user.role) && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => openEditDialog(user)}
                              data-testid={`button-edit-${user.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(user.id)}
                              data-testid={`button-remove-${user.id}`}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details, role, and country access permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Username</Label>
              <Input id="edit-name" data-testid="input-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">Password</Label>
              <Input id="edit-password" type="password" placeholder="Leave blank to keep current" data-testid="input-edit-password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">Role</Label>
              <Select value={editRole} onValueChange={(val: any) => setEditRole(val)}>
                <SelectTrigger className="col-span-3" data-testid="select-edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {currentUser?.role === "super_admin" && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  {currentUser?.role === "super_admin" && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                <span className="flex items-center gap-1 justify-end">
                  <Globe className="w-3 h-3" /> Countries
                </span>
              </Label>
              <div className="col-span-3 space-y-1">
                <CountryCheckboxes selected={editCountries} onChange={setEditCountries} />
                <p className="text-[11px] text-muted-foreground">
                  Select one or both to restrict access. Leave both unselected for all countries.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={submitting} data-testid="button-save-edit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
