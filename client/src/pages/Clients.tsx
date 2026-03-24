import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoreHorizontal, Plus, Download, Search, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Client = {
  id: number;
  companyName: string;
  country: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  licenseExpiryDate: string | null;
  corporateTaxStartMonth: string | null;
  corporateTaxEndMonth: string | null;
  corporateTaxDueDate: string | null;
  status: string;
  createdAt: string;
};

type VatRecord = {
  id: number;
  clientId: number;
  vatQuarter: "Q1" | "Q2" | "Q3" | "Q4";
  vatPeriodStart: string | null;
  vatPeriodEnd: string | null;
  vatDueDate: string | null;
  status: "Not Started" | "In Progress" | "Filed" | "Completed" | "Overdue";
  assignedTo: number | null;
  isActive: string | null;
};

// ===== UK WEEKLY SCHEDULE =====
type ScheduleItem = { taskName: string; days: string[] };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const UK_TASK_DEFAULTS: ScheduleItem[] = [
  { taskName: "DATA Sourcing", days: ["Fri"] },
  { taskName: "DATA Entry", days: ["Mon", "Tue"] },
  { taskName: "Bank Reconciliation", days: ["Wed", "Thu"] },
  { taskName: "DATA Checks", days: ["Thu", "Fri"] },
];

function freshSchedule() {
  return UK_TASK_DEFAULTS.map(t => ({ taskName: t.taskName, days: [...t.days] }));
}

function UkScheduleBuilder({ schedule, onChange }: { schedule: ScheduleItem[]; onChange: (s: ScheduleItem[]) => void }) {
  const toggleDay = (idx: number, day: string) => {
    onChange(schedule.map((item, i) => {
      if (i !== idx) return item;
      const days = item.days.includes(day)
        ? item.days.filter(d => d !== day)
        : [...item.days, day];
      return { ...item, days };
    }));
  };
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-[140px_1fr] gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Task</span>
        <div className="flex gap-1">
          {WEEKDAYS.map(d => (
            <span key={d} className="w-9 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{d}</span>
          ))}
        </div>
      </div>
      {schedule.map((item, i) => (
        <div key={item.taskName} className="grid grid-cols-[140px_1fr] gap-2 items-center">
          <span className="text-xs font-medium text-foreground truncate" title={item.taskName}>{item.taskName}</span>
          <div className="flex gap-1">
            {WEEKDAYS.map(day => {
              const active = item.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  data-testid={`sched-${i}-${day}`}
                  onClick={() => toggleDay(i, day)}
                  className={`w-9 h-7 rounded-md text-xs font-medium border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const emptyForm = {
  companyName: "",
  country: "UK",
  contactPerson: "",
  email: "",
  phone: "",
  vatNumber: "",
  licenseExpiryDate: "",
  corporateTaxStartMonth: "",
  corporateTaxEndMonth: "",
  corporateTaxDueDate: "",
  status: "Active",
  vatQ1Start: "",
  vatQ1End: "",
  vatQ1Active: true,
  vatQ2Start: "",
  vatQ2End: "",
  vatQ2Active: true,
  vatQ3Start: "",
  vatQ3End: "",
  vatQ3Active: true,
  vatQ4Start: "",
  vatQ4End: "",
  vatQ4Active: true,
};

export default function Clients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<"ALL" | "UK" | "UAE">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("Active");

  const [clients, setClients] = useState<Client[]>([]);
  const [vatRecords, setVatRecords] = useState<VatRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState(emptyForm);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addSchedule, setAddSchedule] = useState<ScheduleItem[]>(freshSchedule());
  const [editSchedule, setEditSchedule] = useState<ScheduleItem[]>(freshSchedule());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsData, vatData] = await Promise.all([
        api.get("/api/clients"),
        api.get("/api/vat-records"),
      ]);
      setClients(clientsData);
      setVatRecords(vatData);
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const canManageClients = user?.role === "super_admin" || user?.role === "admin";

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (client.vatNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === "ALL" || client.country === countryFilter;
    const matchesStatus = canManageClients
      ? (statusFilter === "ALL" || client.status === statusFilter)
      : client.status === "Active";
    return matchesSearch && matchesCountry && matchesStatus;
  });

  const getVatRecord = (clientId: number, quarter: "Q1" | "Q2" | "Q3" | "Q4") => {
    return vatRecords.find(r => r.clientId === clientId && r.vatQuarter === quarter) || null;
  };

  const vatStatuses = ["Not Started", "In Progress", "Filed", "Completed", "Overdue"] as const;

  const handleVatStatusChange = async (recordId: number, newStatus: string) => {
    try {
      const updated = await api.patch(`/api/vat-records/${recordId}`, { status: newStatus });
      setVatRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status: updated.status } : r))
      );
      toast({ title: "VAT status updated" });
    } catch (err: any) {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    }
  };

  const getVatStatusBadge = (clientId: number, quarter: "Q1" | "Q2" | "Q3" | "Q4") => {
    const record = getVatRecord(clientId, quarter);
    const status = record?.status || "Not Started";
    
    let variant: "default" | "success" | "destructive" | "warning" | "secondary" | "outline" = "outline";
    if (status === "Completed" || status === "Filed") variant = "success";
    if (status === "Overdue") variant = "destructive";
    if (status === "In Progress") variant = "warning";
    if (status === "Not Started") variant = "secondary";

    if (record) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col gap-0.5 min-w-[100px] text-left cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors" data-testid={`vat-status-${clientId}-${quarter}`}>
              <span className="text-[10px] font-medium text-muted-foreground">
                {record?.vatDueDate ? format(new Date(record.vatDueDate), "MMM yyyy") : "-"}
              </span>
              <StatusBadge status={status} variant={variant} className="w-fit text-[10px] px-1.5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {vatStatuses.map((s) => (
              <DropdownMenuItem
                key={s}
                className={cn("text-xs", s === status && "font-bold bg-muted")}
                onClick={() => handleVatStatusChange(record.id, s)}
                data-testid={`vat-option-${s}`}
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex flex-col gap-0.5 min-w-[100px]">
        <span className="text-[10px] font-medium text-muted-foreground">—</span>
        <StatusBadge status={status} variant={variant} className="w-fit text-[10px] px-1.5 h-5" />
      </div>
    );
  };

  const handleAddClient = async () => {
    try {
      setSubmitting(true);
      const created = await api.post("/api/clients", {
        companyName: formData.companyName,
        country: formData.country,
        contactPerson: formData.contactPerson || null,
        email: formData.email || null,
        phone: formData.phone || null,
        vatNumber: formData.vatNumber || null,
        licenseExpiryDate: formData.licenseExpiryDate || null,
        corporateTaxStartMonth: formData.corporateTaxStartMonth || null,
        corporateTaxEndMonth: formData.corporateTaxEndMonth || null,
        corporateTaxDueDate: formData.corporateTaxDueDate || null,
        status: "Active",
        vatPeriods: {
          Q1: { start: formData.vatQ1Start || null, end: formData.vatQ1End || null, isActive: formData.vatQ1Active ? "true" : "false" },
          Q2: { start: formData.vatQ2Start || null, end: formData.vatQ2End || null, isActive: formData.vatQ2Active ? "true" : "false" },
          Q3: { start: formData.vatQ3Start || null, end: formData.vatQ3End || null, isActive: formData.vatQ3Active ? "true" : "false" },
          Q4: { start: formData.vatQ4Start || null, end: formData.vatQ4End || null, isActive: formData.vatQ4Active ? "true" : "false" },
        },
      });
      if (formData.country === "UK" && created?.id) {
        await api.put(`/api/clients/${created.id}/uk-schedule`, {
          items: addSchedule.map(s => ({ taskName: s.taskName, days: s.days.join(",") })),
        });
      }
      toast({ title: "Client added successfully" });
      setDialogOpen(false);
      setFormData(emptyForm);
      setAddSchedule(freshSchedule());
      fetchData();
    } catch (err: any) {
      toast({ title: "Error adding client", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = async (client: Client) => {
    setEditingClient(client);
    const clientVatRecords = vatRecords.filter(r => r.clientId === client.id);
    const getVatActive = (quarter: string) => {
      const record = clientVatRecords.find(r => r.vatQuarter === quarter);
      return record ? record.isActive !== "false" : true;
    };
    setEditFormData({
      companyName: client.companyName,
      country: client.country,
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      vatNumber: client.vatNumber || "",
      licenseExpiryDate: client.licenseExpiryDate || "",
      corporateTaxStartMonth: client.corporateTaxStartMonth || "",
      corporateTaxEndMonth: client.corporateTaxEndMonth || "",
      corporateTaxDueDate: client.corporateTaxDueDate || "",
      status: client.status || "Active",
      vatQ1Start: "",
      vatQ1End: "",
      vatQ1Active: getVatActive("Q1"),
      vatQ2Start: "",
      vatQ2End: "",
      vatQ2Active: getVatActive("Q2"),
      vatQ3Start: "",
      vatQ3End: "",
      vatQ3Active: getVatActive("Q3"),
      vatQ4Start: "",
      vatQ4End: "",
      vatQ4Active: getVatActive("Q4"),
    });
    if (client.country === "UK") {
      try {
        const existing = await api.get(`/api/clients/${client.id}/uk-schedule`);
        const sched = UK_TASK_DEFAULTS.map(t => {
          const found = existing.find((s: any) => s.taskName === t.taskName);
          return { taskName: t.taskName, days: found && found.days ? found.days.split(",").filter(Boolean) : [...t.days] };
        });
        setEditSchedule(sched);
      } catch {
        setEditSchedule(freshSchedule());
      }
    } else {
      setEditSchedule(freshSchedule());
    }
    setEditDialogOpen(true);
  };

  const handleEditClient = async () => {
    if (!editingClient) return;
    try {
      setSubmitting(true);
      await api.patch(`/api/clients/${editingClient.id}`, {
        companyName: editFormData.companyName,
        country: editFormData.country,
        contactPerson: editFormData.contactPerson || null,
        email: editFormData.email || null,
        phone: editFormData.phone || null,
        vatNumber: editFormData.vatNumber || null,
        licenseExpiryDate: editFormData.licenseExpiryDate || null,
        corporateTaxStartMonth: editFormData.corporateTaxStartMonth || null,
        corporateTaxEndMonth: editFormData.corporateTaxEndMonth || null,
        corporateTaxDueDate: editFormData.corporateTaxDueDate || null,
        status: editFormData.status,
      });

      const clientVatRecords = vatRecords.filter(r => r.clientId === editingClient.id);
      for (const q of ["Q1", "Q2", "Q3", "Q4"] as const) {
        const activeKey = `vat${q}Active` as keyof typeof editFormData;
        const isActive = editFormData[activeKey] ? "true" : "false";
        const record = clientVatRecords.find(r => r.vatQuarter === q);
        if (record && record.isActive !== isActive) {
          await api.patch(`/api/vat-records/${record.id}`, { isActive });
        }
      }

      if (editFormData.country === "UK") {
        await api.put(`/api/clients/${editingClient.id}/uk-schedule`, {
          items: editSchedule.map(s => ({ taskName: s.taskName, days: s.days.join(",") })),
        });
      }

      toast({ title: "Client updated successfully" });
      setEditDialogOpen(false);
      setEditingClient(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error updating client", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveClient = async (client: Client) => {
    try {
      await api.patch(`/api/clients/${client.id}`, { status: "Inactive" });
      toast({ title: `${client.companyName} archived` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error archiving client", description: err.message, variant: "destructive" });
    }
  };

  const openViewDetails = (client: Client) => {
    setViewingClient(client);
    setDetailDialogOpen(true);
  };

  const openDeleteDialog = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    try {
      setDeleting(true);
      await api.delete(`/api/clients/${deletingClient.id}`);
      toast({ title: "Client deleted", description: `${deletingClient.companyName} has been deleted.` });
      setClients(prev => prev.filter(c => c.id !== deletingClient.id));
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete client", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Client Management</h1>
            <p className="text-muted-foreground">Detailed compliance tracking view.</p>
          </div>
          {canManageClients && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-client" className="shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  <Plus className="mr-2 h-4 w-4" /> Add New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>Fill in the details for the new client.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input data-testid="input-company-name" id="companyName" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="UAE">UAE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input data-testid="input-vat-number" id="vatNumber" value={formData.vatNumber} onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })} placeholder="e.g. GB123456789" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="licenseExpiryDate">License Expiry Date</Label>
                    <Input data-testid="input-license-expiry" id="licenseExpiryDate" type="date" value={formData.licenseExpiryDate} onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="corporateTaxStartMonth">Corporate Tax Start Month</Label>
                    <Input data-testid="input-tax-start" id="corporateTaxStartMonth" placeholder="e.g. January" value={formData.corporateTaxStartMonth} onChange={(e) => setFormData({ ...formData, corporateTaxStartMonth: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="corporateTaxEndMonth">Corporate Tax End Month</Label>
                    <Input data-testid="input-tax-end" id="corporateTaxEndMonth" placeholder="e.g. December" value={formData.corporateTaxEndMonth} onChange={(e) => setFormData({ ...formData, corporateTaxEndMonth: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="corporateTaxDueDate">Corporate Tax Due Date</Label>
                    <Input data-testid="input-tax-due" id="corporateTaxDueDate" type="date" value={formData.corporateTaxDueDate} onChange={(e) => setFormData({ ...formData, corporateTaxDueDate: e.target.value })} />
                  </div>

                  <div className="border-t pt-4 mt-2">
                    <Label className="text-sm font-semibold">VAT Periods</Label>
                    <div className="grid gap-3 mt-3">
                      {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
                        const startKey = `vat${q}Start` as keyof typeof formData;
                        const endKey = `vat${q}End` as keyof typeof formData;
                        const activeKey = `vat${q}Active` as keyof typeof formData;
                        const isActive = formData[activeKey] as boolean;
                        return (
                          <div key={q} className="grid grid-cols-[60px_1fr_1fr_auto] gap-2 items-center">
                            <Label className="text-xs text-muted-foreground">{q}</Label>
                            <Input data-testid={`input-vat-${q.toLowerCase()}-start`} type="date" placeholder="Start" value={formData[startKey] as string} onChange={(e) => setFormData({ ...formData, [startKey]: e.target.value })} disabled={!isActive} />
                            <Input data-testid={`input-vat-${q.toLowerCase()}-end`} type="date" placeholder="End" value={formData[endKey] as string} onChange={(e) => setFormData({ ...formData, [endKey]: e.target.value })} disabled={!isActive} />
                            <Button
                              type="button"
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              data-testid={`toggle-vat-${q.toLowerCase()}-active`}
                              className={`text-xs min-w-[80px] ${isActive ? "bg-green-600 hover:bg-green-700 text-white" : "text-muted-foreground border-dashed"}`}
                              onClick={() => setFormData({ ...formData, [activeKey]: !isActive })}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {formData.country === "UK" && (
                    <div className="border-t pt-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="text-sm font-semibold">Weekly Schedule</Label>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only — reminder sent day before</span>
                      </div>
                      <UkScheduleBuilder schedule={addSchedule} onChange={setAddSchedule} />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button data-testid="button-submit-client" onClick={handleAddClient} disabled={submitting || !formData.companyName}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Client
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="border-border/60 shadow-sm overflow-hidden min-w-0">
          <CardHeader className="pb-4 bg-muted/10 border-b border-border/40">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="relative w-full sm:w-72">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   data-testid="input-search"
                   placeholder="Search company..." 
                   className="pl-9 bg-background" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="flex items-center gap-2 w-full sm:w-auto">
                 <div className="flex items-center border rounded-md bg-background p-1">
                    <Button 
                      data-testid="button-filter-all"
                      variant={countryFilter === "ALL" ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setCountryFilter("ALL")}
                      className="h-7 text-xs"
                    >
                      All
                    </Button>
                    <Button 
                      data-testid="button-filter-uk"
                      variant={countryFilter === "UK" ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setCountryFilter("UK")}
                      className="h-7 text-xs"
                    >
                      UK
                    </Button>
                    <Button 
                      data-testid="button-filter-uae"
                      variant={countryFilter === "UAE" ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setCountryFilter("UAE")}
                      className="h-7 text-xs"
                    >
                      UAE
                    </Button>
                 </div>
                 {canManageClients && (
                 <div className="flex items-center border rounded-md bg-background p-1">
                   <Button 
                     data-testid="button-filter-status-all"
                     variant={statusFilter === "ALL" ? "secondary" : "ghost"} 
                     size="sm" 
                     onClick={() => setStatusFilter("ALL")}
                     className="h-7 text-xs"
                   >
                     All
                   </Button>
                   <Button 
                     data-testid="button-filter-active"
                     variant={statusFilter === "Active" ? "secondary" : "ghost"} 
                     size="sm" 
                     onClick={() => setStatusFilter("Active")}
                     className="h-7 text-xs"
                   >
                     Active
                   </Button>
                   <Button 
                     data-testid="button-filter-inactive"
                     variant={statusFilter === "Inactive" ? "secondary" : "ghost"} 
                     size="sm" 
                     onClick={() => setStatusFilter("Inactive")}
                     className="h-7 text-xs"
                   >
                     Inactive
                   </Button>
                 </div>
                 )}
                 <Button variant="outline" size="sm" className="h-9">
                   <Download className="mr-2 h-3 w-3" /> Export
                 </Button>
               </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto relative">
                  <Table className="min-w-[1200px]">
                    <TableHeader className="bg-muted/50 whitespace-nowrap">
                      <TableRow>
                        <TableHead className="w-[220px] sticky left-0 bg-muted/95 z-10 font-bold border-r">Company Name</TableHead>
                        <TableHead className="min-w-[140px]">License Expiry</TableHead>
                        <TableHead className="min-w-[180px]">Corporate Tax Period</TableHead>
                        <TableHead className="min-w-[140px]">Tax Due Date</TableHead>
                        <TableHead className="min-w-[140px] bg-primary/5">VAT Period Q1</TableHead>
                        <TableHead className="min-w-[140px]">VAT Period Q2</TableHead>
                        <TableHead className="min-w-[140px] bg-primary/5">VAT Period Q3</TableHead>
                        <TableHead className="min-w-[140px]">VAT Period Q4</TableHead>
                        {canManageClients && <TableHead className="text-right w-[50px] sticky right-0 bg-muted/95 z-10"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canManageClients ? 9 : 8} className="h-32 text-center text-muted-foreground">
                            No clients found matching criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients.map((client) => (
                          <TableRow key={client.id} data-testid={`row-client-${client.id}`} className="hover:bg-muted/30 transition-colors group">
                            <TableCell className="font-medium sticky left-0 bg-background group-hover:bg-muted/30 border-r z-10 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-foreground truncate max-w-[200px]" title={client.companyName} data-testid={`text-company-${client.id}`}>
                                  {client.companyName}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                   {client.country === "UK" ? "🇬🇧 UK" : "🇦🇪 UAE"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="align-top">
                              <div className="flex flex-col gap-1">
                                {client.licenseExpiryDate ? (
                                  <>
                                    <span className={cn(
                                      "text-xs font-mono font-medium",
                                      new Date(client.licenseExpiryDate) < new Date() ? "text-destructive" : "text-foreground"
                                    )}>
                                      {format(new Date(client.licenseExpiryDate), "dd MMM yyyy")}
                                    </span>
                                    {new Date(client.licenseExpiryDate) < new Date() && (
                                       <span className="text-[10px] text-destructive font-bold">EXPIRED</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="align-top">
                               <div className="text-xs">
                                 <span className="text-muted-foreground">Start:</span> {client.corporateTaxStartMonth || "-"}
                                 <br />
                                 <span className="text-muted-foreground">End:</span> {client.corporateTaxEndMonth || "-"}
                               </div>
                            </TableCell>

                            <TableCell className="align-top">
                              {client.corporateTaxDueDate ? (
                                <span className="text-xs font-mono text-foreground">
                                  {format(new Date(client.corporateTaxDueDate), "dd MMM yyyy")}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            <TableCell className="align-top bg-primary/5 border-l border-r border-border/30">
                              {getVatStatusBadge(client.id, "Q1")}
                            </TableCell>
                            <TableCell className="align-top border-r border-border/30">
                              {getVatStatusBadge(client.id, "Q2")}
                            </TableCell>
                            <TableCell className="align-top bg-primary/5 border-r border-border/30">
                              {getVatStatusBadge(client.id, "Q3")}
                            </TableCell>
                            <TableCell className="align-top border-r border-border/30">
                              {getVatStatusBadge(client.id, "Q4")}
                            </TableCell>

                            {canManageClients && (
                              <TableCell className="text-right sticky right-0 bg-background group-hover:bg-muted/30 z-10 align-top">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-actions-${client.id}`}>
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openViewDetails(client)} data-testid={`button-view-${client.id}`}>View Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditDialog(client)} data-testid={`button-edit-${client.id}`}>Edit Client</DropdownMenuItem>
                                    {user?.role === "super_admin" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => openDeleteDialog(client)} 
                                          data-testid={`button-delete-${client.id}`}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete Client
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-border/40 bg-muted/10">
                  <div className="text-xs text-muted-foreground" data-testid="text-client-count">
                    Showing <strong>{filteredClients.length}</strong> clients
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" disabled className="h-7 text-xs">Previous</Button>
                    <Button variant="outline" size="sm" disabled className="h-7 text-xs">Next</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Company Name</Label>
              <Input data-testid="input-edit-company" value={editFormData.companyName} onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Country</Label>
                <Select value={editFormData.country} onValueChange={(val) => setEditFormData({ ...editFormData, country: val })}>
                  <SelectTrigger data-testid="select-edit-country"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>VAT Number</Label>
                <Input data-testid="input-edit-vat" value={editFormData.vatNumber} onChange={(e) => setEditFormData({ ...editFormData, vatNumber: e.target.value })} placeholder="e.g. GB123456789" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>License Expiry Date</Label>
              <Input data-testid="input-edit-license" type="date" value={editFormData.licenseExpiryDate} onChange={(e) => setEditFormData({ ...editFormData, licenseExpiryDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>CT Start Month</Label>
                <Input data-testid="input-edit-ct-start" value={editFormData.corporateTaxStartMonth} onChange={(e) => setEditFormData({ ...editFormData, corporateTaxStartMonth: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>CT End Month</Label>
                <Input data-testid="input-edit-ct-end" value={editFormData.corporateTaxEndMonth} onChange={(e) => setEditFormData({ ...editFormData, corporateTaxEndMonth: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>CT Due Date</Label>
                <Input data-testid="input-edit-ct-due" type="date" value={editFormData.corporateTaxDueDate} onChange={(e) => setEditFormData({ ...editFormData, corporateTaxDueDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editFormData.status} onValueChange={(val) => setEditFormData({ ...editFormData, status: val })}>
                  <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-semibold">VAT Quarter Status</Label>
              <div className="grid gap-2 mt-3">
                {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
                  const activeKey = `vat${q}Active` as keyof typeof editFormData;
                  const isActive = editFormData[activeKey] as boolean;
                  return (
                    <div key={q} className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">{q}</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        data-testid={`toggle-edit-vat-${q.toLowerCase()}-active`}
                        className={`text-xs min-w-[80px] ${isActive ? "bg-green-600 hover:bg-green-700 text-white" : "text-muted-foreground border-dashed"}`}
                        onClick={() => setEditFormData({ ...editFormData, [activeKey]: !isActive })}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {editFormData.country === "UK" && (
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Label className="text-sm font-semibold">Weekly Schedule</Label>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only — reminder sent day before</span>
                </div>
                <UkScheduleBuilder schedule={editSchedule} onChange={setEditSchedule} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditClient} disabled={submitting || !editFormData.companyName} data-testid="button-save-edit">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{viewingClient?.companyName}</DialogTitle>
            <DialogDescription>{viewingClient?.country === "UK" ? "United Kingdom" : "United Arab Emirates"} Client</DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <div className="grid gap-3 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">VAT Number</p>
                  <p className="text-sm font-medium">{viewingClient.vatNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={viewingClient.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">License Expiry</p>
                  <p className="text-sm font-medium">{viewingClient.licenseExpiryDate ? format(new Date(viewingClient.licenseExpiryDate), "dd MMM yyyy") : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CT Due Date</p>
                  <p className="text-sm font-medium">{viewingClient.corporateTaxDueDate ? format(new Date(viewingClient.corporateTaxDueDate), "dd MMM yyyy") : "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">CT Period Start</p>
                  <p className="text-sm font-medium">{viewingClient.corporateTaxStartMonth || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CT Period End</p>
                  <p className="text-sm font-medium">{viewingClient.corporateTaxEndMonth || "-"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingClient?.companyName}</strong>? This action cannot be undone. All associated records will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteClient} disabled={deleting} data-testid="button-confirm-delete">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
