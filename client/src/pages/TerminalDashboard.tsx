import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  Activity,
  Briefcase,
  Clock,
  FileText,
  Folder,
  Home,
  Search,
  Users,
} from "lucide-react";
import type { Client, Task, AuditLog, User } from "@shared/schema";

interface DashboardStats {
  totalClients: number;
  activeTasks: number;
  urgentTasks: number;
  overdueVat: number;
  doneTasks: number;
  totalEmployees: number;
}

const StatusDot = ({ status }: { status: string }) => {
  let color = "bg-gray-400";
  if (["good", "Active", "OK", "Low", "Done", "Completed"].includes(status)) color = "bg-emerald-500";
  if (["warning", "At Risk", "Med", "In Process", "Review", "In Progress"].includes(status)) color = "bg-amber-500";
  if (["critical", "Inactive", "ERR", "High", "Blocked", "Overdue", "Emergency"].includes(status)) color = "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${color}`} />;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const cls =
    priority === "Emergency"
      ? "bg-red-100 text-red-700"
      : priority === "High"
      ? "bg-amber-100 text-amber-700"
      : priority === "Normal"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-700";
  const label = priority === "Emergency" ? "CRITICAL" : priority === "Normal" ? "MED" : priority.toUpperCase();
  return (
    <span className={`px-1 py-[2px] rounded text-[9px] uppercase font-mono ${cls}`}>
      {label}
    </span>
  );
};

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

function formatDueDate(dateStr: string | null | undefined): { label: string; overdue: boolean } {
  if (!dateStr) return { label: "—", overdue: false };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { label: dateStr, overdue: false };
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDay = Math.ceil(diffMs / 86400000);
  if (diffDay < 0) return { label: "Overdue", overdue: true };
  if (diffDay === 0) return { label: "Today", overdue: false };
  if (diffDay === 1) return { label: "Tomorrow", overdue: false };
  if (diffDay <= 7) return { label: `In ${diffDay}d`, overdue: false };
  return { label: `In ${Math.ceil(diffDay / 7)}w`, overdue: false };
}

function formatLogTime(ts: string): string {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return "—";
  return date.toTimeString().slice(0, 8);
}

export default function TerminalDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => apiFetch("/api/dashboard/stats"),
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiFetch("/api/clients"),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: () => apiFetch("/api/tasks"),
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    queryFn: () => apiFetch("/api/audit-logs"),
    enabled: user?.role === "super_admin" || user?.role === "admin",
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: () => apiFetch("/api/users"),
    enabled: user?.role === "super_admin" || user?.role === "admin",
  });

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.companyName]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const activeTasks = tasks
    .filter((t) => t.status !== "Completed" && t.status !== "Done")
    .slice(0, 20);

  const recentLogs = [...auditLogs]
    .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())
    .slice(0, 20);

  const employees = users.filter((u) => u.role === "employee");
  const admins = users.filter((u) => u.role === "admin");

  const activeClientCount = clients.filter((c) => c.status === "Active").length;
  const totalTaskCount = tasks.length;
  const overdueTaskCount = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date() && t.status !== "Completed" && t.status !== "Done";
  }).length;

  const kpis = [
    { label: "TOTAL_CLIENTS", value: clientsLoading ? "…" : String(clients.length), status: "good", path: "/clients" },
    { label: "ACTIVE_CLIENTS", value: clientsLoading ? "…" : String(activeClientCount), status: "good", path: "/clients" },
    { label: "TOTAL_TASKS", value: tasksLoading ? "…" : String(totalTaskCount), status: "warning", path: "/tasks" },
    { label: "OVERDUE", value: tasksLoading ? "…" : String(overdueTaskCount), status: overdueTaskCount > 0 ? "critical" : "good", path: "/tasks" },
    { label: "COMPLETED", value: statsLoading ? "…" : String(stats?.doneTasks ?? 0), status: "good", path: "/tasks" },
    { label: "EMPLOYEES", value: statsLoading ? "…" : String(stats?.totalEmployees ?? 0), status: "good", path: "/hr" },
  ];

  const navItems = [
    { icon: Home, label: "DASHBOARD", path: "/", active: false },
    { icon: Home, label: "TERMINAL", path: "/terminal", active: true },
    { icon: Users, label: "CLIENT_DB", path: "/clients", active: false },
    { icon: FileText, label: "COMPLIANCE", path: "/compliance", active: false },
    { icon: Clock, label: "TIME_TRACK", path: "/tasks", active: false },
    { icon: Folder, label: "DOCUMENTS", path: "/activity", active: false },
    { icon: Activity, label: "REPORTS", path: "/activity", active: false },
    { icon: Briefcase, label: "HR_SYSTEM", path: "/hr", active: false },
  ];

  const canSeeAdminData = user?.role === "super_admin" || user?.role === "admin";

  return (
    <div className="flex h-screen w-full bg-white text-[#111] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-[200px] flex-shrink-0 bg-gray-900 text-gray-300 border-r border-gray-800 flex flex-col">
        <div className="p-2 border-b border-gray-800 flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-sm flex-shrink-0" />
          <span className="text-xs font-mono font-bold text-white tracking-widest truncate">
            ERP_SYS_V2
          </span>
        </div>

        <div className="p-2 border-b border-gray-800">
          <div className="flex items-center gap-2 bg-gray-800 text-gray-400 p-1 text-xs font-mono">
            <Search className="w-3 h-3 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-gray-500 truncate">
              CMD+K TO SEARCH
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-[1px]">
            {navItems.map((item) => (
              <li key={item.label}>
                <button
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center gap-2 px-2 py-1 text-xs font-mono text-left ${
                    item.active
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-3 h-3 flex-shrink-0" />
                  <span className="tracking-wider text-[10px]">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 border-t border-gray-800 text-[10px] font-mono text-gray-500">
          {user && (
            <div className="mb-1 text-gray-400 truncate">
              {user.name.toUpperCase().replace(" ", "_")}
            </div>
          )}
          <div>SYS_STATUS: ONLINE</div>
          <div className="flex items-center gap-1 mt-1">
            <StatusDot status="good" />
            <span>ALL SYSTEMS GO</span>
          </div>
          <button
            data-testid="button-logout"
            onClick={logout}
            className="mt-2 text-[10px] text-gray-600 hover:text-gray-300 tracking-wider"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* KPI Strip */}
        <div className="h-[60px] flex-shrink-0 border-b border-gray-200 flex items-center px-4 overflow-x-auto bg-gray-50">
          <div className="flex items-center gap-8">
            {kpis.map((kpi, i) => (
              <button
                key={i}
                data-testid={`kpi-${kpi.label.toLowerCase()}`}
                onClick={() => setLocation(kpi.path)}
                className="flex flex-col flex-shrink-0 text-left hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  {kpi.label}
                </span>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-sm font-semibold">{kpi.value}</span>
                  <StatusDot status={kpi.status} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2×2 Grid */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 bg-gray-200 gap-[1px] min-h-0">

          {/* Top Left: Client Roster */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div
              className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setLocation("/clients")}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">
                CLIENT_ROSTER
              </span>
              <span className="text-[10px] font-mono text-gray-400 mr-1">
                T_RECS: {clientsLoading ? "…" : clients.length}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {clientsLoading ? (
                <div className="p-4 text-[10px] font-mono text-gray-400">LOADING…</div>
              ) : (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_#e5e7eb]">
                    <tr className="text-[10px] uppercase tracking-widest text-gray-500">
                      <th className="py-1 px-2 font-normal">ID</th>
                      <th className="py-1 px-2 font-normal">NAME</th>
                      <th className="py-1 px-2 font-normal">COUNTRY</th>
                      <th className="py-1 px-2 font-normal">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {clients.map((c) => (
                      <tr
                        key={c.id}
                        data-testid={`row-client-${c.id}`}
                        className="border-b border-gray-100 hover:bg-gray-50 h-7 cursor-pointer"
                        onClick={() => setLocation("/clients")}
                      >
                        <td className="py-0 px-2 text-gray-500">
                          CL-{String(c.id).padStart(4, "0")}
                        </td>
                        <td className="py-0 px-2 font-sans truncate max-w-[140px]">
                          {c.companyName}
                        </td>
                        <td className="py-0 px-2 font-sans text-gray-600">{c.country}</td>
                        <td className="py-0 px-2">
                          <div className="flex items-center gap-1">
                            <StatusDot status={c.status} />
                            <span className="text-[10px]">{c.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Top Right: Active Tasks */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div
              className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setLocation("/tasks")}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">
                ACTIVE_TASKS
              </span>
              <span className="text-[10px] font-mono text-gray-400 mr-1">
                T_RECS: {tasksLoading ? "…" : activeTasks.length}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {tasksLoading ? (
                <div className="p-4 text-[10px] font-mono text-gray-400">LOADING…</div>
              ) : (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_#e5e7eb]">
                    <tr className="text-[10px] uppercase tracking-widest text-gray-500">
                      <th className="py-1 px-2 font-normal">ID</th>
                      <th className="py-1 px-2 font-normal">TITLE</th>
                      <th className="py-1 px-2 font-normal">CLIENT</th>
                      <th className="py-1 px-2 font-normal">PRIORITY</th>
                      <th className="py-1 px-2 font-normal">DUE</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {activeTasks.map((t) => {
                      const due = formatDueDate(t.dueDate);
                      return (
                        <tr
                          key={t.id}
                          data-testid={`row-task-${t.id}`}
                          className="border-b border-gray-100 hover:bg-gray-50 h-7 cursor-pointer"
                          onClick={() => setLocation("/tasks")}
                        >
                          <td className="py-0 px-2 text-gray-500">
                            TSK-{String(t.id).padStart(4, "0")}
                          </td>
                          <td className="py-0 px-2 font-sans truncate max-w-[150px]">
                            {t.title}
                          </td>
                          <td className="py-0 px-2 font-sans text-gray-600 truncate max-w-[100px]">
                            {clientMap[t.clientId] ?? `CL-${t.clientId}`}
                          </td>
                          <td className="py-0 px-2">
                            <PriorityBadge priority={t.priority} />
                          </td>
                          <td
                            className={`py-0 px-2 ${
                              due.overdue ? "text-red-600 font-bold" : "text-gray-500"
                            }`}
                          >
                            {due.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Bottom Left: Workforce Metrics */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div
              className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setLocation("/hr")}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">
                WORKFORCE_METRICS
              </span>
              <span className="text-[10px] font-mono text-gray-400 mr-1">
                USERS: {users.length}
              </span>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div
                  className="border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setLocation("/hr")}
                >
                  <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                    ROLE: EMPLOYEE
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">HEADCOUNT</span>
                    <span>{employees.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">OPEN_TASKS</span>
                    <span>
                      {tasks.filter(
                        (t) =>
                          employees.some((e) => e.id === t.assignedTo) &&
                          t.status !== "Completed" &&
                          t.status !== "Done"
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">COMPLETED</span>
                    <span className="text-emerald-600">
                      {tasks.filter(
                        (t) =>
                          employees.some((e) => e.id === t.assignedTo) &&
                          (t.status === "Completed" || t.status === "Done")
                      ).length}
                    </span>
                  </div>
                </div>

                <div
                  className="border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setLocation("/hr")}
                >
                  <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                    ROLE: ADMIN
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">HEADCOUNT</span>
                    <span>{admins.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">OPEN_TASKS</span>
                    <span>
                      {tasks.filter(
                        (t) =>
                          admins.some((a) => a.id === t.assignedTo) &&
                          t.status !== "Completed" &&
                          t.status !== "Done"
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">COMPLETED</span>
                    <span className="text-emerald-600">
                      {tasks.filter(
                        (t) =>
                          admins.some((a) => a.id === t.assignedTo) &&
                          (t.status === "Completed" || t.status === "Done")
                      ).length}
                    </span>
                  </div>
                </div>

                <div
                  className="border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setLocation("/tasks")}
                >
                  <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                    TASK_STATUS
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">NOT_STARTED</span>
                    <span>{tasks.filter((t) => t.status === "Not Started").length}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">IN_PROCESS</span>
                    <span className="text-amber-600">
                      {tasks.filter((t) => t.status === "In Process").length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">REVIEW</span>
                    <span>{tasks.filter((t) => t.status === "Review").length}</span>
                  </div>
                </div>

                <div
                  className="border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setLocation("/clients")}
                >
                  <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                    SYSTEM_INFO
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">TOTAL_CLIENTS</span>
                    <span>{clients.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="text-gray-600">ACTIVE</span>
                    <span className="text-emerald-600">
                      {clients.filter((c) => c.status === "Active").length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">INACTIVE</span>
                    <span className="text-red-600">
                      {clients.filter((c) => c.status === "Inactive").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right: System Event Log */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div
              className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setLocation("/activity")}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">
                SYSTEM_EVENT_LOG
              </span>
              <span className="text-[10px] font-mono text-emerald-600 mr-1 tracking-wider">
                LIVE
              </span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50">
              {!canSeeAdminData ? (
                <div className="p-4 text-[10px] font-mono text-gray-400">
                  ACCESS_DENIED: ADMIN ROLE REQUIRED
                </div>
              ) : logsLoading ? (
                <div className="p-4 text-[10px] font-mono text-gray-400">LOADING…</div>
              ) : recentLogs.length === 0 ? (
                <div className="p-4 text-[10px] font-mono text-gray-400">NO_EVENTS</div>
              ) : (
                <table className="w-full text-left whitespace-nowrap">
                  <tbody className="font-mono">
                    {recentLogs.map((log) => {
                      const userName = userMap[log.userId] ?? `UID-${log.userId}`;
                      const userHandle = userName.split(" ").map((p) => p[0]).join("").toLowerCase();
                      return (
                        <tr
                          key={log.id}
                          data-testid={`row-log-${log.id}`}
                          className="border-b border-gray-200/50 hover:bg-gray-100 h-6 text-[10px] cursor-pointer"
                          onClick={() => setLocation("/activity")}
                        >
                          <td className="py-0 px-2 text-gray-400 w-16 flex-shrink-0">
                            {formatLogTime(String(log.timestamp))}
                          </td>
                          <td className="py-0 px-2 font-bold w-14 text-gray-700">{userHandle}</td>
                          <td className="py-0 px-2 text-blue-600 uppercase">{log.actionType}</td>
                          <td className="py-0 px-2 text-gray-600 truncate max-w-[200px]">
                            {log.description}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
