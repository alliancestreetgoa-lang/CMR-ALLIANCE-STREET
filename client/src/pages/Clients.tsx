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
import { MoreHorizontal, Plus, Download, Search, Loader2, Trash2, Building2, CircleCheck, CircleMinus, Globe, Sparkles, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, ShieldCheck } from "lucide-react";
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
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const getMonthValue = (ym: string) => ym ? ym.substring(5, 7) : "";
const setMonthValue = (month: string, existing: string) => {
  const year = existing ? existing.substring(0, 4) : new Date().getFullYear().toString();
  return `${year}-${month}`;
};

type LicenseUrgency = "expired" | "critical" | "warning" | "upcoming" | "normal";
const getLicenseUrgency = (dateStr: string | null): LicenseUrgency => {
  if (!dateStr) return "normal";
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 5) return "critical";
  if (days <= 15) return "warning";
  if (days <= 30) return "upcoming";
  return "normal";
};
const URGENCY_ROW: Record<LicenseUrgency, string> = {
  expired:  "bg-red-50 dark:bg-red-950/20",
  critical: "bg-red-50 dark:bg-red-950/20",
  warning:  "bg-orange-50 dark:bg-orange-950/20",
  upcoming: "bg-yellow-50 dark:bg-yellow-950/20",
  normal:   "",
};
const URGENCY_STICKY: Record<LicenseUrgency, string> = {
  expired:  "bg-red-50 dark:bg-red-950/20",
  critical: "bg-red-50 dark:bg-red-950/20",
  warning:  "bg-orange-50 dark:bg-orange-950/20",
  upcoming: "bg-yellow-50 dark:bg-yellow-950/20",
  normal:   "bg-background",
};
const URGENCY_TEXT: Record<LicenseUrgency, string> = {
  expired:  "text-red-600 dark:text-red-400",
  critical: "text-red-600 dark:text-red-400",
  warning:  "text-orange-600 dark:text-orange-400",
  upcoming: "text-amber-600 dark:text-amber-400",
  normal:   "text-foreground",
};
const URGENCY_VAT_CELL: Record<LicenseUrgency, string> = {
  expired:  "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  critical: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  warning:  "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
  upcoming: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  normal:   "",
};

const getVatUrgency = (vatPeriodEnd: string | null | undefined, status: string): LicenseUrgency => {
  if (!vatPeriodEnd) return "normal";
  if (status === "Completed" || status === "Filed") return "normal";
  const parts = vatPeriodEnd.split("-");
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const endDate = new Date(year, month, 0); // last day of the month
  const days = Math.ceil((endDate.getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 5) return "critical";
  if (days <= 15) return "warning";
  if (days <= 30) return "upcoming";
  return "normal";
};

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
  plMonthly: "false",
  plMonthlyDate: "",
  plQuarterly: "false",
  plQuarterlyDate: "",
  vatQuarterlyUk: "false",
  vatQuarterlyDraft1Date: "",
  vatQuarterlyDraft2Date: "",
  vatQuarterlySubmitDate: "",
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("Active");

  // Derive which country options this user is allowed to filter by
  const allowedCountrySet: ("UK" | "UAE")[] = (() => {
    if (!user || user.role === "super_admin" || !user.allowedCountries) return ["UK", "UAE"];
    return user.allowedCountries.split(",").map(c => c.trim()).filter((c): c is "UK" | "UAE" => c === "UK" || c === "UAE");
  })();
  const showCountryFilter = allowedCountrySet.length > 1;
  const [countryFilter, setCountryFilter] = useState<"ALL" | "UK" | "UAE">(() =>
    allowedCountrySet.length === 1 ? allowedCountrySet[0] : "ALL"
  );

  const [clients, setClients] = useState<Client[]>([]);
  const [vatRecords, setVatRecords] = useState<VatRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    summary: string;
    atRiskClients: Array<{ clientId: number; clientName: string; riskLevel: "High" | "Medium" | "Low"; issues: string[] }>;
    insights: string[];
    recommendations: string[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  async function fetchAiInsights() {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await api.post("/api/ai/client-insights", {});
      setAiResult(result);
      setAiPanelOpen(true);
    } catch (err: any) {
      setAiError(err.message || "Failed to get AI insights");
      toast({ title: "AI Error", description: err.message || "Failed to get AI insights", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }

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

  // When Add dialog opens, default country to user's only allowed country
  useEffect(() => {
    if (dialogOpen && allowedCountrySet.length === 1) {
      setFormData(f => ({ ...f, country: allowedCountrySet[0] }));
    }
  }, [dialogOpen]);

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

  // Summary stats (computed from all loaded clients, before table filter)
  const visibleClients = clients.filter(c =>
    allowedCountrySet.length === 0 || allowedCountrySet.includes(c.country as "UK" | "UAE")
  );
  const statsAll = {
    total: visibleClients.length,
    active: visibleClients.filter(c => c.status === "Active").length,
    inactive: visibleClients.filter(c => c.status === "Inactive").length,
  };
  const statsUK = {
    total: visibleClients.filter(c => c.country === "UK").length,
    active: visibleClients.filter(c => c.country === "UK" && c.status === "Active").length,
    inactive: visibleClients.filter(c => c.country === "UK" && c.status === "Inactive").length,
  };
  const statsUAE = {
    total: visibleClients.filter(c => c.country === "UAE").length,
    active: visibleClients.filter(c => c.country === "UAE" && c.status === "Active").length,
    inactive: visibleClients.filter(c => c.country === "UAE" && c.status === "Inactive").length,
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (client.vatNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === "ALL" || client.country === countryFilter;
    const matchesStatus = canManageClients
      ? (statusFilter === "ALL" || client.status === statusFilter)
      : client.status === "Active";
    return matchesSearch && matchesCountry && matchesStatus;
  });

  const handleExport = () => {
    const headers = [
      "Company Name", "Country", "Status", "Contact Person", "Email", "Phone",
      "VAT Number", "License Expiry Date",
      "Corp Tax Start", "Corp Tax End", "Corp Tax Due Date", "Corp Tax Status",
      "VAT Q1 Period", "VAT Q1 Due", "VAT Q1 Status",
      "VAT Q2 Period", "VAT Q2 Due", "VAT Q2 Status",
      "VAT Q3 Period", "VAT Q3 Due", "VAT Q3 Status",
      "VAT Q4 Period", "VAT Q4 Due", "VAT Q4 Status",
    ];

    const escape = (v: string | null | undefined) => {
      if (v == null || v === "") return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = filteredClients.map(client => {
      const q1 = vatRecords.find(r => r.clientId === client.id && r.vatQuarter === "Q1");
      const q2 = vatRecords.find(r => r.clientId === client.id && r.vatQuarter === "Q2");
      const q3 = vatRecords.find(r => r.clientId === client.id && r.vatQuarter === "Q3");
      const q4 = vatRecords.find(r => r.clientId === client.id && r.vatQuarter === "Q4");

      const qPeriod = (r: typeof q1) => r ? `${r.vatPeriodStart ?? ""} - ${r.vatPeriodEnd ?? ""}` : "";

      return [
        escape(client.companyName),
        escape(client.country),
        escape(client.status),
        escape(client.contactPerson),
        escape(client.email),
        escape(client.phone),
        escape(client.vatNumber),
        escape(client.licenseExpiryDate),
        escape(client.corporateTaxStartMonth),
        escape(client.corporateTaxEndMonth),
        escape(client.corporateTaxDueDate),
        escape(client.corporateTaxStatus),
        escape(qPeriod(q1)), escape(q1?.vatDueDate), escape(q1?.status),
        escape(qPeriod(q2)), escape(q2?.vatDueDate), escape(q2?.status),
        escape(qPeriod(q3)), escape(q3?.vatDueDate), escape(q3?.status),
        escape(qPeriod(q4)), escape(q4?.vatDueDate), escape(q4?.status),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filterLabel = countryFilter !== "ALL" ? `_${countryFilter}` : "";
    const statusLabel = statusFilter !== "ALL" ? `_${statusFilter}` : "";
    link.download = `clients${filterLabel}${statusLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${filteredClients.length} client${filteredClients.length !== 1 ? "s" : ""} to CSV` });
  };

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

  const formatPeriodMonth = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    try {
      const normalized = dateStr.length === 7 ? dateStr + "-01" : dateStr;
      return format(new Date(normalized), "MMMM");
    } catch {
      return dateStr;
    }
  };

  const getVatStatusBadge = (clientId: number, quarter: "Q1" | "Q2" | "Q3" | "Q4") => {
    const record = getVatRecord(clientId, quarter);

    if (!record || record.isActive === "false") {
      return <span className="text-xs text-muted-foreground flex justify-center">—</span>;
    }

    const status = record?.status || "Not Started";
    
    let variant: "default" | "success" | "destructive" | "warning" | "secondary" | "outline" = "outline";
    if (status === "Completed" || status === "Filed") variant = "success";
    if (status === "Overdue") variant = "destructive";
    if (status === "In Progress") variant = "warning";
    if (status === "Not Started") variant = "secondary";

    const startLabel = formatPeriodMonth(record?.vatPeriodStart);
    const endLabel = formatPeriodMonth(record?.vatPeriodEnd);
    const periodLabel = startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel || endLabel || "-";

    if (record) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 w-full cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors" data-testid={`vat-status-${clientId}-${quarter}`}>
              <span className="text-[10px] font-medium text-muted-foreground text-center">
                {periodLabel}
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
      <div className="flex flex-col items-center gap-0.5 w-full">
        <span className="text-[10px] font-medium text-muted-foreground text-center">{periodLabel}</span>
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
        plMonthly: formData.country === "UK" ? formData.plMonthly : "false",
        plMonthlyDate: formData.country === "UK" && formData.plMonthly === "true" ? formData.plMonthlyDate || null : null,
        plQuarterly: formData.country === "UK" ? formData.plQuarterly : "false",
        plQuarterlyDate: formData.country === "UK" && formData.plQuarterly === "true" ? formData.plQuarterlyDate || null : null,
        vatQuarterlyUk: formData.country === "UK" ? formData.vatQuarterlyUk : "false",
        vatQuarterlyDraft1Date: formData.country === "UK" && formData.vatQuarterlyUk === "true" ? formData.vatQuarterlyDraft1Date || null : null,
        vatQuarterlyDraft2Date: formData.country === "UK" && formData.vatQuarterlyUk === "true" ? formData.vatQuarterlyDraft2Date || null : null,
        vatQuarterlySubmitDate: formData.country === "UK" && formData.vatQuarterlyUk === "true" ? formData.vatQuarterlySubmitDate || null : null,
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
      plMonthly: client.plMonthly || "false",
      plMonthlyDate: client.plMonthlyDate || "",
      plQuarterly: client.plQuarterly || "false",
      plQuarterlyDate: client.plQuarterlyDate || "",
      vatQuarterlyUk: client.vatQuarterlyUk || "false",
      vatQuarterlyDraft1Date: client.vatQuarterlyDraft1Date || "",
      vatQuarterlyDraft2Date: client.vatQuarterlyDraft2Date || "",
      vatQuarterlySubmitDate: client.vatQuarterlySubmitDate || "",
      status: client.status || "Active",
      vatQ1Start: clientVatRecords.find(r => r.vatQuarter === "Q1")?.vatPeriodStart || "",
      vatQ1End: clientVatRecords.find(r => r.vatQuarter === "Q1")?.vatPeriodEnd || "",
      vatQ1Active: getVatActive("Q1"),
      vatQ2Start: clientVatRecords.find(r => r.vatQuarter === "Q2")?.vatPeriodStart || "",
      vatQ2End: clientVatRecords.find(r => r.vatQuarter === "Q2")?.vatPeriodEnd || "",
      vatQ2Active: getVatActive("Q2"),
      vatQ3Start: clientVatRecords.find(r => r.vatQuarter === "Q3")?.vatPeriodStart || "",
      vatQ3End: clientVatRecords.find(r => r.vatQuarter === "Q3")?.vatPeriodEnd || "",
      vatQ3Active: getVatActive("Q3"),
      vatQ4Start: clientVatRecords.find(r => r.vatQuarter === "Q4")?.vatPeriodStart || "",
      vatQ4End: clientVatRecords.find(r => r.vatQuarter === "Q4")?.vatPeriodEnd || "",
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
        plMonthly: editFormData.country === "UK" ? editFormData.plMonthly : "false",
        plMonthlyDate: editFormData.country === "UK" && editFormData.plMonthly === "true" ? editFormData.plMonthlyDate || null : null,
        plQuarterly: editFormData.country === "UK" ? editFormData.plQuarterly : "false",
        plQuarterlyDate: editFormData.country === "UK" && editFormData.plQuarterly === "true" ? editFormData.plQuarterlyDate || null : null,
        vatQuarterlyUk: editFormData.country === "UK" ? editFormData.vatQuarterlyUk : "false",
        vatQuarterlyDraft1Date: editFormData.country === "UK" && editFormData.vatQuarterlyUk === "true" ? editFormData.vatQuarterlyDraft1Date || null : null,
        vatQuarterlyDraft2Date: editFormData.country === "UK" && editFormData.vatQuarterlyUk === "true" ? editFormData.vatQuarterlyDraft2Date || null : null,
        vatQuarterlySubmitDate: editFormData.country === "UK" && editFormData.vatQuarterlyUk === "true" ? editFormData.vatQuarterlySubmitDate || null : null,
        status: editFormData.status,
      });

      const clientVatRecords = vatRecords.filter(r => r.clientId === editingClient.id);
      for (const q of ["Q1", "Q2", "Q3", "Q4"] as const) {
        const activeKey = `vat${q}Active` as keyof typeof editFormData;
        const startKey = `vat${q}Start` as keyof typeof editFormData;
        const endKey = `vat${q}End` as keyof typeof editFormData;
        const isActive = editFormData[activeKey] ? "true" : "false";
        const record = clientVatRecords.find(r => r.vatQuarter === q);
        if (record) {
          const updates: Record<string, string | null> = {};
          if (record.isActive !== isActive) updates.isActive = isActive;
          const newStart = (editFormData[startKey] as string) || null;
          const newEnd = (editFormData[endKey] as string) || null;
          if (record.vatPeriodStart !== newStart) updates.vatPeriodStart = newStart;
          if (record.vatPeriodEnd !== newEnd) updates.vatPeriodEnd = newEnd;
          if (Object.keys(updates).length > 0) {
            await api.patch(`/api/vat-records/${record.id}`, updates);
          }
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

  // Helper: stat card definition
  type IconComponent = (props: { className?: string }) => JSX.Element;
  type StatCard = { label: string; icon: IconComponent; stats: typeof statsAll; country: "ALL" | "UK" | "UAE"; colorClass: string };
  const statCards: StatCard[] = [
    ...(showCountryFilter || allowedCountrySet.length === 0
      ? [{ label: "All Clients", icon: Globe, stats: statsAll, country: "ALL" as const, colorClass: "text-primary" }]
      : []),
    ...(allowedCountrySet.includes("UK")
      ? [{ label: "UK Clients", icon: Building2, stats: statsUK, country: "UK" as const, colorClass: "text-blue-600 dark:text-blue-400" }]
      : []),
    ...(allowedCountrySet.includes("UAE")
      ? [{ label: "UAE Clients", icon: Building2, stats: statsUAE, country: "UAE" as const, colorClass: "text-amber-600 dark:text-amber-400" }]
      : []),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Client Management</h1>
            <p className="text-muted-foreground">Detailed compliance tracking view.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canManageClients && (
              <Button
                variant="outline"
                onClick={fetchAiInsights}
                disabled={aiLoading}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950"
                data-testid="button-ai-insights"
              >
                {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Insights
              </Button>
            )}
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
                            <Select
                              data-testid={`input-vat-${q.toLowerCase()}-start`}
                              value={getMonthValue((formData[startKey] as string) || "")}
                              onValueChange={(m) => setFormData({ ...formData, [startKey]: setMonthValue(m, (formData[startKey] as string) || "") })}
                              disabled={!isActive}
                            >
                              <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                              <SelectContent>{MONTHS.map((name, i) => <SelectItem key={name} value={String(i+1).padStart(2,"0")}>{name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select
                              data-testid={`input-vat-${q.toLowerCase()}-end`}
                              value={getMonthValue((formData[endKey] as string) || "")}
                              onValueChange={(m) => setFormData({ ...formData, [endKey]: setMonthValue(m, (formData[endKey] as string) || "") })}
                              disabled={!isActive}
                            >
                              <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
                              <SelectContent>{MONTHS.map((name, i) => <SelectItem key={name} value={String(i+1).padStart(2,"0")}>{name}</SelectItem>)}</SelectContent>
                            </Select>
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
                    <div className="border-t pt-4 mt-2 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Label className="text-sm font-semibold">VAT (Quarterly)</Label>
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only</span>
                        </div>
                        <div className="space-y-2">
                          <button
                            type="button"
                            data-testid="toggle-vat-quarterly-uk"
                            onClick={() => setFormData(f => ({ ...f, vatQuarterlyUk: f.vatQuarterlyUk === "true" ? "false" : "true" }))}
                            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                              formData.vatQuarterlyUk === "true"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            VAT (Quarterly)
                          </button>
                          {formData.vatQuarterlyUk === "true" && (
                            <div className="mt-3 space-y-2 pl-1">
                              {(["Draft 1", "Draft 2", "Submit"] as const).map((label) => {
                                const key = label === "Draft 1" ? "vatQuarterlyDraft1Date" : label === "Draft 2" ? "vatQuarterlyDraft2Date" : "vatQuarterlySubmitDate";
                                return (
                                  <div key={label} className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground w-16 shrink-0">{label}</span>
                                    <Input
                                      type="date"
                                      data-testid={`input-vat-quarterly-${label.toLowerCase().replace(" ", "")}-date`}
                                      value={formData[key as keyof typeof formData] as string}
                                      onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                                      className="w-44 h-9 text-sm"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Label className="text-sm font-semibold">P&amp;L Reporting</Label>
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              data-testid="toggle-pl-monthly"
                              onClick={() => setFormData(f => ({ ...f, plMonthly: f.plMonthly === "true" ? "false" : "true" }))}
                              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                                formData.plMonthly === "true"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border hover:bg-muted"
                              }`}
                            >
                              P&amp;L Monthly
                            </button>
                            {formData.plMonthly === "true" && (
                              <Input
                                type="date"
                                data-testid="input-pl-monthly-date"
                                value={formData.plMonthlyDate}
                                onChange={e => setFormData(f => ({ ...f, plMonthlyDate: e.target.value }))}
                                className="w-44 h-9 text-sm"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              data-testid="toggle-pl-quarterly"
                              onClick={() => setFormData(f => ({ ...f, plQuarterly: f.plQuarterly === "true" ? "false" : "true" }))}
                              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                                formData.plQuarterly === "true"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border hover:bg-muted"
                              }`}
                            >
                              P&amp;L Quarterly
                            </button>
                            {formData.plQuarterly === "true" && (
                              <Input
                                type="date"
                                data-testid="input-pl-quarterly-date"
                                value={formData.plQuarterlyDate}
                                onChange={e => setFormData(f => ({ ...f, plQuarterlyDate: e.target.value }))}
                                className="w-44 h-9 text-sm"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Label className="text-sm font-semibold">Weekly Schedule</Label>
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only — reminder sent day before</span>
                        </div>
                        <UkScheduleBuilder schedule={addSchedule} onChange={setAddSchedule} />
                      </div>
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
        </div>

        {/* Summary stat cards */}
        {!loading && (
          <div className={cn(
            "grid gap-4",
            statCards.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
            statCards.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            "grid-cols-1 sm:grid-cols-2"
          )}>
            {statCards.map((card) => {
              const isActive = countryFilter === card.country;
              return (
                <Card
                  key={card.country}
                  data-testid={`stat-card-${card.country.toLowerCase()}`}
                  onClick={() => {
                    setCountryFilter(card.country);
                    setStatusFilter("ALL");
                  }}
                  className={cn(
                    "cursor-pointer border transition-colors hover-elevate",
                    isActive ? "border-primary bg-primary/5" : "border-border/60"
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
                      <card.icon className={cn("w-4 h-4", card.colorClass)} />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-3">{card.stats.total}</div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <CircleCheck className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{card.stats.active}</span> Active
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CircleMinus className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{card.stats.inactive}</span> Inactive
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* AI Insights Panel */}
        {aiResult && (
          <div className="rounded-lg border border-purple-200 bg-purple-50/60 dark:border-purple-800 dark:bg-purple-950/30 overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between text-left"
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              data-testid="button-toggle-ai-panel"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100">AI Compliance Insights</h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400">{aiResult.summary}</p>
                </div>
              </div>
              {aiPanelOpen
                ? <ChevronUp className="h-4 w-4 text-purple-400 shrink-0" />
                : <ChevronDown className="h-4 w-4 text-purple-400 shrink-0" />}
            </button>

            {aiPanelOpen && (
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiResult.atRiskClients && aiResult.atRiskClients.length > 0 && (
                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">At-Risk Clients</span>
                      </div>
                      <ul className="space-y-2">
                        {aiResult.atRiskClients.map((c) => (
                          <li key={c.clientId} className="text-xs text-purple-800 dark:text-purple-200">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={cn(
                                "inline-flex h-1.5 w-1.5 rounded-full shrink-0",
                                c.riskLevel === "High" ? "bg-red-500" : c.riskLevel === "Medium" ? "bg-orange-400" : "bg-yellow-400"
                              )} />
                              <span className="font-medium">{c.clientName}</span>
                              <span className={cn(
                                "text-[10px] px-1 rounded",
                                c.riskLevel === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                c.riskLevel === "Medium" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" :
                                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                              )}>{c.riskLevel}</span>
                            </div>
                            <ul className="ml-3 space-y-0.5">
                              {c.issues.map((issue, i) => (
                                <li key={i} className="text-purple-600 dark:text-purple-400 flex items-start gap-1">
                                  <span className="shrink-0 mt-0.5">-</span>{issue}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="space-y-3">
                    {aiResult.insights && aiResult.insights.length > 0 && (
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">Key Insights</span>
                        </div>
                        <ul className="space-y-1">
                          {aiResult.insights.map((insight, i) => (
                            <li key={i} className="text-xs text-purple-700 dark:text-purple-300 flex items-start gap-1.5">
                              <span className="text-purple-400 mt-0.5 shrink-0">-</span>{insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">Recommendations</span>
                        </div>
                        <ul className="space-y-1">
                          {aiResult.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-purple-700 dark:text-purple-300 flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5 shrink-0">-</span>{rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
                 {showCountryFilter && (
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
                     {allowedCountrySet.includes("UK") && (
                       <Button
                         data-testid="button-filter-uk"
                         variant={countryFilter === "UK" ? "secondary" : "ghost"}
                         size="sm"
                         onClick={() => setCountryFilter("UK")}
                         className="h-7 text-xs"
                       >
                         UK
                       </Button>
                     )}
                     {allowedCountrySet.includes("UAE") && (
                       <Button
                         data-testid="button-filter-uae"
                         variant={countryFilter === "UAE" ? "secondary" : "ghost"}
                         size="sm"
                         onClick={() => setCountryFilter("UAE")}
                         className="h-7 text-xs"
                       >
                         UAE
                       </Button>
                     )}
                   </div>
                 )}
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
                 <Button variant="outline" size="sm" className="h-9" onClick={handleExport} data-testid="button-export">
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
                        <TableHead className="min-w-[140px] bg-primary/5 text-center">VAT Period Q1</TableHead>
                        <TableHead className="min-w-[140px] text-center">VAT Period Q2</TableHead>
                        <TableHead className="min-w-[140px] bg-primary/5 text-center">VAT Period Q3</TableHead>
                        <TableHead className="min-w-[140px] text-center">VAT Period Q4</TableHead>
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
                        filteredClients.map((client) => {
                          const urgency = getLicenseUrgency(client.licenseExpiryDate);
                          const q1Rec = getVatRecord(client.id, "Q1");
                          const q2Rec = getVatRecord(client.id, "Q2");
                          const q3Rec = getVatRecord(client.id, "Q3");
                          const q4Rec = getVatRecord(client.id, "Q4");
                          const vQ1 = (q1Rec && q1Rec.isActive !== "false") ? getVatUrgency(q1Rec.vatPeriodEnd, q1Rec.status || "") : "normal" as LicenseUrgency;
                          const vQ2 = (q2Rec && q2Rec.isActive !== "false") ? getVatUrgency(q2Rec.vatPeriodEnd, q2Rec.status || "") : "normal" as LicenseUrgency;
                          const vQ3 = (q3Rec && q3Rec.isActive !== "false") ? getVatUrgency(q3Rec.vatPeriodEnd, q3Rec.status || "") : "normal" as LicenseUrgency;
                          const vQ4 = (q4Rec && q4Rec.isActive !== "false") ? getVatUrgency(q4Rec.vatPeriodEnd, q4Rec.status || "") : "normal" as LicenseUrgency;
                          return (
                          <TableRow key={client.id} data-testid={`row-client-${client.id}`} className={cn("transition-colors group", URGENCY_ROW[urgency])}>
                            <TableCell className={cn("font-medium sticky left-0 border-r z-10 group-hover:brightness-[0.97]", URGENCY_STICKY[urgency])}>
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-foreground truncate max-w-[200px]" title={client.companyName} data-testid={`text-company-${client.id}`}>
                                  {client.companyName}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                   {client.country === "UK" ? "🇬🇧 UK" : "🇦🇪 UAE"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="">
                              <div className="flex flex-col gap-1">
                                {client.licenseExpiryDate ? (
                                  <>
                                    <span className={cn("text-xs font-mono font-medium", URGENCY_TEXT[urgency])}>
                                      {format(new Date(client.licenseExpiryDate), "dd MMM yyyy")}
                                    </span>
                                    {urgency === "expired" && (
                                       <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">EXPIRED</span>
                                    )}
                                    {urgency !== "expired" && urgency !== "normal" && (
                                       <span className={cn("text-[10px] font-semibold", URGENCY_TEXT[urgency])}>
                                         {urgency === "critical" ? "Due in ≤5 days" : urgency === "warning" ? "Due in ≤15 days" : "Due in ≤30 days"}
                                       </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="">
                               <div className="text-xs">
                                 <span className="text-muted-foreground">Start:</span> {client.corporateTaxStartMonth || "-"}
                                 <br />
                                 <span className="text-muted-foreground">End:</span> {client.corporateTaxEndMonth || "-"}
                               </div>
                            </TableCell>

                            <TableCell className="">
                              {client.corporateTaxDueDate ? (
                                <span className="text-xs font-mono text-foreground">
                                  {format(new Date(client.corporateTaxDueDate), "dd MMM yyyy")}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            <TableCell className={cn("border-l border-r text-center", vQ1 !== "normal" ? URGENCY_VAT_CELL[vQ1] : "bg-primary/5 border-border/30")}>
                              {getVatStatusBadge(client.id, "Q1")}
                            </TableCell>
                            <TableCell className={cn("border-r text-center", vQ2 !== "normal" ? URGENCY_VAT_CELL[vQ2] : "border-border/30")}>
                              {getVatStatusBadge(client.id, "Q2")}
                            </TableCell>
                            <TableCell className={cn("border-r text-center", vQ3 !== "normal" ? URGENCY_VAT_CELL[vQ3] : "bg-primary/5 border-border/30")}>
                              {getVatStatusBadge(client.id, "Q3")}
                            </TableCell>
                            <TableCell className={cn("border-r text-center", vQ4 !== "normal" ? URGENCY_VAT_CELL[vQ4] : "border-border/30")}>
                              {getVatStatusBadge(client.id, "Q4")}
                            </TableCell>

                            {canManageClients && (
                              <TableCell className="text-right sticky right-0 bg-background group-hover:bg-muted/30 z-10">
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
                          );
                        })
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
              <Label className="text-sm font-semibold">VAT Periods</Label>
              <div className="grid gap-2 mt-3">
                {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
                  const activeKey = `vat${q}Active` as keyof typeof editFormData;
                  const startKey = `vat${q}Start` as keyof typeof editFormData;
                  const endKey = `vat${q}End` as keyof typeof editFormData;
                  const isActive = editFormData[activeKey] as boolean;
                  return (
                    <div key={q} className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground w-6 shrink-0">{q}</Label>
                      {isActive ? (
                        <>
                          <Select
                            value={getMonthValue((editFormData[startKey] as string) || "")}
                            onValueChange={(m) => setEditFormData({ ...editFormData, [startKey]: setMonthValue(m, (editFormData[startKey] as string) || "") })}
                          >
                            <SelectTrigger data-testid={`input-edit-vat-${q.toLowerCase()}-start`} className="flex-1 text-sm"><SelectValue placeholder="Start" /></SelectTrigger>
                            <SelectContent>{MONTHS.map((name, i) => <SelectItem key={name} value={String(i+1).padStart(2,"0")}>{name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select
                            value={getMonthValue((editFormData[endKey] as string) || "")}
                            onValueChange={(m) => setEditFormData({ ...editFormData, [endKey]: setMonthValue(m, (editFormData[endKey] as string) || "") })}
                          >
                            <SelectTrigger data-testid={`input-edit-vat-${q.toLowerCase()}-end`} className="flex-1 text-sm"><SelectValue placeholder="End" /></SelectTrigger>
                            <SelectContent>{MONTHS.map((name, i) => <SelectItem key={name} value={String(i+1).padStart(2,"0")}>{name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            data-testid={`toggle-edit-vat-${q.toLowerCase()}-active`}
                            className="text-xs min-w-[80px] shrink-0 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setEditFormData({ ...editFormData, [activeKey]: !isActive })}
                          >
                            Active
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          data-testid={`toggle-edit-vat-${q.toLowerCase()}-active`}
                          className="text-xs min-w-[80px] ml-auto shrink-0 text-muted-foreground border-dashed"
                          onClick={() => setEditFormData({ ...editFormData, [activeKey]: !isActive })}
                        >
                          Inactive
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {editFormData.country === "UK" && (
              <div className="border-t pt-4 mt-2 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-sm font-semibold">VAT (Quarterly)</Label>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only</span>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      data-testid="edit-toggle-vat-quarterly-uk"
                      onClick={() => setEditFormData(f => ({ ...f, vatQuarterlyUk: f.vatQuarterlyUk === "true" ? "false" : "true" }))}
                      className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                        editFormData.vatQuarterlyUk === "true"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      VAT (Quarterly)
                    </button>
                    {editFormData.vatQuarterlyUk === "true" && (
                      <div className="mt-3 space-y-2 pl-1">
                        {(["Draft 1", "Draft 2", "Submit"] as const).map((label) => {
                          const key = label === "Draft 1" ? "vatQuarterlyDraft1Date" : label === "Draft 2" ? "vatQuarterlyDraft2Date" : "vatQuarterlySubmitDate";
                          return (
                            <div key={label} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-16 shrink-0">{label}</span>
                              <Input
                                type="date"
                                data-testid={`edit-input-vat-quarterly-${label.toLowerCase().replace(" ", "")}-date`}
                                value={editFormData[key as keyof typeof editFormData] as string}
                                onChange={e => setEditFormData(f => ({ ...f, [key]: e.target.value }))}
                                className="w-44 h-9 text-sm"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-sm font-semibold">P&amp;L Reporting</Label>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        data-testid="edit-toggle-pl-monthly"
                        onClick={() => setEditFormData(f => ({ ...f, plMonthly: f.plMonthly === "true" ? "false" : "true" }))}
                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                          editFormData.plMonthly === "true"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        P&amp;L Monthly
                      </button>
                      {editFormData.plMonthly === "true" && (
                        <Input
                          type="date"
                          data-testid="edit-input-pl-monthly-date"
                          value={editFormData.plMonthlyDate}
                          onChange={e => setEditFormData(f => ({ ...f, plMonthlyDate: e.target.value }))}
                          className="w-44 h-9 text-sm"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        data-testid="edit-toggle-pl-quarterly"
                        onClick={() => setEditFormData(f => ({ ...f, plQuarterly: f.plQuarterly === "true" ? "false" : "true" }))}
                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                          editFormData.plQuarterly === "true"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        P&amp;L Quarterly
                      </button>
                      {editFormData.plQuarterly === "true" && (
                        <Input
                          type="date"
                          data-testid="edit-input-pl-quarterly-date"
                          value={editFormData.plQuarterlyDate}
                          onChange={e => setEditFormData(f => ({ ...f, plQuarterlyDate: e.target.value }))}
                          className="w-44 h-9 text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-sm font-semibold">Weekly Schedule</Label>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">UK only — reminder sent day before</span>
                  </div>
                  <UkScheduleBuilder schedule={editSchedule} onChange={setEditSchedule} />
                </div>
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
