import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { useAuth, canAssignTasks } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Calendar, MessageSquare, GripVertical, Loader2, Trash2, Sparkles, Brain, ChevronDown, ChevronUp, ArrowRight, AlertCircle, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskData = {
  id: number;
  clientId: number;
  assignedTo: number;
  assignedBy: number;
  title: string;
  description: string | null;
  priority: "Normal" | "High" | "Emergency";
  status: "Not Started" | "In Process" | "Completed" | "Review" | "Done";
  dueDate: string | null;
  assignmentDate: string | null;
  comments: string | null;
  createdAt: string | null;
};

type ClientData = {
  id: number;
  companyName: string;
  country?: string;
};

type CountryFilter = "all" | "UK" | "UAE";

type UserData = {
  id: number;
  name: string;
};

export default function Tasks() {
  const { user } = useAuth();
  const [view, setView] = useState<"board" | "list">("board");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("all");
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newTask, setNewTask] = useState({
    clientId: "",
    assignedTo: "",
    title: "",
    description: "",
    priority: "Normal" as "Normal" | "High" | "Emergency",
    dueDate: "",
  });

  const { toast } = useToast();
  const canAddTasks = canAssignTasks(user?.role);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    summary: string;
    suggestions: Array<{
      taskId: number;
      recommendedPriority: string;
      reason: string;
      actionRequired: string;
    }>;
    insights: string[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  async function fetchAiSuggestions() {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await api.post("/api/ai/task-priorities", {});
      setAiResult(result);
      setAiPanelOpen(true);
    } catch (err: any) {
      setAiError(err.message || "Failed to get AI suggestions");
      toast({ title: "AI Error", description: err.message || "Failed to get AI suggestions", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      setDeleting(true);
      await api.delete(`/api/tasks/${deletingTask.id}`);
      toast({ title: "Task deleted", description: `"${deletingTask.title}" has been deleted.` });
      setTasks(prev => prev.filter(t => t.id !== deletingTask.id));
      setDeleteDialogOpen(false);
      setDeletingTask(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete task", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [tasksRes, clientsRes] = await Promise.all([
        api.get("/api/tasks"),
        api.get("/api/clients"),
      ]);
      setTasks(tasksRes);
      setClients(clientsRes);

      if (isAdmin) {
        try {
          const usersRes: UserData[] = await api.get("/api/users");
          const map: Record<number, string> = {};
          usersRes.forEach((u) => {
            map[u.id] = u.name;
          });
          setUsersMap(map);
        } catch {
          // 403 for non-admins, gracefully ignore
        }
      }
    } catch (err) {
      console.error("Failed to fetch tasks data:", err);
    } finally {
      setLoading(false);
    }
  }

  function getClientName(clientId: number): string {
    const client = clients.find((c) => c.id === clientId);
    return client?.companyName ?? "Unknown Client";
  }

  function getUserName(userId: number): string {
    if (usersMap[userId]) return usersMap[userId];
    if (user && user.id === userId) return user.name;
    return "User #" + userId;
  }

  function getUserInitials(userId: number): string {
    const name = getUserName(userId);
    if (name.startsWith("User #")) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  async function handleStatusChange(taskId: number, newStatus: string) {
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus as TaskData["status"] } : t
        )
      );
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  }

  async function handleCreateTask() {
    if (!newTask.title || !newTask.clientId || !newTask.assignedTo) return;
    setCreating(true);
    try {
      const created = await api.post("/api/tasks", {
        clientId: Number(newTask.clientId),
        assignedTo: Number(newTask.assignedTo),
        assignedBy: user!.id,
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
        assignmentDate: format(new Date(), "yyyy-MM-dd"),
        status: "Not Started",
      });
      setTasks((prev) => [...prev, created]);
      setNewTask({
        clientId: "",
        assignedTo: "",
        title: "",
        description: "",
        priority: "Normal",
        dueDate: "",
      });
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setCreating(false);
    }
  }

  // Determine which country buttons to show based on user permissions
  const allowedCountries = user?.allowedCountries ?? null;
  const allowedSet = allowedCountries ? new Set(allowedCountries.split(",").map(s => s.trim())) : null;
  const showUK = !allowedSet || allowedSet.has("UK");
  const showUAE = !allowedSet || allowedSet.has("UAE");
  const showFilterButtons = showUK && showUAE;

  // Filter tasks by country via clientId lookup
  const filteredClientIds = countryFilter === "all"
    ? null
    : new Set(clients.filter(c => c.country === countryFilter).map(c => c.id));

  const filteredTasks = filteredClientIds
    ? tasks.filter(t => filteredClientIds.has(t.clientId))
    : tasks;

  const columns: Record<string, TaskData[]> = {
    "Not Started": filteredTasks.filter((t) => t.status === "Not Started"),
    "In Process": filteredTasks.filter((t) => t.status === "In Process"),
    "Completed": filteredTasks.filter((t) => t.status === "Completed"),
    ...(isAdmin ? { "Review": filteredTasks.filter((t) => t.status === "Review") } : {}),
    ...(isAdmin ? { "Done": filteredTasks.filter((t) => t.status === "Done") } : {}),
  };

  const allUsers = Object.entries(usersMap).map(([id, name]) => ({
    id: Number(id),
    name,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]" data-testid="tasks-loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Task Management</h1>
            <p className="text-muted-foreground">Assign, track, and complete client deliverables.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={view === "board" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("board")}
                className="h-8 text-xs"
                data-testid="button-board-view"
              >
                Board
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="h-8 text-xs"
                data-testid="button-list-view"
              >
                List
              </Button>
            </div>
            {showFilterButtons && (
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1" data-testid="task-country-filter">
                {(["all", "UK", "UAE"] as CountryFilter[]).map((f) => (
                  <button
                    key={f}
                    data-testid={`filter-task-country-${f}`}
                    onClick={() => setCountryFilter(f)}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-colors",
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
            <Button
              variant="outline"
              onClick={fetchAiSuggestions}
              disabled={aiLoading}
              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
              data-testid="button-ai-suggestions"
            >
              {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              AI Prioritize
            </Button>
            {canAddTasks && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-task">
                    <Plus className="mr-2 h-4 w-4" /> New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Assign a new task to a team member.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task-title">Title</Label>
                      <Input
                        id="task-title"
                        data-testid="input-task-title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Task title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-description">Description</Label>
                      <Input
                        id="task-description"
                        data-testid="input-task-description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Task description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Client</Label>
                        <Select
                          value={newTask.clientId}
                          onValueChange={(val) => setNewTask({ ...newTask, clientId: val })}
                        >
                          <SelectTrigger data-testid="select-task-client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Assign To</Label>
                        <Select
                          value={newTask.assignedTo}
                          onValueChange={(val) => setNewTask({ ...newTask, assignedTo: val })}
                        >
                          <SelectTrigger data-testid="select-task-assignee">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {allUsers.length > 0 ? (
                              allUsers.map((u) => (
                                <SelectItem key={u.id} value={String(u.id)}>
                                  {u.name}
                                </SelectItem>
                              ))
                            ) : (
                              user && (
                                <SelectItem value={String(user.id)}>
                                  {user.name}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(val) =>
                            setNewTask({ ...newTask, priority: val as "Normal" | "High" | "Emergency" })
                          }
                        >
                          <SelectTrigger data-testid="select-task-priority">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="task-due-date">Due Date</Label>
                        <Input
                          id="task-due-date"
                          data-testid="input-task-due-date"
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateTask}
                      disabled={creating || !newTask.title || !newTask.clientId || !newTask.assignedTo}
                      data-testid="button-submit-task"
                    >
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {aiResult && (
          <div className="mb-4 shrink-0" data-testid="ai-suggestions-panel">
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
              <CardContent className="p-0">
                <button
                  className="w-full p-4 flex items-center justify-between text-left"
                  onClick={() => setAiPanelOpen(!aiPanelOpen)}
                  data-testid="button-toggle-ai-panel"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-purple-900">AI Prioritization Insights</h3>
                      <p className="text-xs text-purple-600">{aiResult.summary}</p>
                    </div>
                  </div>
                  {aiPanelOpen ? <ChevronUp className="h-4 w-4 text-purple-400" /> : <ChevronDown className="h-4 w-4 text-purple-400" />}
                </button>

                {aiPanelOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {aiResult.insights && aiResult.insights.length > 0 && (
                      <div className="bg-white/60 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold text-purple-800">Key Insights</span>
                        </div>
                        <ul className="space-y-1">
                          {aiResult.insights.map((insight, i) => (
                            <li key={i} className="text-xs text-purple-700 flex items-start gap-2">
                              <span className="text-purple-400 mt-0.5">-</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-purple-800 flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Task Recommendations
                        </span>
                        {aiResult.suggestions.map((s, i) => {
                          const task = tasks.find(t => t.id === s.taskId);
                          if (!task) return null;
                          const priorityChanged = task.priority !== s.recommendedPriority;
                          return (
                            <div key={i} className="bg-white/60 rounded-lg p-3 border border-purple-100 flex items-start gap-3" data-testid={`ai-suggestion-${s.taskId}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                                  {priorityChanged && (
                                    <div className="flex items-center gap-1">
                                      <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-muted">{task.priority}</Badge>
                                      <ArrowRight className="h-3 w-3 text-purple-400" />
                                      <Badge variant="outline" className={cn(
                                        "text-[10px] px-1.5 h-5",
                                        s.recommendedPriority === "Emergency" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                        s.recommendedPriority === "High" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                        "bg-secondary text-secondary-foreground"
                                      )}>{s.recommendedPriority}</Badge>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                                <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                  <ArrowRight className="h-3 w-3" /> {s.actionRequired}
                                </p>
                              </div>
                              {priorityChanged && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 text-xs h-7 border-purple-200 text-purple-700 hover:bg-purple-50"
                                  onClick={async () => {
                                    try {
                                      await api.patch(`/api/tasks/${s.taskId}`, { priority: s.recommendedPriority });
                                      setTasks(prev => prev.map(t => t.id === s.taskId ? { ...t, priority: s.recommendedPriority as TaskData["priority"] } : t));
                                      toast({ title: "Priority updated", description: `"${task.title}" set to ${s.recommendedPriority}` });
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    }
                                  }}
                                  data-testid={`button-apply-priority-${s.taskId}`}
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {view === "board" ? (
          <div className="flex h-full gap-6 overflow-x-auto pb-4">
            {(Object.keys(columns) as Array<keyof typeof columns>).map((status) => (
              <div key={status} className="flex flex-col min-w-[320px] max-w-[320px] h-full bg-secondary/20 rounded-xl border border-border/50">
                <div className="p-4 flex items-center justify-between border-b border-border/50 bg-secondary/30 rounded-t-xl">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    {status}
                    <Badge variant="secondary" className="bg-background/80 ml-2">
                      {columns[status].length}
                    </Badge>
                  </h3>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {columns[status].map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-pointer hover:shadow-md transition-all border-border/60 group"
                      data-testid={`card-task-${task.id}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-5 font-normal",
                              task.priority === "Emergency"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : task.priority === "High"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-secondary text-secondary-foreground"
                            )}
                            data-testid={`badge-priority-${task.id}`}
                          >
                            {task.priority}
                          </Badge>
                          <Select
                            value={task.status}
                            onValueChange={(val) => handleStatusChange(task.id, val)}
                          >
                            <SelectTrigger className="h-5 w-5 p-0 border-0 bg-transparent shadow-none opacity-0 group-hover:opacity-100 transition-opacity [&>svg]:h-3 [&>svg]:w-3">
                              <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Not Started">Not Started</SelectItem>
                              <SelectItem value="In Process">In Process</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              {isAdmin && <SelectItem value="Review">Review</SelectItem>}
                              {isAdmin && <SelectItem value="Done">Done</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm line-clamp-2 leading-tight" data-testid={`text-task-title-${task.id}`}>
                            {task.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 truncate" data-testid={`text-task-client-${task.id}`}>
                            {getClientName(task.clientId)}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed" data-testid={`text-task-desc-${task.id}`}>
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                {getUserInitials(task.assignedTo)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground" data-testid={`text-assigned-name-${task.id}`}>{getUserName(task.assignedTo)}</span>
                            {task.dueDate && (
                              <div
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  new Date(task.dueDate) < new Date()
                                    ? "text-destructive font-medium"
                                    : "text-muted-foreground"
                                )}
                              >
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.dueDate), "MMM d")}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {task.comments && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-task-comments-${task.id}`}>
                                <MessageSquare className="h-3 w-3" />
                                <span className="max-w-[80px] truncate">{task.comments}</span>
                              </div>
                            )}
                            {isSuperAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-auto text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); setDeletingTask(task); setDeleteDialogOpen(true); }}
                                data-testid={`button-delete-task-${task.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {canAddTasks && (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground text-sm border border-dashed border-border hover:bg-background"
                      onClick={() => setDialogOpen(true)}
                      data-testid={`button-add-task-${status}`}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Task
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-tasks-list">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Task</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Assigned To</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Priority</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Due Date</th>
                    {isSuperAdmin && <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 7 : 6} className="text-center text-muted-foreground py-10">
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-border/30 hover:bg-secondary/10 transition-colors group"
                        data-testid={`row-task-${task.id}`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-list-task-title-${task.id}`}>{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground" data-testid={`text-list-task-client-${task.id}`}>
                          {getClientName(task.clientId)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                {getUserInitials(task.assignedTo)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-foreground" data-testid={`text-list-assigned-name-${task.id}`}>{getUserName(task.assignedTo)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-5 font-normal",
                              task.priority === "Emergency"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : task.priority === "High"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-secondary text-secondary-foreground"
                            )}
                            data-testid={`badge-list-priority-${task.id}`}
                          >
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={task.status}
                            onValueChange={(val) => handleStatusChange(task.id, val)}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs border-border/50" data-testid={`select-list-status-${task.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Not Started">Not Started</SelectItem>
                              <SelectItem value="In Process">In Process</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              {isAdmin && <SelectItem value="Review">Review</SelectItem>}
                              {isAdmin && <SelectItem value="Done">Done</SelectItem>}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          {task.dueDate ? (
                            <div
                              className={cn(
                                "flex items-center gap-1 text-xs",
                                new Date(task.dueDate) < new Date()
                                  ? "text-destructive font-medium"
                                  : "text-muted-foreground"
                              )}
                              data-testid={`text-list-due-date-${task.id}`}
                            >
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { setDeletingTask(task); setDeleteDialogOpen(true); }}
                              data-testid={`button-list-delete-task-${task.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deletingTask?.title}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete-task">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={deleting} data-testid="button-confirm-delete-task">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
