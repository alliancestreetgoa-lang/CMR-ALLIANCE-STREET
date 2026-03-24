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
import { Calendar as CalendarIcon, FileText, Loader2 } from "lucide-react";
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

export default function Compliance() {
  const [vatRecords, setVatRecords] = useState<VatRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("all");
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

  // Determine which country filter buttons to show based on user permissions
  const allowedCountries = user?.allowedCountries ?? null;
  const allowedSet = allowedCountries ? new Set(allowedCountries.split(",").map(s => s.trim())) : null;
  const showUK = !allowedSet || allowedSet.has("UK");
  const showUAE = !allowedSet || allowedSet.has("UAE");
  const showFilterButtons = showUK && showUAE;

  // Filtered clients & records based on selected country
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
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: "text-destructive" };
    if (days === 0) return { text: "Due Today", color: "text-destructive font-bold" };
    if (days <= 7) return { text: `${days} days left`, color: "text-warning" };
    return { text: `${days} days left`, color: "text-muted-foreground" };
  };

  const openVatReturns = filteredVatRecords.filter(
    (r) => r.status === "Not Started" || r.status === "In Progress"
  ).length;

  const dueWithin7Days = filteredVatRecords.filter((r) => {
    if (!r.vatDueDate || r.status === "Filed" || r.status === "Completed") return false;
    const days = differenceInDays(new Date(r.vatDueDate), new Date());
    return days >= 0 && days <= 7;
  }).length;

  const overdueCount = filteredVatRecords.filter((r) => {
    if (!r.vatDueDate) return false;
    return r.status === "Overdue" || (differenceInDays(new Date(r.vatDueDate), new Date()) < 0 && r.status !== "Filed" && r.status !== "Completed");
  }).length;

  const clientsWithTax = filteredClients.filter(
    (c) => c.corporateTaxDueDate || c.corporateTaxStartMonth || c.corporateTaxEndMonth
  );

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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground" data-testid="text-compliance-title">Compliance Tracker</h1>
            <p className="text-muted-foreground">Monitor VAT returns, Corporate Tax filings, and deadlines.</p>
          </div>

          {showFilterButtons && (
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 self-start" data-testid="country-filter-group">
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
                   <div className="text-2xl font-bold" data-testid="text-overdue-count">{overdueCount}</div>
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
                                 <StatusBadge
                                   status={record.status}
                                   className="px-3 py-1"
                                 />
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
      </div>
    </DashboardLayout>
  );
}
