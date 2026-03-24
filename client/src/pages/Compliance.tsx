import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  FileText,
  Loader2,
  LayoutDashboard,
  List,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { VatRecord, Client } from "@shared/schema";

const vatStatuses = ["Not Started", "In Progress", "Filed", "Completed", "Overdue"] as const;
const ctStatuses = ["Not Started", "In Progress", "Filed", "Completed", "Overdue"] as const;
type CountryFilter = "all" | "UK" | "UAE";
type ViewMode = "dashboard" | "schedule";

function StatBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Compliance() {
  const [vatRecords, setVatRecords] = useState<VatRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get("/api/vat-records"),
      api.get("/api/clients"),
    ])
      .then(([vatData, clientData]) => {
        const activeClients = clientData.filter((c: Client) => c.status === "Active");
        const activeClientIds = new Set(activeClients.map((c: Client) => c.id));
        setClients(activeClients);
        setVatRecords(vatData.filter((r: VatRecord) => activeClientIds.has(r.clientId) && r.isActive !== "false"));
      })
      .finally(() => setLoading(false));
  }, []);

  const allowedCountries = user?.allowedCountries ?? null;
  const allowedSet = allowedCountries ? new Set(allowedCountries.split(",").map(s => s.trim())) : null;
  const showUK = !allowedSet || allowedSet.has("UK");
  const showUAE = !allowedSet || allowedSet.has("UAE");
  const showFilterButtons = showUK && showUAE;

  const filteredClients = countryFilter === "all"
    ? clients
    : clients.filter(c => c.country === countryFilter);

  const filteredClientIds = new Set(filteredClients.map(c => c.id));
  const filteredVatRecords = vatRecords.filter(r => filteredClientIds.has(r.clientId));

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.companyName ?? "Unknown Client";
  };

  const handleVatStatusChange = async (recordId: number, newStatus: string) => {
    try {
      await api.patch(`/api/vat-records/${recordId}`, { status: newStatus });
      setVatRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status: newStatus } : r))
      );
      toast({ title: "VAT status updated" });
    } catch (err: any) {
      toast({ title: "Error updating VAT status", description: err.message, variant: "destructive" });
    }
  };

  const handleCtStatusChange = async (clientId: number, newStatus: string) => {
    try {
      await api.patch(`/api/clients/${clientId}`, { corporateTaxStatus: newStatus });
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, corporateTaxStatus: newStatus } : c))
      );
      toast({ title: "Corporate tax status updated" });
    } catch (err: any) {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    }
  };

  const getCtStatusVariant = (status: string) => {
    if (status === "Completed" || status === "Filed") return "success";
    if (status === "Overdue") return "destructive";
    if (status === "In Progress") return "warning";
    return "secondary";
  };

  const sortedRecords = [...filteredVatRecords].sort((a, b) =>
    new Date(a.vatDueDate ?? "").getTime() - new Date(b.vatDueDate ?? "").getTime()
  );

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return { text: "No due date", color: "text-muted-foreground" };
    const days = differenceInDays(new Date(dateStr), new Date());
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: "text-destructive" };
    if (days === 0) return { text: "Due Today", color: "text-destructive font-bold" };
    if (days <= 7) return { text: `${days}d left`, color: "text-warning" };
    return { text: `${days}d left`, color: "text-muted-foreground" };
  };

  // ---- VAT stats ----
  const vatTotal = filteredVatRecords.length;
  const vatNotStarted = filteredVatRecords.filter(r => r.status === "Not Started").length;
  const vatInProgress = filteredVatRecords.filter(r => r.status === "In Progress").length;
  const vatFiled = filteredVatRecords.filter(r => r.status === "Filed" || r.status === "Completed").length;
  const vatOverdue = filteredVatRecords.filter(r => {
    if (!r.vatDueDate) return false;
    return r.status === "Overdue" || (differenceInDays(new Date(r.vatDueDate), new Date()) < 0 && r.status !== "Filed" && r.status !== "Completed");
  }).length;
  const openVatReturns = vatNotStarted + vatInProgress;
  const dueWithin7Days = filteredVatRecords.filter((r) => {
    if (!r.vatDueDate || r.status === "Filed" || r.status === "Completed") return false;
    const days = differenceInDays(new Date(r.vatDueDate), new Date());
    return days >= 0 && days <= 7;
  }).length;
  const vatComplianceRate = vatTotal > 0 ? Math.round((vatFiled / vatTotal) * 100) : 0;

  // ---- CT stats ----
  const clientsWithTax = filteredClients.filter(
    (c) => c.corporateTaxDueDate || c.corporateTaxStartMonth || c.corporateTaxEndMonth
  );
  const ctTotal = clientsWithTax.length;
  const ctNotStarted = clientsWithTax.filter(c => !c.corporateTaxStatus || c.corporateTaxStatus === "Not Started").length;
  const ctInProgress = clientsWithTax.filter(c => c.corporateTaxStatus === "In Progress").length;
  const ctFiled = clientsWithTax.filter(c => c.corporateTaxStatus === "Filed" || c.corporateTaxStatus === "Completed").length;
  const ctOverdue = clientsWithTax.filter(c => c.corporateTaxStatus === "Overdue").length;
  const ctComplianceRate = ctTotal > 0 ? Math.round((ctFiled / ctTotal) * 100) : 0;

  // ---- Upcoming deadlines (next 30 days, not yet filed) ----
  const upcomingDeadlines = [
    ...sortedRecords
      .filter(r => r.vatDueDate && r.status !== "Filed" && r.status !== "Completed")
      .filter(r => {
        const d = differenceInDays(new Date(r.vatDueDate!), new Date());
        return d >= 0 && d <= 30;
      })
      .map(r => ({
        id: `vat-${r.id}`,
        name: getClientName(r.clientId),
        label: `VAT ${r.vatQuarter}`,
        dueDate: r.vatDueDate!,
        status: r.status,
        type: "vat" as const,
      })),
    ...clientsWithTax
      .filter(c => c.corporateTaxDueDate && c.corporateTaxStatus !== "Filed" && c.corporateTaxStatus !== "Completed")
      .filter(c => {
        const d = differenceInDays(new Date(c.corporateTaxDueDate!), new Date());
        return d >= 0 && d <= 30;
      })
      .map(c => ({
        id: `ct-${c.id}`,
        name: c.companyName,
        label: "Corporate Tax",
        dueDate: c.corporateTaxDueDate!,
        status: c.corporateTaxStatus || "Not Started",
        type: "ct" as const,
      })),
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64" data-testid="loading-compliance">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground" data-testid="text-compliance-title">Compliance Tracker</h1>
            <p className="text-muted-foreground">Monitor VAT returns, Corporate Tax filings, and deadlines.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start">
            {/* View toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "dashboard" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("dashboard")}
                className="h-8 text-xs gap-1.5"
                data-testid="button-dashboard-view"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Button>
              <Button
                variant={viewMode === "schedule" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("schedule")}
                className="h-8 text-xs gap-1.5"
                data-testid="button-schedule-view"
              >
                <List className="h-3.5 w-3.5" />
                Schedule
              </Button>
            </div>

            {/* Country filter */}
            {showFilterButtons && (
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1" data-testid="country-filter-group">
                {(["all", "UK", "UAE"] as CountryFilter[]).map((f) => (
                  <button
                    key={f}
                    data-testid={`filter-country-${f}`}
                    onClick={() => setCountryFilter(f)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                      countryFilter === f
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======================== DASHBOARD VIEW ======================== */}
        {viewMode === "dashboard" && (
          <div className="space-y-6">

            {/* Top stat cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-total-clients">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Clients</p>
                      <p className="text-2xl font-bold mt-1" data-testid="text-total-clients">{filteredClients.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-vat-rate">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">VAT Filed Rate</p>
                      <p className="text-2xl font-bold mt-1" data-testid="text-vat-rate">{vatComplianceRate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{vatFiled} of {vatTotal} filed</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-ct-rate">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">CT Filed Rate</p>
                      <p className="text-2xl font-bold mt-1" data-testid="text-ct-rate">{ctComplianceRate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{ctFiled} of {ctTotal} filed</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={vatOverdue + ctOverdue > 0 ? "border-destructive/40 bg-destructive/5" : ""} data-testid="card-at-risk">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overdue / At Risk</p>
                      <p className="text-2xl font-bold mt-1" data-testid="text-at-risk">{vatOverdue + ctOverdue}</p>
                      <p className="text-xs text-muted-foreground mt-1">{dueWithin7Days} due within 7 days</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status breakdowns */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-vat-breakdown">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">VAT Returns</CardTitle>
                    <Badge variant="secondary" className="text-xs">{vatTotal} total</Badge>
                  </div>
                  <CardDescription>Status distribution across all quarters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {vatTotal === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No VAT records</p>
                  ) : (
                    <>
                      <StatBar label="Not Started" count={vatNotStarted} total={vatTotal} color="bg-muted-foreground/50" />
                      <StatBar label="In Progress" count={vatInProgress} total={vatTotal} color="bg-warning" />
                      <StatBar label="Filed / Completed" count={vatFiled} total={vatTotal} color="bg-green-500" />
                      <StatBar label="Overdue" count={vatOverdue} total={vatTotal} color="bg-destructive" />
                    </>
                  )}
                  <div className="pt-2 flex gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span>{vatFiled} filed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-warning" />
                      <span>{openVatReturns} open</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      <span>{vatOverdue} overdue</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-ct-breakdown">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Corporate Tax</CardTitle>
                    <Badge variant="secondary" className="text-xs">{ctTotal} total</Badge>
                  </div>
                  <CardDescription>Status distribution across all clients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ctTotal === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No corporate tax records</p>
                  ) : (
                    <>
                      <StatBar label="Not Started" count={ctNotStarted} total={ctTotal} color="bg-muted-foreground/50" />
                      <StatBar label="In Progress" count={ctInProgress} total={ctTotal} color="bg-warning" />
                      <StatBar label="Filed / Completed" count={ctFiled} total={ctTotal} color="bg-green-500" />
                      <StatBar label="Overdue" count={ctOverdue} total={ctTotal} color="bg-destructive" />
                    </>
                  )}
                  <div className="pt-2 flex gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span>{ctFiled} filed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-warning" />
                      <span>{ctNotStarted + ctInProgress} open</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      <span>{ctOverdue} overdue</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming deadlines — next 30 days */}
            <Card data-testid="card-upcoming-deadlines">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
                    <CardDescription>Filings due within the next 30 days</CardDescription>
                  </div>
                  {upcomingDeadlines.length > 0 && (
                    <Badge variant="secondary">{upcomingDeadlines.length} deadline{upcomingDeadlines.length !== 1 ? "s" : ""}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-green-500/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No filings due in the next 30 days</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingDeadlines.map((d) => {
                      const days = differenceInDays(new Date(d.dueDate), new Date());
                      const isUrgent = days <= 7;
                      const client = clients.find(c => c.companyName === d.name);
                      return (
                        <div
                          key={d.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                            isUrgent ? "border-warning/40 bg-warning/5" : "border-border/50 hover:bg-secondary/20"
                          )}
                          data-testid={`deadline-row-${d.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                              d.type === "vat" ? "bg-primary/10" : "bg-blue-100 dark:bg-blue-900/30"
                            )}>
                              {d.type === "vat"
                                ? <FileText className="h-4 w-4 text-primary" />
                                : <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{d.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{d.label}</span>
                                {client && (
                                  <span className={cn(
                                    "text-[10px] font-medium px-1.5 py-0 rounded-full",
                                    client.country === "UK"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  )}>
                                    {client.country}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className={cn("text-xs font-medium", isUrgent ? "text-warning" : "text-muted-foreground")}>
                                {days === 0 ? "Due Today" : `${days}d left`}
                              </p>
                              <p className="text-xs text-muted-foreground">{format(new Date(d.dueDate), "MMM dd, yyyy")}</p>
                            </div>
                            <StatusBadge status={d.status} className="text-[10px] px-2 py-0.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================== SCHEDULE VIEW ======================== */}
        {viewMode === "schedule" && (
          <Tabs defaultValue="vat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="vat" data-testid="tab-vat">VAT Returns</TabsTrigger>
              <TabsTrigger value="ct" data-testid="tab-ct">Corporate Tax</TabsTrigger>
            </TabsList>
            
            <TabsContent value="vat" className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20" data-testid="card-open-vat">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Open VAT Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-open-vat-count">{openVatReturns}</div>
                    <p className="text-xs text-muted-foreground">For current quarter</p>
                  </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/20" data-testid="card-due-7-days">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-warning">Due Within 7 Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-due-7-days-count">{dueWithin7Days}</div>
                    <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/5 border-destructive/20" data-testid="card-overdue">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-overdue-count">{vatOverdue}</div>
                    <p className="text-xs text-muted-foreground">Penalty risk high</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>VAT Schedule</CardTitle>
                  <CardDescription>
                    Upcoming filing deadlines
                    {countryFilter !== "all" ? ` — ${countryFilter} clients` : " for all clients"}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {sortedRecords.map((record) => {
                      const daysRemaining = getDaysRemaining(record.vatDueDate);
                      const client = clients.find(c => c.id === record.clientId);
                      return (
                        <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors" data-testid={`row-vat-${record.id}`}>
                          <div className="flex items-start gap-4 mb-4 sm:mb-0">
                            <div className="mt-1 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground" data-testid={`text-client-name-${record.id}`}>{getClientName(record.clientId)}</h4>
                                {client && (
                                  <span className={cn(
                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                    client.country === "UK"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  )}>
                                    {client.country}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>{record.vatQuarter} Return</span>
                                <span>•</span>
                                <span>
                                  {record.vatPeriodStart ? format(new Date(record.vatPeriodStart), "MMM") : "—"} - {record.vatPeriodEnd ? format(new Date(record.vatPeriodEnd), "MMM yyyy") : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                              <div className={`text-sm font-medium ${daysRemaining.color}`} data-testid={`text-days-remaining-${record.id}`}>
                                {daysRemaining.text}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {record.vatDueDate ? `Due: ${format(new Date(record.vatDueDate), "MMM dd, yyyy")}` : "No due date"}
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="cursor-pointer" data-testid={`button-vat-status-${record.id}`}>
                                  <StatusBadge status={record.status} className="px-3 py-1" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {vatStatuses.map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    className={cn("text-xs", s === record.status && "font-bold bg-muted")}
                                    onClick={() => handleVatStatusChange(record.id, s)}
                                    data-testid={`vat-option-${s}-${record.id}`}
                                  >
                                    {s}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                    {sortedRecords.length === 0 && (
                      <div className="text-center text-muted-foreground py-8" data-testid="text-no-vat-records">
                        No VAT records found{countryFilter !== "all" ? ` for ${countryFilter} clients` : ""}.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ct" className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20" data-testid="card-ct-open">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Open CT Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ctNotStarted + ctInProgress}</div>
                    <p className="text-xs text-muted-foreground">Not yet filed</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20" data-testid="card-ct-filed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Filed / Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ctFiled}</div>
                    <p className="text-xs text-muted-foreground">{ctComplianceRate}% compliance rate</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/5 border-destructive/20" data-testid="card-ct-overdue">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ctOverdue}</div>
                    <p className="text-xs text-muted-foreground">Penalty risk high</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Corporate Tax Schedule</CardTitle>
                  <CardDescription>
                    Corporate tax filing deadlines
                    {countryFilter !== "all" ? ` — ${countryFilter} clients` : " for all clients"}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {clientsWithTax.map((client) => {
                      const daysRemaining = getDaysRemaining(client.corporateTaxDueDate ?? null);
                      return (
                        <div key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors" data-testid={`row-ct-${client.id}`}>
                          <div className="flex items-start gap-4 mb-4 sm:mb-0">
                            <div className="mt-1 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <CalendarIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground" data-testid={`text-ct-client-${client.id}`}>{client.companyName}</h4>
                                <span className={cn(
                                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                  client.country === "UK"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                )}>
                                  {client.country}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>Tax Period: {client.corporateTaxStartMonth ?? "—"} - {client.corporateTaxEndMonth ?? "—"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                              <div className={`text-sm font-medium ${daysRemaining.color}`} data-testid={`text-ct-days-${client.id}`}>
                                {daysRemaining.text}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {client.corporateTaxDueDate ? `Due: ${client.corporateTaxDueDate}` : "No due date set"}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="cursor-pointer hover:opacity-80 transition-opacity" data-testid={`ct-status-${client.id}`}>
                                  <StatusBadge
                                    status={client.corporateTaxStatus || "Not Started"}
                                    variant={getCtStatusVariant(client.corporateTaxStatus || "Not Started")}
                                    className="px-3 py-1"
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {ctStatuses.map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    className={cn("text-xs", s === (client.corporateTaxStatus || "Not Started") && "font-bold bg-muted")}
                                    onClick={() => handleCtStatusChange(client.id, s)}
                                    data-testid={`ct-option-${s}-${client.id}`}
                                  >
                                    {s}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                    {clientsWithTax.length === 0 && (
                      <div className="text-center text-muted-foreground py-8" data-testid="text-no-ct-records">
                        No corporate tax records found{countryFilter !== "all" ? ` for ${countryFilter} clients` : ""}.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

      </div>
    </DashboardLayout>
  );
}
