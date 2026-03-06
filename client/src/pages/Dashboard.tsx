import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Users, AlertTriangle, CheckCircle, Clock, Calendar, ArrowUpRight, Loader2, ListTodo, FileCheck, ClipboardList, TrendingUp, BarChart3, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid,
  AreaChart, Area, Legend, RadialBarChart, RadialBar,
  Sector,
} from 'recharts';
import { format, differenceInDays, isPast } from "date-fns";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalClients: number;
  clientsByCountry: { UK: number; UAE: number };
  overdueVat: number;
  activeTasks: number;
  urgentTasks: number;
  tasksByStatus: { "Not Started": number; "In Process": number; "Completed": number };
  totalEmployees: number;
}

interface ChartData {
  priorityBreakdown: { name: string; value: number; fill: string }[];
  vatStatusBreakdown: { name: string; value: number; fill: string }[];
  deadlineTimeline: { week: string; due: number; completed: number }[];
  workloadByEmployee: { name: string; notStarted: number; inProcess: number; completed: number; total: number }[];
  statusTrend: { name: string; value: number; fill: string }[];
}

interface AuditLog {
  id: number;
  userId: number;
  actionType: string;
  description: string;
  timestamp: string;
}

interface Task {
  id: number;
  clientId: number;
  assignedTo: number;
  assignedBy: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  assignmentDate: string;
  comments: string;
  createdAt: string;
}

interface Client {
  id: number;
  companyName: string;
  country: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-xl px-4 py-3 text-sm" data-testid="chart-tooltip">
      {label && <p className="font-semibold text-foreground mb-1.5">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground ml-auto">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-sm font-bold">{payload.name}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground text-xs">{value} ({(percent * 100).toFixed(0)}%)</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12} fill={fill} opacity={0.3} />
    </g>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  useEffect(() => {
    async function fetchData() {
      try {
        const fetches: Promise<any>[] = [
          api.get("/api/dashboard/stats"),
          api.get("/api/dashboard/charts"),
          api.get("/api/tasks"),
          api.get("/api/clients"),
        ];

        if (!isAdmin) {
          fetches.push(api.get("/api/notifications"));
        }

        const results = await Promise.all(fetches);
        setStats(results[0]);
        setChartData(results[1]);
        setTasks(results[2]);
        setClients(results[3]);
        if (!isAdmin && results[4]) {
          setNotifications(results[4]);
        }

        if (isAdmin) {
          try {
            const [logsData, usersData] = await Promise.all([
              api.get("/api/audit-logs"),
              api.get("/api/users"),
            ]);
            setAuditLogs(logsData);
            setUsers(usersData);
          } catch {}
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.role]);

  const getClientName = (clientId: number): string => {
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || `Client #${clientId}`;
  };

  const getUserName = (userId: number): string => {
    const u = users.find(u => u.id === userId);
    return u?.name || `User #${userId}`;
  };

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const roleName = user?.role === "super_admin"
    ? "Super Admin"
    : user?.role === "admin"
    ? "Admin"
    : "Employee";

  if (!isAdmin) {
    return <EmployeeDashboard
      stats={stats}
      chartData={chartData}
      tasks={tasks}
      clients={clients}
      notifications={notifications}
      getClientName={getClientName}
      setLocation={setLocation}
      userName={user?.name || ""}
    />;
  }

  const upcomingDeadlineCount = tasks.filter(t => {
    if (t.status === "Completed" || !t.dueDate) return false;
    const days = differenceInDays(new Date(t.dueDate), new Date());
    return days >= 0 && days <= 7;
  }).length;

  const clientsByCountry = [
    { name: 'UK', value: stats.clientsByCountry.UK || 0, color: '#6366f1' },
    { name: 'UAE', value: stats.clientsByCountry.UAE || 0, color: '#06b6d4' },
  ];

  const urgentTasksList = tasks
    .filter(t => t.priority === "Emergency" || t.priority === "High")
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground" data-testid="text-dashboard-title">{roleName} Dashboard</h1>
        <p className="text-muted-foreground">Overview of firm performance and compliance status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          className="bg-gradient-to-br from-white to-secondary/20"
          onClick={() => setLocation("/clients")}
        />
        <KPICard
          title="Overdue Compliance"
          value={stats.overdueVat}
          icon={AlertTriangle}
          description="VAT & CT Returns Pending"
          className="border-l-4 border-l-destructive"
          onClick={() => setLocation("/compliance")}
        />
        <KPICard
          title="Active Tasks"
          value={stats.activeTasks}
          icon={CheckCircle}
          description={`${stats.urgentTasks} High Priority`}
          onClick={() => setLocation("/tasks")}
        />
        <KPICard
          title="Upcoming Deadlines"
          value={upcomingDeadlineCount}
          icon={Calendar}
          description="Due in next 7 days"
          onClick={() => setLocation("/tasks")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4 shadow-sm border-border/60" data-testid="chart-task-status">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current workload across all employees</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.statusTrend || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36} animationDuration={1200} animationEasing="ease-out">
                    {(chartData?.statusTrend || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer hover:opacity-80 transition-opacity" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <InteractivePieCard
          title="Clients by Region"
          description="Portfolio distribution (UK vs UAE)"
          data={clientsByCountry}
          centerLabel={`${stats.totalClients}`}
          centerSubLabel="Total"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4 shadow-sm border-border/60" data-testid="chart-deadline-timeline">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Deadline Timeline</CardTitle>
                <CardDescription>Task deadlines over the next 8 weeks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData?.deadlineTimeline || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="due" name="Pending" stroke="#f97316" fill="url(#gradDue)" strokeWidth={2} dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }} activeDot={{ r: 6, stroke: "#f97316", strokeWidth: 2, fill: "white" }} animationDuration={1500} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" fill="url(#gradCompleted)" strokeWidth={2} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2, fill: "white" }} animationDuration={1500} animationBegin={300} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <InteractivePieCard
          title="Task Priority"
          description="Distribution by urgency level"
          data={(chartData?.priorityBreakdown || []).filter(d => d.value > 0)}
          centerLabel={`${stats.activeTasks + (stats.tasksByStatus?.["Completed"] || 0)}`}
          centerSubLabel="Tasks"
          icon={<Target className="h-5 w-5 text-primary" />}
        />
      </div>

      {chartData?.workloadByEmployee && chartData.workloadByEmployee.length > 0 && (
        <div className="mt-6">
          <Card className="shadow-sm border-border/60" data-testid="chart-workload-employee">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Workload by Employee</CardTitle>
                  <CardDescription>Task distribution across team members</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.workloadByEmployee} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="notStarted" name="Not Started" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} animationDuration={1000} />
                    <Bar dataKey="inProcess" name="In Process" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} animationDuration={1000} animationBegin={200} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} animationDuration={1000} animationBegin={400} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartData?.vatStatusBreakdown && chartData.vatStatusBreakdown.some(d => d.value > 0) && (
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Card className="shadow-sm border-border/60" data-testid="chart-vat-status">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>VAT Compliance Status</CardTitle>
                  <CardDescription>Filing status across all clients</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.vatStatusBreakdown.filter(d => d.value > 0)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="value" name="Records" radius={[6, 6, 0, 0]} barSize={50} animationDuration={1200}>
                      {chartData.vatStatusBreakdown.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer hover:opacity-80 transition-opacity" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Urgent Tasks</CardTitle>
                <CardDescription>High & Emergency priority items</CardDescription>
              </div>
              {user?.role === "super_admin" && (
                <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => setLocation("/tasks")} data-testid="button-view-urgent-tasks">View All <ArrowUpRight className="ml-1 size-3"/></Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urgentTasksList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No urgent tasks at the moment.</p>
                ) : (
                  urgentTasksList.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors bg-card cursor-pointer" data-testid={`urgent-task-${task.id}`} onClick={() => setLocation("/tasks")}>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold truncate max-w-[200px]">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{getClientName(task.clientId)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={task.priority} />
                        <span className="text-xs font-mono text-muted-foreground">{format(new Date(task.dueDate), "MMM dd")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system actions</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setLocation("/activity")} data-testid="button-view-all-activity">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-4 pb-4 last:pb-0 last:border-0 border-b border-border/50" data-testid={`activity-log-${log.id}`}>
                  <div className="mt-1 size-2 rounded-full bg-primary/40 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{log.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), "MMM d, h:mm a")} &bull; {getUserName(log.userId)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function InteractivePieCard({
  title,
  description,
  data,
  centerLabel,
  centerSubLabel,
  icon,
}: {
  title: string;
  description: string;
  data: { name: string; value: number; color?: string; fill?: string }[];
  centerLabel: string;
  centerSubLabel: string;
  icon?: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const chartData = data.map(d => ({ ...d, fill: d.fill || d.color }));

  return (
    <Card className="col-span-3 shadow-sm border-border/60" data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon || <BarChart3 className="h-5 w-5 text-primary" />}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer outline-none" />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {activeIndex === undefined && (
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold font-heading">{centerLabel}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{centerSubLabel}</span>
            </div>
          )}
        </div>
        <div className="flex justify-center gap-4 flex-wrap mt-2">
          {data.map((item, i) => (
            <div
              key={item.name}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-md transition-colors cursor-pointer",
                activeIndex === i ? "bg-muted" : "hover:bg-muted/50"
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill || item.color }} />
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">({item.value})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeDashboard({
  stats,
  chartData,
  tasks,
  clients,
  notifications,
  getClientName,
  setLocation,
  userName,
}: {
  stats: DashboardStats;
  chartData: ChartData | null;
  tasks: Task[];
  clients: Client[];
  notifications: Notification[];
  getClientName: (id: number) => string;
  setLocation: (to: string) => void;
  userName: string;
}) {
  const [activePriorityIndex, setActivePriorityIndex] = useState<number | undefined>(undefined);

  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingDeadlines = tasks
    .filter(t => t.status !== "Completed" && t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overdueTasks = upcomingDeadlines.filter(t => isPast(new Date(t.dueDate)));
  const dueSoonTasks = upcomingDeadlines.filter(t => {
    const days = differenceInDays(new Date(t.dueDate), new Date());
    return days >= 0 && days <= 7;
  });

  const unreadNotifications = notifications.filter(n => n.status === "unread");

  const radialData = [
    { name: "Progress", value: completionRate, fill: completionRate >= 75 ? "#22c55e" : completionRate >= 50 ? "#3b82f6" : completionRate >= 25 ? "#f59e0b" : "#ef4444" },
  ];

  const priorityData = (chartData?.priorityBreakdown || []).filter(d => d.value > 0);

  return (
    <DashboardLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground" data-testid="text-dashboard-title">
          Welcome back, {userName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">Here's your workload summary and upcoming deadlines.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="My Active Tasks"
          value={stats.activeTasks}
          icon={ListTodo}
          description={`${stats.urgentTasks} urgent`}
          className="bg-gradient-to-br from-card to-primary/5"
          onClick={() => setLocation("/tasks")}
        />
        <KPICard
          title="Overdue"
          value={overdueTasks.length}
          icon={AlertTriangle}
          description="Need immediate attention"
          className={cn("border-l-4", overdueTasks.length > 0 ? "border-l-destructive" : "border-l-green-500")}
          onClick={() => setLocation("/tasks")}
        />
        <KPICard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={FileCheck}
          description={`${completedTasks} of ${totalTasks} tasks done`}
          onClick={() => setLocation("/tasks")}
        />
        <KPICard
          title="Assigned Clients"
          value={stats.totalClients}
          icon={ClipboardList}
          description="Clients in your workload"
          onClick={() => setLocation("/clients")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4 shadow-sm border-border/60" data-testid="chart-completion-gauge">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Task Completion Progress</CardTitle>
                <CardDescription>Your overall completion rate</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    background={{ fill: 'hsl(var(--muted))' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none" style={{ marginTop: '-20px' }}>
                <span className="text-4xl font-bold font-heading" style={{ color: radialData[0].fill }}>{completionRate}%</span>
                <span className="text-sm text-muted-foreground mt-1">{completedTasks} of {totalTasks} tasks</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mt-2">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-slate-500">{stats.tasksByStatus["Not Started"] || 0}</p>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">{stats.tasksByStatus["In Process"] || 0}</p>
                <p className="text-xs text-muted-foreground">In Process</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-border/60" data-testid="chart-priority-breakdown">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Priority Breakdown</CardTitle>
                <CardDescription>Your tasks by urgency</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData.length > 0 ? priorityData : [{ name: "No Tasks", value: 1, fill: "#e2e8f0" }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    activeIndex={activePriorityIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActivePriorityIndex(i)}
                    onMouseLeave={() => setActivePriorityIndex(undefined)}
                    animationDuration={1200}
                  >
                    {(priorityData.length > 0 ? priorityData : [{ name: "No Tasks", value: 1, fill: "#e2e8f0" }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="cursor-pointer outline-none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {activePriorityIndex === undefined && (
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-2xl font-bold font-heading">{totalTasks}</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-3 flex-wrap mt-2">
              {priorityData.map((item, i) => (
                <div
                  key={item.name}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer text-sm",
                    activePriorityIndex === i ? "bg-muted" : "hover:bg-muted/50"
                  )}
                  onMouseEnter={() => setActivePriorityIndex(i)}
                  onMouseLeave={() => setActivePriorityIndex(undefined)}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData?.deadlineTimeline && (
        <div className="mt-6">
          <Card className="shadow-sm border-border/60" data-testid="chart-deadline-timeline-emp">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>My Deadline Timeline</CardTitle>
                  <CardDescription>Upcoming deadlines over the next 8 weeks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.deadlineTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="empGradDue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="empGradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="due" name="Pending" stroke="#f97316" fill="url(#empGradDue)" strokeWidth={2} dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }} activeDot={{ r: 6, stroke: "#f97316", strokeWidth: 2, fill: "white" }} animationDuration={1500} />
                    <Area type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" fill="url(#empGradCompleted)" strokeWidth={2} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2, fill: "white" }} animationDuration={1500} animationBegin={300} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>All tasks assigned to you</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => setLocation("/tasks")} data-testid="button-view-tasks">
              View All <ArrowUpRight className="ml-1 size-3"/>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tasks assigned yet.</p>
              ) : (
                tasks
                  .sort((a, b) => {
                    const priorityOrder: Record<string, number> = { Emergency: 0, High: 1, Normal: 2, Low: 3 };
                    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
                  })
                  .slice(0, 8)
                  .map((task) => {
                    const daysUntilDue = differenceInDays(new Date(task.dueDate), new Date());
                    const isOverdue = isPast(new Date(task.dueDate)) && task.status !== "Completed";
                    return (
                      <div key={task.id} className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors bg-card cursor-pointer",
                        isOverdue ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10" : "border-border/50 hover:bg-secondary/30"
                      )} data-testid={`my-task-${task.id}`} onClick={() => setLocation("/tasks")}>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="text-sm font-semibold truncate">{task.title}</span>
                          <span className="text-xs text-muted-foreground">{getClientName(task.clientId)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <StatusBadge status={task.status} />
                          <StatusBadge status={task.priority} />
                          <span className={cn(
                            "text-xs font-mono",
                            isOverdue ? "text-destructive font-bold" : daysUntilDue <= 3 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {isOverdue ? "OVERDUE" : `${format(new Date(task.dueDate), "MMM dd")}`}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks due soon</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueSoonTasks.length === 0 && overdueTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming deadlines.</p>
              ) : (
                <>
                  {overdueTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors" data-testid={`deadline-task-${task.id}`} onClick={() => setLocation("/tasks")}>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-sm font-semibold truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{getClientName(task.clientId)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                          OVERDUE {Math.abs(differenceInDays(new Date(task.dueDate), new Date()))}d
                        </span>
                      </div>
                    </div>
                  ))}
                  {dueSoonTasks.map((task) => {
                    const daysLeft = differenceInDays(new Date(task.dueDate), new Date());
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors" data-testid={`deadline-task-${task.id}`} onClick={() => setLocation("/tasks")}>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="text-sm font-semibold truncate">{task.title}</span>
                          <span className="text-xs text-muted-foreground">{getClientName(task.clientId)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded",
                            daysLeft <= 1 ? "text-destructive bg-destructive/10" : "text-amber-700 bg-amber-100"
                          )}>
                            {daysLeft === 0 ? "DUE TODAY" : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </CardContent>

          {unreadNotifications.length > 0 && (
            <>
              <CardHeader className="pt-2 pb-2 border-t">
                <CardTitle className="text-base">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unreadNotifications.slice(0, 3).map((n) => (
                    <div key={n.id} className="flex items-start gap-3 pb-3 last:pb-0 last:border-0 border-b border-border/40">
                      <div className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
