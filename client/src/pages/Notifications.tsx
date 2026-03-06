import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  CheckSquare,
  Clock,
  FileText,
  CheckCheck,
  Trash2,
  Loader2,
  Settings,
  X,
  Volume2,
  BellRing,
  Monitor,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  status: string;
  relatedTaskId: number | null;
  createdAt: string;
};

type NotificationPreferences = {
  soundEnabled: boolean;
  browserNotifications: boolean;
  popupOnLogin: boolean;
  taskAssigned: boolean;
  taskUpdated: boolean;
  taskReassigned: boolean;
  deadlineWarning: boolean;
  vatDeadline: boolean;
};

const defaultPrefs: NotificationPreferences = {
  soundEnabled: true,
  browserNotifications: false,
  popupOnLogin: true,
  taskAssigned: true,
  taskUpdated: true,
  taskReassigned: true,
  deadlineWarning: true,
  vatDeadline: true,
};

function getNotificationIcon(type: string) {
  switch (type) {
    case "task_assigned":
      return <UserCheck className="h-5 w-5 text-primary" />;
    case "task_update":
      return <RefreshCw className="h-5 w-5 text-indigo-500" />;
    case "deadline_warning":
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case "vat_deadline":
      return <FileText className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-primary" />;
  }
}

function getNotificationBadge(type: string) {
  switch (type) {
    case "task_assigned":
      return <Badge className="bg-primary/15 text-primary border-0 text-[10px]">Task</Badge>;
    case "task_update":
      return <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 text-[10px]">Update</Badge>;
    case "deadline_warning":
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0 text-[10px]">Deadline</Badge>;
    case "vat_deadline":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]">VAT</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0 text-[10px]">Info</Badge>;
  }
}

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPrefs);
  const [showSettings, setShowSettings] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    fetchData();
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [notifs, prefs] = await Promise.all([
        api.get("/api/notifications"),
        api.get("/api/notifications/preferences"),
      ]);
      setNotifications(notifs);
      setPreferences({ ...defaultPrefs, ...prefs });
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function requestBrowserPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === "granted") {
        updatePreference("browserNotifications", true);
        toast({ title: "Browser notifications enabled" });
      }
    }
  }

  async function markAsRead(id: number) {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: "read" } : n))
      );
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.post("/api/notifications/read-all", {});
      setNotifications(prev => prev.map(n => ({ ...n, status: "read" })));
      toast({ title: "All notifications marked as read" });
    } catch {}
  }

  async function deleteNotification(id: number) {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  }

  async function deleteAll() {
    try {
      await api.delete("/api/notifications");
      setNotifications([]);
      toast({ title: "All notifications deleted" });
    } catch {}
  }

  async function updatePreference(key: keyof NotificationPreferences, value: boolean) {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    setSavingPrefs(true);
    try {
      await api.patch("/api/notifications/preferences", updated);
    } catch {
      setPreferences(preferences);
    } finally {
      setSavingPrefs(false);
    }
  }

  const filtered = notifications.filter(n => {
    switch (activeTab) {
      case "unread":
        return n.status === "unread";
      case "tasks":
        return n.type === "task_assigned" || n.type === "task_update";
      case "deadlines":
        return n.type === "deadline_warning";
      case "vat":
        return n.type === "vat_deadline";
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => n.status === "unread").length;
  const taskCount = notifications.filter(n => n.type === "task_assigned" || n.type === "task_update").length;
  const deadlineCount = notifications.filter(n => n.type === "deadline_warning").length;
  const vatCount = notifications.filter(n => n.type === "vat_deadline").length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]" data-testid="notifications-loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-2" data-testid="text-notifications-title">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-sm px-2 py-0.5">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up!"}
              <Zap className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">Real-time updates active</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              data-testid="button-toggle-settings"
            >
              <Settings className="mr-1 h-4 w-4" />
              Settings
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} data-testid="button-mark-all-read">
                <CheckCheck className="mr-1 h-4 w-4" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="destructive" size="sm" onClick={deleteAll} data-testid="button-delete-all">
                <Trash2 className="mr-1 h-4 w-4" />
                Delete All
              </Button>
            )}
          </div>
        </div>

        {showSettings && (
          <Card data-testid="notification-settings">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">Customize how and when you receive alerts</p>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Delivery</h4>
                <div className="space-y-4 pl-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-sound" className="flex items-center gap-3">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <span>Sound Alerts</span>
                        <span className="text-xs text-muted-foreground font-normal">Play a sound when new notifications arrive</span>
                      </div>
                    </Label>
                    <Switch
                      id="pref-sound"
                      checked={preferences.soundEnabled}
                      onCheckedChange={(v) => updatePreference("soundEnabled", v)}
                      disabled={savingPrefs}
                      data-testid="switch-sound-enabled"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-browser" className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <span>Browser Notifications</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {browserPermission === "granted"
                            ? "Show desktop notifications even when the tab is not active"
                            : browserPermission === "denied"
                            ? "Browser notifications are blocked. Please enable them in your browser settings."
                            : "Get desktop notifications even when the tab is in the background"}
                        </span>
                      </div>
                    </Label>
                    {browserPermission !== "granted" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestBrowserPermission}
                        disabled={browserPermission === "denied"}
                        data-testid="button-enable-browser-notifs"
                      >
                        Enable
                      </Button>
                    ) : (
                      <Switch
                        id="pref-browser"
                        checked={preferences.browserNotifications}
                        onCheckedChange={(v) => updatePreference("browserNotifications", v)}
                        disabled={savingPrefs}
                        data-testid="switch-browser-notifications"
                      />
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-popup" className="flex items-center gap-3">
                      <BellRing className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <span>Login Popup</span>
                        <span className="text-xs text-muted-foreground font-normal">Show unread notifications popup when you log in</span>
                      </div>
                    </Label>
                    <Switch
                      id="pref-popup"
                      checked={preferences.popupOnLogin}
                      onCheckedChange={(v) => updatePreference("popupOnLogin", v)}
                      disabled={savingPrefs}
                      data-testid="switch-popup-on-login"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alert Types</h4>
                </div>
                <div className="space-y-4 pl-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-task-assigned" className="flex items-center gap-3">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <div className="flex flex-col gap-0.5">
                        <span>Task Assigned</span>
                        <span className="text-xs text-muted-foreground font-normal">When a new task is assigned to you</span>
                      </div>
                    </Label>
                    <Switch
                      id="pref-task-assigned"
                      checked={preferences.taskAssigned}
                      onCheckedChange={(v) => updatePreference("taskAssigned", v)}
                      disabled={savingPrefs}
                      data-testid="switch-task-assigned"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-task-updated" className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-indigo-500" />
                      <div className="flex flex-col gap-0.5">
                        <span>Task Status Changes</span>
                        <span className="text-xs text-muted-foreground font-normal">When a task status is updated</span>
                      </div>
                    </Label>
                    <Switch
                      id="pref-task-updated"
                      checked={preferences.taskUpdated}
                      onCheckedChange={(v) => updatePreference("taskUpdated", v)}
                      disabled={savingPrefs}
                      data-testid="switch-task-updated"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-task-reassigned" className="flex items-center gap-3">
                      <UserCheck className="h-4 w-4 text-purple-500" />
                      <div className="flex flex-col gap-0.5">
                        <span>Task Reassigned</span>
                        <span className="text-xs text-muted-foreground font-normal">When a task is reassigned to you</span>
                      </div>
                    </Label>
                    <Switch
                      id="pref-task-reassigned"
                      checked={preferences.taskReassigned}
                      onCheckedChange={(v) => updatePreference("taskReassigned", v)}
                      disabled={savingPrefs}
                      data-testid="switch-task-reassigned"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-deadline" className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div className="flex flex-col gap-0.5">
                        <span>Deadline Warnings</span>
                        <span className="text-xs text-muted-foreground font-normal">When task deadlines are approaching</span>
                      </div>
                    </Label>
                    <Switch
                      id="pref-deadline"
                      checked={preferences.deadlineWarning}
                      onCheckedChange={(v) => updatePreference("deadlineWarning", v)}
                      disabled={savingPrefs}
                      data-testid="switch-deadline-warning"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-vat" className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-red-500" />
                      <div className="flex flex-col gap-0.5">
                        <span>VAT Deadlines</span>
                        <span className="text-xs text-muted-foreground font-normal">When VAT filing deadlines are approaching</span>
                      </div>
                    </Label>
                    <Switch
                      id="pref-vat"
                      checked={preferences.vatDeadline}
                      onCheckedChange={(v) => updatePreference("vatDeadline", v)}
                      disabled={savingPrefs}
                      data-testid="switch-vat-deadline"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="notification-tabs">
            <TabsTrigger value="all" data-testid="tab-all">
              All
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" data-testid="tab-unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              Tasks
              {taskCount > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{taskCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="deadlines" data-testid="tab-deadlines">
              Deadlines
              {deadlineCount > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{deadlineCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="vat" data-testid="tab-vat">
              VAT
              {vatCount > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{vatCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground" data-testid="text-no-notifications">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map(n => (
                <Card
                  key={n.id}
                  className={`cursor-pointer transition-all duration-200 hover:bg-muted/30 hover:shadow-sm ${n.status === "unread" ? "border-primary/30 bg-primary/[0.03] shadow-sm" : ""}`}
                  onClick={() => n.status === "unread" && markAsRead(n.id)}
                  data-testid={`notification-card-${n.id}`}
                >
                  <CardContent className="py-4 flex items-start gap-4">
                    <div className="mt-0.5 shrink-0 p-2 rounded-full bg-muted/50">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" data-testid={`text-notification-title-${n.id}`}>{n.title}</span>
                        {getNotificationBadge(n.type)}
                        {n.status === "unread" && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" data-testid={`badge-unread-${n.id}`} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-notification-message-${n.id}`}>{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1" data-testid={`text-notification-time-${n.id}`}>
                        {n.createdAt && formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {n.status === "unread" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          title="Mark as read"
                          data-testid={`button-read-notification-${n.id}`}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        data-testid={`button-delete-notification-${n.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </DashboardLayout>
  );
}
