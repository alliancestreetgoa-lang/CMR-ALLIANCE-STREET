import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { users, notifications, insertUserSchema, insertClientSchema, insertVatRecordSchema, insertTaskSchema } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";
import { db } from "./db";
import { z } from "zod";
import OpenAI from "openai";

const JWT_SECRET = process.env.JWT_SECRET || "alliance-street-erp-secret-key-2026";

// SSE clients map: userId -> Set of response objects
const sseClients = new Map<number, Set<Response>>();

export function notifyUser(userId: number, data: any) {
  const clients = sseClients.get(userId);
  if (clients) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((res) => {
      try { res.write(payload); } catch {}
    });
  }
}

export function notifyAllUsers(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((clients) => {
    clients.forEach((res) => {
      try { res.write(payload); } catch {}
    });
  });
}

// JWT payload type
interface JwtPayload {
  userId: number;
  role: string;
  email: string;
}

// Extend Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware: Authenticate JWT
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (queryToken) {
    token = queryToken;
  }
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Middleware: Require role
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

async function checkDeadlines(): Promise<number> {
  let count = 0;
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const allTasks = await storage.getTasks();
  for (const task of allTasks) {
    if (!task.dueDate || task.status === "Completed" || task.status === "Done") continue;
    const dueDate = new Date(task.dueDate);
    if (dueDate <= threeDaysFromNow && dueDate >= now) {
      const existing = await db.select().from(notifications)
        .where(and(
          eq(notifications.relatedTaskId, task.id),
          eq(notifications.type, "deadline_warning"),
          gte(notifications.createdAt, oneDayAgo)
        ));
      if (existing.length === 0) {
        const notif = await storage.createNotification({
          userId: task.assignedTo,
          title: "Deadline Approaching",
          message: `Task "${task.title}" is due on ${task.dueDate}`,
          type: "deadline_warning",
          relatedTaskId: task.id,
          status: "unread",
        });
        notifyUser(task.assignedTo, { type: "new_notification", notification: notif });
        count++;
      }
    }
  }

  const allVat = await storage.getVatRecords();
  const allUsers = await storage.getUsers();
  const adminUsers = allUsers.filter(u => u.role === "admin" || u.role === "super_admin");

  for (const vat of allVat) {
    if (!vat.vatDueDate || vat.status === "Filed" || vat.status === "Completed" || vat.isActive === "false") continue;
    const vatDue = new Date(vat.vatDueDate);
    if (vatDue <= sevenDaysFromNow && vatDue >= now) {
      const client = await storage.getClient(vat.clientId);
      for (const admin of adminUsers) {
        const notif = await storage.createNotification({
          userId: admin.id,
          title: "VAT Deadline Approaching",
          message: `VAT ${vat.vatQuarter} for ${client?.companyName || "Unknown"} is due on ${vat.vatDueDate}`,
          type: "vat_deadline",
          relatedTaskId: null,
          status: "unread",
        });
        notifyUser(admin.id, { type: "new_notification", notification: notif });
        count++;
      }
    }
  }

  return count;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/_health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // ===== AUTH ROUTES =====

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByName(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Log the login
      await storage.createAuditLog({
        userId: user.id,
        actionType: "LOGIN",
        description: `User ${user.name} logged in.`,
      });

      // Auto-mark daily attendance on login
      try {
        const today = new Date().toISOString().split("T")[0];
        const existingRecords = await storage.getAttendanceByDate(today);
        const alreadyMarked = existingRecords.find((r) => r.userId === user.id);
        if (!alreadyMarked) {
          const now = new Date();
          const dayOfWeek = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
          const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;
          const status = isFridayOrSaturday ? "Week Off" : "Present";
          const checkInTime = isFridayOrSaturday ? null : `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
          await storage.createAttendance({
            userId: user.id,
            date: today,
            status,
            checkIn: checkInTime,
            notes: isFridayOrSaturday ? "Auto-marked as Week Off" : "Auto-marked on login",
          });
        }
      } catch (attendanceErr) {
        console.error("Auto-attendance marking failed:", attendanceErr);
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== USER MANAGEMENT =====

  app.get("/api/users", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const sanitized = allUsers.map(({ password, ...u }) => u);
      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/users", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const { name, password, role, allowedCountries } = req.body;
      
      if (!name || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Admin can only create employees
      if (req.user!.role === "admin" && role !== "employee") {
        return res.status(403).json({ message: "Admins can only create employee accounts" });
      }

      // Check if username already exists
      const existing = await storage.getUserByName(name);
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@alliancestreet.ae`;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        allowedCountries: allowedCountries || null,
      });

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "CREATE",
        description: `Created user ${name} with role ${role}.`,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/users/:id", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, email, role, password, allowedCountries } = req.body;

      if (req.user!.role === "admin" && role && role !== "employee") {
        return res.status(403).json({ message: "Admins can only assign the employee role" });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      // allowedCountries can be set to null (to clear) or a string value
      if ("allowedCountries" in req.body) {
        updateData.allowedCountries = allowedCountries || null;
      }

      const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "User not found" });

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "UPDATE",
        description: `Updated user ${updated.name}.`,
      });

      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/users/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== CLIENTS =====

  app.get("/api/clients", authenticate, async (req, res) => {
    try {
      const allClients = await storage.getClients();
      // Super admins always see all clients
      if (req.user!.role === "super_admin") {
        return res.json(allClients);
      }
      // For admin/employee, filter by their allowedCountries
      const currentUser = await storage.getUser(req.user!.userId);
      if (!currentUser || !currentUser.allowedCountries) {
        // No country restriction set — return all for backward compat
        return res.json(allClients);
      }
      const allowed = currentUser.allowedCountries.split(",").map((c) => c.trim());
      const filtered = allClients.filter((c) => allowed.includes(c.country));
      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/clients", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const { vatPeriods, ...clientData } = req.body;
      const client = await storage.createClient(clientData);

      // Auto-create 4 VAT quarters for new client
      const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
      const defaultDates: Record<string, { start: string; end: string; due: string }> = {
        Q1: { start: "2026-01-01", end: "2026-03-31", due: "2026-05-07" },
        Q2: { start: "2026-04-01", end: "2026-06-30", due: "2026-08-07" },
        Q3: { start: "2026-07-01", end: "2026-09-30", due: "2026-11-07" },
        Q4: { start: "2026-10-01", end: "2026-12-31", due: "2027-02-07" },
      };

      for (const q of quarters) {
        const customPeriod = vatPeriods?.[q];
        await storage.createVatRecord({
          clientId: client.id,
          vatQuarter: q,
          vatPeriodStart: customPeriod?.start || defaultDates[q].start,
          vatPeriodEnd: customPeriod?.end || defaultDates[q].end,
          vatDueDate: defaultDates[q].due,
          status: "Not Started",
          isActive: customPeriod?.isActive ?? "true",
        });
      }

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "CREATE",
        description: `Created client ${client.companyName} with auto-generated VAT quarters.`,
      });

      res.status(201).json(client);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/clients/:id", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateClient(id, req.body);
      if (!updated) return res.status(404).json({ message: "Client not found" });

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "UPDATE",
        description: `Updated client ${updated.companyName}.`,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/clients/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) return res.status(404).json({ message: "Client not found" });

      await storage.deleteClient(id);

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "DELETE",
        description: `Deleted client ${client.companyName}.`,
      });

      res.json({ message: "Client deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== VAT RECORDS =====

  app.get("/api/vat-records", authenticate, async (req, res) => {
    try {
      const records = await storage.getVatRecords();
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/vat-records/:id", authenticate, async (req, res) => {
    try {
      if (req.user!.role !== "super_admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update VAT records" });
      }
      const id = parseInt(req.params.id);
      const updated = await storage.updateVatRecord(id, req.body);
      if (!updated) return res.status(404).json({ message: "VAT record not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== UK WEEKLY SCHEDULES =====

  app.get("/api/clients/:id/uk-schedule", authenticate, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const items = await storage.getUkScheduleByClient(clientId);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/clients/:id/uk-schedule", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { items } = req.body as { items: { taskName: string; days: string }[] };
      if (!Array.isArray(items)) return res.status(400).json({ message: "items must be an array" });
      const saved = await storage.saveUkSchedule(clientId, items);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Returns clients with schedule tasks due TODAY (for reminder: called day before)
  app.get("/api/uk-schedule/reminders", authenticate, async (req, res) => {
    try {
      const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      // "day before" reminder: check tasks scheduled for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDay = DAYS[tomorrow.getDay()];

      const allSchedules = await storage.getUkSchedulesForAllClients();
      const allClients = await storage.getClients();

      const reminders: { clientId: number; clientName: string; taskName: string; scheduledDay: string }[] = [];

      for (const sched of allSchedules) {
        const days = sched.days.split(",").map(d => d.trim()).filter(Boolean);
        if (days.includes(tomorrowDay)) {
          const client = allClients.find(c => c.id === sched.clientId);
          if (client && client.status === "Active") {
            reminders.push({
              clientId: sched.clientId,
              clientName: client.companyName,
              taskName: sched.taskName,
              scheduledDay: tomorrowDay,
            });
          }
        }
      }
      res.json({ tomorrowDay, reminders });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Monthly date-based reminders (VAT Quarterly drafts, P&L Monthly/Quarterly)
  app.get("/api/date-reminders", authenticate, async (req, res) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfMonth = tomorrow.getDate();
      const tomorrowLabel = `${tomorrow.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;

      const allClients = await storage.getClients();
      const ukActiveClients = allClients.filter(c => c.country === "UK" && c.status === "Active");

      const reminders: { clientId: number; clientName: string; label: string }[] = [];

      for (const client of ukActiveClients) {
        const checks: { flag: string | null; date: string | null; label: string }[] = [
          { flag: client.plMonthly, date: client.plMonthlyDate, label: "P&L Monthly" },
          { flag: client.plQuarterly, date: client.plQuarterlyDate, label: "P&L Quarterly" },
          { flag: client.vatQuarterlyUk, date: client.vatQuarterlyDraft1Date, label: "VAT Draft 1" },
          { flag: client.vatQuarterlyUk, date: client.vatQuarterlyDraft2Date, label: "VAT Draft 2" },
          { flag: client.vatQuarterlyUk, date: client.vatQuarterlySubmitDate, label: "VAT Submit" },
        ];
        for (const { flag, date, label } of checks) {
          if (flag !== "true" || !date) continue;
          const d = new Date(date);
          if (!isNaN(d.getTime()) && d.getDate() === tomorrowDayOfMonth) {
            reminders.push({ clientId: client.id, clientName: client.companyName, label });
          }
        }
      }

      res.json({ tomorrowLabel, reminders });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== TASKS =====

  app.get("/api/tasks", authenticate, async (req, res) => {
    try {
      let taskList;
      if (req.user!.role === "employee") {
        taskList = await storage.getTasksByUser(req.user!.userId);
      } else {
        taskList = await storage.getTasks();
      }
      res.json(taskList);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/tasks", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        assignedBy: req.user!.userId,
        assignmentDate: new Date().toISOString().split("T")[0],
      };
      
      const task = await storage.createTask(taskData);

      const taskClient = task.clientId ? await storage.getClient(task.clientId) : undefined;
      const taskNotif = await storage.createNotification({
        userId: task.assignedTo,
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${task.title}" (Priority: ${task.priority})`,
        type: "task_assigned",
        relatedTaskId: task.id,
        country: taskClient?.country ?? undefined,
        status: "unread",
      });
      notifyUser(task.assignedTo, { type: "new_notification", notification: taskNotif });

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "CREATE",
        description: `Created task "${task.title}" and assigned to user ${task.assignedTo}.`,
      });

      res.status(201).json(task);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/tasks/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getTask(id);
      if (!existing) return res.status(404).json({ message: "Task not found" });

      if (req.user!.role === "employee" && existing.assignedTo !== req.user!.userId) {
        return res.status(403).json({ message: "You can only update your own tasks" });
      }

      if (req.body.status === "Done" && req.user!.role !== "admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "Only admin or super admin can mark tasks as Done" });
      }

      const updated = await storage.updateTask(id, req.body);

      if (req.body.status && req.body.status !== existing.status) {
        const allUsers = await storage.getUsers();
        const adminUsers = allUsers.filter(u => u.role === "admin" || u.role === "super_admin");
        const notifyUsers = new Set([existing.assignedTo, existing.assignedBy, ...adminUsers.map(u => u.id)]);
        const changedByUser = allUsers.find(u => u.id === req.user!.userId);
        const changedByName = changedByUser?.name || "Someone";
        const existingClient = existing.clientId ? await storage.getClient(existing.clientId) : undefined;
        for (const uid of notifyUsers) {
          const sNotif = await storage.createNotification({
            userId: uid,
            title: "Task Status Changed",
            message: `${changedByName} changed task "${existing.title}" from ${existing.status} to ${req.body.status}`,
            type: "task_update",
            relatedTaskId: id,
            country: existingClient?.country ?? undefined,
            status: "unread",
          });
          notifyUser(uid, { type: "new_notification", notification: sNotif });
        }
      }

      if (req.body.assignedTo && req.body.assignedTo !== existing.assignedTo) {
        const reassignClient = existing.clientId ? await storage.getClient(existing.clientId) : undefined;
        const rNotif = await storage.createNotification({
          userId: req.body.assignedTo,
          title: "Task Reassigned",
          message: `You have been assigned the task: "${existing.title}"`,
          type: "task_assigned",
          relatedTaskId: id,
          country: reassignClient?.country ?? undefined,
          status: "unread",
        });
        notifyUser(req.body.assignedTo, { type: "new_notification", notification: rNotif });
      }

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "UPDATE",
        description: `Updated task "${existing.title}" - ${JSON.stringify(req.body)}.`,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/tasks/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      await storage.deleteTask(id);

      await storage.createAuditLog({
        userId: req.user!.userId,
        actionType: "DELETE",
        description: `Deleted task "${task.title}".`,
      });

      res.json({ message: "Task deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== AUDIT LOGS =====

  app.get("/api/audit-logs", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== NOTIFICATIONS =====

  // SSE endpoint for real-time notifications
  app.get("/api/notifications/stream", authenticate, (req, res) => {
    const userId = req.user!.userId;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    if (!sseClients.has(userId)) {
      sseClients.set(userId, new Set());
    }
    sseClients.get(userId)!.add(res);

    const heartbeat = setInterval(() => {
      try { res.write(": heartbeat\n\n"); } catch {}
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeat);
      const clients = sseClients.get(userId);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) sseClients.delete(userId);
      }
    });
  });

  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const notifs = await storage.getNotificationsByUser(req.user!.userId);
      res.json(notifs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/notifications", authenticate, async (req, res) => {
    try {
      const { title, message, type, country } = req.body;
      if (!title || !message) return res.status(400).json({ message: "title and message required" });
      const notif = await storage.createNotification({
        userId: req.user!.userId,
        title,
        message,
        type: type || "info",
        country: country ?? undefined,
        status: "unread",
      });
      notifyUser(req.user!.userId, { type: "new_notification", notification: notif });
      res.status(201).json(notif);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/notifications/unread", authenticate, async (req, res) => {
    try {
      const notifs = await storage.getUnreadNotifications(req.user!.userId);
      res.json(notifs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/notifications/:id/read", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/notifications/read-all", authenticate, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/notifications/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/notifications", authenticate, async (req, res) => {
    try {
      await storage.deleteAllNotifications(req.user!.userId);
      res.json({ message: "All notifications deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/notifications/preferences", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const defaults = { soundEnabled: true, browserNotifications: false, popupOnLogin: true, taskAssigned: true, taskUpdated: true, deadlineWarning: true, vatDeadline: true, taskReassigned: true };
      const prefs = user.notificationPreferences ? JSON.parse(user.notificationPreferences) : defaults;
      res.json({ ...defaults, ...prefs });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/notifications/preferences", authenticate, async (req, res) => {
    try {
      const prefsString = JSON.stringify(req.body);
      await db.update(users).set({ notificationPreferences: prefsString }).where(eq(users.id, req.user!.userId));
      res.json(req.body);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/notifications/check-deadlines", authenticate, async (req, res) => {
    try {
      const count = await checkDeadlines();
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== DASHBOARD STATS =====

  app.get("/api/dashboard/stats", authenticate, async (req, res) => {
    try {
      const [allClients, allVat, allTasks, allUsers] = await Promise.all([
        storage.getClients(),
        storage.getVatRecords(),
        storage.getTasks(),
        storage.getUsers(),
      ]);

      const isEmployee = req.user!.role === "employee";
      const userId = req.user!.userId;

      const tasks = isEmployee ? allTasks.filter(t => t.assignedTo === userId) : allTasks;
      const vatRecords = isEmployee ? allVat.filter(v => v.assignedTo === userId) : allVat;
      const assignedClientIds = isEmployee
        ? [...new Set(tasks.map(t => t.clientId))]
        : [];
      const clientCount = isEmployee ? assignedClientIds.length : allClients.length;

      const stats = {
        totalClients: clientCount,
        clientsByCountry: isEmployee
          ? {
              UK: allClients.filter(c => assignedClientIds.includes(c.id) && c.country === "UK").length,
              UAE: allClients.filter(c => assignedClientIds.includes(c.id) && c.country === "UAE").length,
            }
          : {
              UK: allClients.filter(c => c.country === "UK").length,
              UAE: allClients.filter(c => c.country === "UAE").length,
            },
        overdueVat: (() => {
          const now = new Date();
          const overdueVatCount = vatRecords.filter(r => {
            if (!r.vatDueDate) return r.status === "Overdue";
            return r.status === "Overdue" || (
              new Date(r.vatDueDate) < now &&
              r.status !== "Filed" &&
              r.status !== "Completed"
            );
          }).length;
          const overdueCtCount = isEmployee ? 0 : allClients.filter(c => {
            if (!c.corporateTaxDueDate) return c.corporateTaxStatus === "Overdue";
            return c.corporateTaxStatus === "Overdue" || (
              new Date(c.corporateTaxDueDate) < now &&
              c.corporateTaxStatus !== "Filed" &&
              c.corporateTaxStatus !== "Completed"
            );
          }).length;
          return overdueVatCount + overdueCtCount;
        })(),
        activeTasks: tasks.filter(t => t.status !== "Completed" && t.status !== "Done").length,
        urgentTasks: tasks.filter(t => t.priority === "Emergency" || t.priority === "High").length,
        tasksByStatus: {
          "Not Started": tasks.filter(t => t.status === "Not Started").length,
          "In Process": tasks.filter(t => t.status === "In Process").length,
          "Completed": tasks.filter(t => t.status === "Completed").length,
        },
        doneTasks: tasks.filter(t => t.status === "Done").length,
        totalEmployees: allUsers.filter(u => u.role === "employee").length,
      };

      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/dashboard/charts", authenticate, async (req, res) => {
    try {
      const [allClients, allVat, allTasks, allUsers] = await Promise.all([
        storage.getClients(),
        storage.getVatRecords(),
        storage.getTasks(),
        storage.getUsers(),
      ]);

      const isEmployee = req.user!.role === "employee";
      const userId = req.user!.userId;
      const tasks = isEmployee ? allTasks.filter(t => t.assignedTo === userId) : allTasks;
      const vatRecords = isEmployee ? allVat.filter(v => v.assignedTo === userId) : allVat;

      const priorityBreakdown = [
        { name: "Emergency", value: tasks.filter(t => t.priority === "Emergency").length, fill: "#C97C6B" },
        { name: "High", value: tasks.filter(t => t.priority === "High").length, fill: "#D4A574" },
        { name: "Normal", value: tasks.filter(t => t.priority === "Normal").length, fill: "#6B9080" },
        { name: "Low", value: tasks.filter(t => t.priority === "Low").length, fill: "#A3B18A" },
      ];

      const vatStatusBreakdown = [
        { name: "Filed", value: vatRecords.filter(r => r.status === "Filed").length, fill: "#6B9080" },
        { name: "Pending", value: vatRecords.filter(r => r.status === "Pending").length, fill: "#D4A574" },
        { name: "Overdue", value: vatRecords.filter(r => r.status === "Overdue").length, fill: "#C97C6B" },
        { name: "Not Due", value: vatRecords.filter(r => r.status === "Not Due" || r.status === "Upcoming").length, fill: "#D1D5DB" },
      ];

      const now = new Date();
      const deadlineTimeline: { week: string; due: number; completed: number }[] = [];
      for (let i = 0; i < 8; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const weekLabel = i === 0 ? "This Week" : i === 1 ? "Next Week" : `Week ${i + 1}`;
        const dueTasks = tasks.filter(t => {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate);
          return d >= weekStart && d < weekEnd;
        });
        deadlineTimeline.push({
          week: weekLabel,
          due: dueTasks.filter(t => t.status !== "Completed").length,
          completed: dueTasks.filter(t => t.status === "Completed").length,
        });
      }

      let workloadByEmployee: { name: string; notStarted: number; inProcess: number; completed: number; total: number }[] = [];
      if (!isEmployee) {
        const employees = allUsers.filter(u => u.role === "employee");
        workloadByEmployee = employees.map(emp => {
          const empTasks = allTasks.filter(t => t.assignedTo === emp.id);
          return {
            name: emp.name.split(" ")[0],
            notStarted: empTasks.filter(t => t.status === "Not Started").length,
            inProcess: empTasks.filter(t => t.status === "In Process").length,
            completed: empTasks.filter(t => t.status === "Completed").length,
            total: empTasks.length,
          };
        }).filter(e => e.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);
      }

      const statusTrend = [
        { name: "Not Started", value: tasks.filter(t => t.status === "Not Started").length, fill: "#D1D5DB" },
        { name: "In Process", value: tasks.filter(t => t.status === "In Process").length, fill: "#A3B18A" },
        { name: "Completed", value: tasks.filter(t => t.status === "Completed").length, fill: "#6B9080" },
      ];

      res.json({
        priorityBreakdown,
        vatStatusBreakdown,
        deadlineTimeline,
        workloadByEmployee,
        statusTrend,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== DIRECT MESSAGES =====

  app.get("/api/messages/conversations", authenticate, async (req, res) => {
    try {
      const partners = await storage.getConversationPartners(req.user!.userId);
      const allUsers = await storage.getUsers();
      const userMap = Object.fromEntries(allUsers.map(u => [u.id, { id: u.id, name: u.name, role: u.role }]));

      const conversations = partners.map(p => ({
        user: userMap[p.userId] || { id: p.userId, name: "Unknown", role: "employee" },
        lastMessage: p.lastMessage,
      }));

      res.json(conversations);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/messages/users", authenticate, async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const filtered = allUsers
        .filter(u => u.id !== req.user!.userId)
        .map(({ password, ...u }) => u);
      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/messages/unread/count", authenticate, async (req, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.userId);
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/messages/:userId", authenticate, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getDirectMessages(req.user!.userId, otherUserId);
      await storage.markMessagesRead(otherUserId, req.user!.userId);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/messages", authenticate, async (req, res) => {
    try {
      const { receiverId, message } = req.body;
      if (!receiverId || !message) {
        return res.status(400).json({ message: "Receiver and message are required" });
      }
      const msg = await storage.createDirectMessage({
        senderId: req.user!.userId,
        receiverId,
        message,
        isRead: "false",
      });
      res.status(201).json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== AI TASK PRIORITIZATION =====

  app.post("/api/ai/task-priorities", authenticate, requireRole("super_admin", "admin"), async (req, res) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
      const baseURL = process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

      if (!apiKey) {
        return res.status(400).json({ message: "OpenAI API key is not configured" });
      }

      const openaiClient = new OpenAI({ apiKey, baseURL });

      const [allTasks, allClients, allUsers, allVat] = await Promise.all([
        storage.getTasks(),
        storage.getClients(),
        storage.getUsers(),
        storage.getVatRecords(),
      ]);

      const activeTasks = allTasks.filter(t => t.status !== "Completed" && t.status !== "Done");

      if (activeTasks.length === 0) {
        return res.json({ suggestions: [], summary: "No active tasks to prioritize." });
      }

      const clientMap = Object.fromEntries(allClients.map(c => [c.id, c]));
      const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

      const taskSummaries = activeTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate || "No due date",
        client: clientMap[t.clientId]?.companyName || "Unknown",
        clientCountry: clientMap[t.clientId]?.country || "Unknown",
        assignedTo: userMap[t.assignedTo]?.name || "Unassigned",
      }));

      const overdueVat = allVat.filter(v => v.status === "Overdue");
      const vatContext = overdueVat.length > 0
        ? `\nOverdue VAT filings: ${overdueVat.map(v => `${clientMap[v.clientId]?.companyName || "Unknown"} - ${v.vatQuarter}`).join(", ")}`
        : "";

      const today = new Date().toISOString().split("T")[0];

      const prompt = `You are an expert accounting firm task manager for Alliance Street Accounting. Today is ${today}.

Analyze these active tasks and provide prioritization suggestions:

${JSON.stringify(taskSummaries, null, 2)}
${vatContext}

Provide a JSON response with this exact structure:
{
  "summary": "Brief 1-2 sentence overview of the workload",
  "suggestions": [
    {
      "taskId": <number>,
      "recommendedPriority": "Emergency" | "High" | "Normal",
      "reason": "Brief reason for this priority",
      "actionRequired": "What should be done next"
    }
  ],
  "insights": [
    "Key insight about workload distribution or bottlenecks"
  ]
}

Consider:
- Tax and VAT deadlines (urgent compliance work)
- UK vs UAE regulatory differences
- Current task status and overdue items
- Employee workload balance
- Tasks approaching their due dates should be prioritized higher
- Overdue tasks are highest priority`;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      res.json(parsed);
    } catch (err: any) {
      console.error("AI prioritization error:", err);
      res.status(500).json({ message: "Failed to get AI suggestions: " + err.message });
    }
  });

  // ===== HR - ATTENDANCE =====

  app.get("/api/hr/attendance", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const { userId, date } = req.query;
      if (date) {
        const records = await storage.getAttendanceByDate(date as string);
        return res.json(records);
      }
      if (userId) {
        const records = await storage.getAttendanceByUser(Number(userId));
        return res.json(records);
      }
      const allUsers = await storage.getUsers();
      const allRecords: any[] = [];
      for (const u of allUsers) {
        const records = await storage.getAttendanceByUser(u.id);
        allRecords.push(...records);
      }
      res.json(allRecords);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/hr/attendance/monthly", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const { userId, month, year } = req.query;
      if (!userId || !month || !year) return res.status(400).json({ message: "userId, month, year required" });
      const records = await storage.getAttendanceByUserAndMonth(Number(userId), month as string, year as string);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/hr/attendance", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const record = await storage.createAttendance(req.body);
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/hr/attendance/bulk", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const { entries } = req.body;
      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ message: "entries array is required" });
      }
      const results = [];
      for (const entry of entries) {
        const record = await storage.createAttendance(entry);
        results.push(record);
      }
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/hr/attendance/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const updated = await storage.updateAttendance(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/hr/attendance/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      await storage.deleteAttendance(Number(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== HR - SALARY PROFILES =====

  app.get("/api/hr/salary-profiles", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const profiles = await storage.getSalaryProfiles();
      res.json(profiles);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/hr/salary-profiles/:userId", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const profile = await storage.getSalaryProfileByUser(Number(req.params.userId));
      res.json(profile || null);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/hr/salary-profiles", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const profile = await storage.createSalaryProfile(req.body);
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/hr/salary-profiles/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const updated = await storage.updateSalaryProfile(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== HR - SALARY SLIPS =====

  app.get("/api/hr/salary-slips", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const slips = await storage.getSalarySlips();
      res.json(slips);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/hr/salary-slips", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const slip = await storage.createSalarySlip(req.body);
      res.json(slip);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/hr/salary-slips/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const updated = await storage.updateSalarySlip(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/hr/salary-slips/:id", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      await storage.deleteSalarySlip(Number(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/hr/generate-salary-slip", authenticate, requireRole("super_admin"), async (req, res) => {
    try {
      const { userId, month, year } = req.body;
      if (!userId || !month || !year) return res.status(400).json({ message: "userId, month, year required" });

      const profile = await storage.getSalaryProfileByUser(Number(userId));
      if (!profile) return res.status(404).json({ message: "No salary profile found for this employee" });

      const attendance = await storage.getAttendanceByUserAndMonth(Number(userId), month, year);
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      const paidStatuses = ["Present", "Half Day", "Week Off", "Holiday"];
      const paidDays = attendance.filter(a => paidStatuses.includes(a.status)).length;
      const halfDays = attendance.filter(a => a.status === "Half Day").length;
      const absentDays = daysInMonth - paidDays;
      const effectivePresent = paidDays - (halfDays * 0.5);

      const basic = parseFloat(profile.basicSalary);
      const housing = parseFloat(profile.housingAllowance || "0");
      const transport = parseFloat(profile.transportAllowance || "0");
      const otherAllow = parseFloat(profile.otherAllowances || "0");
      const deductions = parseFloat(profile.deductions || "0");
      const pf = parseFloat(profile.pf || "0");
      const tds = parseFloat(profile.tds || "0");

      const grossSalary = basic + housing + transport + otherAllow;
      const dailyRate = grossSalary / daysInMonth;
      const adjustedGross = dailyRate * effectivePresent;
      const totalDeductions = deductions + pf + tds;
      const netSalary = adjustedGross - totalDeductions;

      const slip = await storage.createSalarySlip({
        userId: Number(userId),
        month,
        year,
        basicSalary: basic.toFixed(2),
        housingAllowance: housing.toFixed(2),
        transportAllowance: transport.toFixed(2),
        otherAllowances: otherAllow.toFixed(2),
        grossSalary: grossSalary.toFixed(2),
        deductions: deductions.toFixed(2),
        pf: pf.toFixed(2),
        tds: tds.toFixed(2),
        netSalary: netSalary.toFixed(2),
        workingDays: daysInMonth.toString(),
        presentDays: effectivePresent.toString(),
        absentDays: absentDays.toString(),
        currency: profile.currency,
        status: "Generated",
      });

      res.json(slip);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  setInterval(async () => {
    try {
      await checkDeadlines();
    } catch (err) {
      console.error("Deadline check error:", err);
    }
  }, 3600000);

  return httpServer;
}
