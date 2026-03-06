import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Redirect } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuditLog = {
  id: number;
  userId: number;
  actionType: string;
  description: string;
  timestamp: string;
};

type UserData = {
  id: number;
  name: string;
};

const PAGE_SIZE = 20;

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UPDATE: "bg-orange-100 text-orange-700 border-orange-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
  LOGIN: "bg-purple-100 text-purple-700 border-purple-200",
  EXPORT: "bg-amber-100 text-amber-700 border-amber-200",
};

function formatDateHeading(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

export default function ActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [page, setPage] = useState(1);

  if (user?.role !== "super_admin") {
    return <Redirect to="/" />;
  }

  useEffect(() => {
    Promise.all([
      api.get("/api/audit-logs"),
      api.get("/api/users"),
    ])
      .then(([logsData, usersData]) => {
        setLogs(logsData);
        const map: Record<number, string> = {};
        usersData.forEach((u: UserData) => { map[u.id] = u.name; });
        setUsersMap(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const getUserName = (userId: number) => usersMap[userId] || "Unknown";

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !search ||
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        getUserName(log.userId).toLowerCase().includes(search.toLowerCase());
      const matchesAction = filterAction === "all" || log.actionType === filterAction;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, filterAction, usersMap]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    paginatedLogs.forEach((log) => {
      const dateKey = format(new Date(log.timestamp), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  }, [paginatedLogs]);

  const actionTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.actionType));
    return Array.from(types).sort();
  }, [logs]);

  useEffect(() => { setPage(1); }, [search, filterAction]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading" data-testid="text-activity-title">Activity Log</h1>
          <p className="text-muted-foreground">Complete history of all system actions.</p>
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">All Activity</CardTitle>
                <CardDescription>{filteredLogs.length} total entries</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activity..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 w-[200px]"
                    data-testid="input-search-activity"
                  />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="h-9 w-[140px]" data-testid="select-filter-action">
                    <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedByDate).length === 0 ? (
              <div className="text-center text-muted-foreground py-10" data-testid="text-no-activity">
                No activity found.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([dateKey, dateLogs]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-foreground" data-testid={`text-date-heading-${dateKey}`}>
                        {formatDateHeading(dateKey)}
                      </h3>
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-xs text-muted-foreground">{dateLogs.length} actions</span>
                    </div>
                    <div className="space-y-1">
                      {dateLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                          data-testid={`row-activity-${log.id}`}
                        >
                          <div className="mt-1 size-2 rounded-full bg-primary/40 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight" data-testid={`text-activity-desc-${log.id}`}>
                              {log.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.timestamp), "h:mm a")} • {getUserName(log.userId)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 h-5 font-normal shrink-0", actionColors[log.actionType] || "bg-secondary")}
                            data-testid={`badge-action-${log.id}`}
                          >
                            {log.actionType}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
