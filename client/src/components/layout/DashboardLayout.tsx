import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import PageTransition from "./PageTransition";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  LogOut, 
  Search, 
  Bell,
  ShieldCheck,
  X,
  CheckCheck,
  Pencil,
  Eye,
  EyeOff,
  MessageCircle,
  Briefcase,
  Terminal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  status: string;
  relatedTaskId: number | null;
  createdAt: string;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [loginPopupShown, setLoginPopupShown] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const lastKnownMsgCountRef = useRef<number | null>(null);
  const lastKnownNotifCountRef = useRef<number | null>(null);
  const locationRef = useRef(location);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [showMsgPopup, setShowMsgPopup] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);

  const isActive = (path: string) => location === path;

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new AudioContext();
      const g = audioCtx.createGain();
      g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      const o1 = audioCtx.createOscillator();
      o1.type = "sine";
      o1.frequency.setValueAtTime(660, audioCtx.currentTime);
      o1.connect(g);
      o1.start(audioCtx.currentTime);
      o1.stop(audioCtx.currentTime + 0.2);
      const o2 = audioCtx.createOscillator();
      o2.type = "sine";
      o2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
      o2.connect(g);
      o2.start(audioCtx.currentTime + 0.2);
      o2.stop(audioCtx.currentTime + 0.5);
      setTimeout(() => audioCtx.close(), 1000);
    } catch {}
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico", tag: "alliance-erp" });
    }
  }, []);

  // Initial load of notifications
  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      try {
        const data = await api.get("/api/notifications");
        if (!mounted) return;
        setNotifications(data);
        const currentUnread = data.filter((n: Notification) => n.status === "unread").length;
        setUnreadCount(currentUnread);
        lastKnownNotifCountRef.current = currentUnread;
      } catch {}
    };
    loadNotifications();
    return () => { mounted = false; };
  }, []);

  // SSE real-time connection for notifications
  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    if (!token) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      eventSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_notification" && data.notification) {
            const notif = data.notification as Notification;
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((prev) => prev + 1);

            if (locationRef.current !== "/notifications") {
              toast({
                title: notif.title,
                description: notif.message,
              });
              playNotificationSound();
              showBrowserNotification(notif.title, notif.message);
            }
          }
        } catch {}
      };

      eventSource.onerror = () => {
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimer);
    };
  }, [playNotificationSound, showBrowserNotification]);

  useEffect(() => {
    let mounted = true;

    const checkNewMessages = async () => {
      try {
        const data = await api.get("/api/messages/unread/count");
        if (!mounted) return;
        const currentCount = data.count || 0;
        setUnreadMsgCount(currentCount);
        const prevCount = lastKnownMsgCountRef.current;
        if (prevCount !== null && currentCount > prevCount && locationRef.current !== "/chat") {
          const diff = currentCount - prevCount;
          setNewMsgCount(diff);
          setShowMsgPopup(true);
          try {
            const audioCtx = new AudioContext();
            const g = audioCtx.createGain();
            g.connect(audioCtx.destination);
            g.gain.setValueAtTime(0.3, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            const o1 = audioCtx.createOscillator();
            o1.type = "sine";
            o1.frequency.setValueAtTime(880, audioCtx.currentTime);
            o1.connect(g);
            o1.start(audioCtx.currentTime);
            o1.stop(audioCtx.currentTime + 0.15);
            const o2 = audioCtx.createOscillator();
            o2.type = "sine";
            o2.frequency.setValueAtTime(1175, audioCtx.currentTime + 0.15);
            o2.connect(g);
            o2.start(audioCtx.currentTime + 0.15);
            o2.stop(audioCtx.currentTime + 0.4);
            setTimeout(() => audioCtx.close(), 1000);
          } catch {}
        }
        lastKnownMsgCountRef.current = currentCount;
      } catch {}
    };

    checkNewMessages();
    const interval = setInterval(checkNewMessages, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !loginPopupShown && unreadCount > 0) {
      setShowNotifPopup(true);
      setLoginPopupShown(true);
    }
  }, [notifications, loginPopupShown, unreadCount]);

  // UK schedule + date-based reminders: runs once per calendar day per session
  useEffect(() => {
    if (!user) return;
    const todayKey = `uk_reminder_checked_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(todayKey)) return;
    sessionStorage.setItem(todayKey, "1");
    (async () => {
      try {
        // Weekly schedule reminders
        const data = await api.get("/api/uk-schedule/reminders");
        if (data.reminders && data.reminders.length > 0) {
          const byClient: Record<number, { clientName: string; tasks: string[] }> = {};
          for (const r of data.reminders) {
            if (!byClient[r.clientId]) byClient[r.clientId] = { clientName: r.clientName, tasks: [] };
            byClient[r.clientId].tasks.push(r.taskName);
          }
          for (const [, info] of Object.entries(byClient)) {
            await api.post("/api/notifications", {
              userId: user.id,
              title: `Reminder: ${info.clientName}`,
              message: `Tomorrow (${data.tomorrowDay}): ${info.tasks.join(", ")}`,
              type: "reminder",
            });
          }
        }

        // Date-based reminders (VAT Quarterly drafts, P&L Monthly/Quarterly)
        const dateData = await api.get("/api/date-reminders");
        if (dateData.reminders && dateData.reminders.length > 0) {
          const byClient: Record<number, { clientName: string; labels: string[] }> = {};
          for (const r of dateData.reminders) {
            if (!byClient[r.clientId]) byClient[r.clientId] = { clientName: r.clientName, labels: [] };
            byClient[r.clientId].labels.push(r.label);
          }
          for (const [, info] of Object.entries(byClient)) {
            await api.post("/api/notifications", {
              userId: user.id,
              title: `Reminder: ${info.clientName}`,
              message: `Due tomorrow (${dateData.tomorrowLabel}): ${info.labels.join(", ")}`,
              type: "reminder",
            });
          }
        }

        fetchNotifications();
      } catch {}
    })();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await api.get("/api/notifications");
      setNotifications(data);
      const unread = data.filter((n: Notification) => n.status === "unread");
      setUnreadCount(unread.length);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all", {});
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, status: "read" })));
    } catch {}
  };

  const openProfileEdit = () => {
    setProfileName(user?.name || "");
    setProfilePassword("");
    setProfileConfirmPassword("");
    setShowPassword(false);
    setShowProfileEdit(true);
  };

  const handleProfileSave = async () => {
    if (profilePassword && profilePassword !== profileConfirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (profilePassword && profilePassword.length < 4) {
      toast({ title: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    setProfileSaving(true);
    try {
      const body: any = {};
      if (profileName && profileName !== user?.name) body.name = profileName;
      if (profilePassword) body.password = profilePassword;
      if (Object.keys(body).length === 0) {
        setShowProfileEdit(false);
        return;
      }
      await api.patch(`/api/users/${user?.id}`, body);
      await refreshUser();
      toast({ title: "Profile updated successfully" });
      setShowProfileEdit(false);
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    } finally {
      setProfileSaving(false);
    }
  };

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/" },
    { title: "Terminal View", icon: Terminal, path: "/terminal" },
    { title: "Clients", icon: Users, path: "/clients" },
    ...(user?.role === "super_admin" || user?.role === "admin"
      ? [{ title: "Compliance (VAT/CT)", icon: FileText, path: "/compliance" }]
      : []),
    { title: "Tasks", icon: CheckSquare, path: "/tasks" },
    { title: "Messages", icon: MessageCircle, path: "/chat" },
    { title: "Notifications", icon: Bell, path: "/notifications" },
  ];

  if (user?.role === "super_admin") {
    menuItems.push({ title: "User Management", icon: ShieldCheck, path: "/users" });
  }

  if (user?.role === "super_admin") {
    menuItems.push({ title: "HR Management", icon: Briefcase, path: "/hr" });
  }

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "U";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
             <div className="flex items-center gap-2.5 font-heading font-bold text-base">
                <div className="size-8 rounded-md bg-primary flex items-center justify-center text-[10px] font-bold tracking-widest shrink-0 text-primary-foreground">
                  A
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden leading-tight">
                  <span className="text-sm font-semibold text-foreground">Alliance Street</span>
                  <span className="text-[10px] text-muted-foreground font-sans tracking-widest uppercase">Accounting</span>
                </div>
             </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/50">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item, index) => (
                    <SidebarMenuItem key={item.path} className="stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.path)}
                        tooltip={item.title}
                        className="sidebar-link-animated hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary/10 transition-all duration-200"
                        data-active={isActive(item.path)}
                      >
                        <Link href={item.path}>
                          <item.icon className="transition-transform duration-200 group-hover:scale-110" />
                          <span>{item.title}</span>
                          {item.path === "/chat" && unreadMsgCount > 0 && (
                            <span className="ml-auto size-5 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold" data-testid="badge-unread-messages">
                              {unreadMsgCount}
                            </span>
                          )}
                          {item.path === "/notifications" && unreadCount > 0 && (
                            <span className="ml-auto size-5 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold" data-testid="badge-unread-notifications">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 hover:bg-transparent w-full flex items-center gap-3 justify-start">
                    <Avatar className="size-8 border border-primary/30 shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden text-left">
                      <span className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</span>
                      <span className="truncate text-[10px] text-sidebar-foreground/50 capitalize tracking-wide">{user?.role?.replace("_", " ")}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" side="right">
                   <DropdownMenuLabel>My Account</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   {user?.role === "super_admin" && (
                     <DropdownMenuItem onClick={openProfileEdit} data-testid="button-edit-profile">
                       <Pencil className="mr-2 h-4 w-4" />
                       <span>Edit Profile</span>
                     </DropdownMenuItem>
                   )}
                   <DropdownMenuItem onClick={logout} data-testid="button-logout">
                     <LogOut className="mr-2 h-4 w-4" />
                     <span>Log out</span>
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        
        <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out">
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b border-border/60 px-6 backdrop-blur-xl bg-background/90">
            <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-primary transition-colors" />
            <div className="h-4 w-px bg-border/40" />
            
            <div className="flex-1 flex items-center gap-4">
              <div className="relative max-w-md w-full md:w-96 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input 
                  type="search" 
                  placeholder="Search clients, tasks, documents…" 
                  className="pl-9 bg-secondary/40 border-border/40 text-sm focus-visible:bg-secondary/60 focus-visible:border-primary/40 transition-all placeholder:text-muted-foreground/40"
                  data-testid="input-search"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors" data-testid="button-notifications">
                    <Bell className="size-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 size-4 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold">{unreadCount}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead} data-testid="button-mark-all-read">
                        <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className="flex-col items-start gap-1 p-3 cursor-pointer"
                          onClick={() => setLocation("/tasks")}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium text-sm">{n.title}</span>
                            {n.status === "unread" && <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-4">New</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{n.message}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-sm text-primary cursor-pointer"
                    onClick={() => setLocation("/notifications")}
                    data-testid="link-view-all-notifications"
                  >
                    View All Notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 space-y-8">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>

      <Dialog open={showNotifPopup} onOpenChange={setShowNotifPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Welcome Back, {user?.name}!
            </DialogTitle>
            <DialogDescription>
              You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-3">
              {notifications.filter(n => n.status === "unread").map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/30 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => { setShowNotifPopup(false); setLocation("/tasks"); }}
                  data-testid={`notification-item-${n.id}`}
                >
                  <p className="font-medium text-sm text-primary">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-[10px] text-primary/70 mt-1.5 font-medium">Click to view task →</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowNotifPopup(false)} data-testid="button-dismiss-popup">
              Dismiss
            </Button>
            <Button size="sm" onClick={() => { markAllRead(); setShowNotifPopup(false); }} data-testid="button-acknowledge-popup">
              <CheckCheck className="mr-1 h-4 w-4" /> Mark All Read
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMsgPopup} onOpenChange={setShowMsgPopup}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              New Message{newMsgCount > 1 ? "s" : ""}!
            </DialogTitle>
            <DialogDescription>
              You have {newMsgCount} new unread message{newMsgCount > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowMsgPopup(false)} data-testid="button-dismiss-msg-popup">
              Dismiss
            </Button>
            <Button size="sm" onClick={() => { setShowMsgPopup(false); setLocation("/chat"); }} data-testid="button-open-chat-popup">
              <MessageCircle className="mr-1 h-4 w-4" /> Open Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your name or password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
                data-testid="input-profile-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-password">New Password</Label>
              <div className="relative">
                <Input
                  id="profile-password"
                  type={showPassword ? "text" : "password"}
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  data-testid="input-profile-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {profilePassword && (
              <div className="space-y-2">
                <Label htmlFor="profile-confirm-password">Confirm Password</Label>
                <Input
                  id="profile-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={profileConfirmPassword}
                  onChange={(e) => setProfileConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  data-testid="input-profile-confirm-password"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowProfileEdit(false)} data-testid="button-profile-cancel">
                Cancel
              </Button>
              <Button onClick={handleProfileSave} disabled={profileSaving} data-testid="button-profile-save">
                {profileSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
