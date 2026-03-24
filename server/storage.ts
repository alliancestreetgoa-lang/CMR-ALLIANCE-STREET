import { db, pool } from "./db";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";
import {
  users, clients, vatRecords, tasks, auditLogs, notifications, directMessages,
  attendanceRecords, salaryProfiles, salarySlips, ukWeeklySchedules,
  type User, type InsertUser,
  type Client, type InsertClient,
  type VatRecord, type InsertVatRecord,
  type Task, type InsertTask,
  type AuditLog, type InsertAuditLog,
  type Notification, type InsertNotification,
  type DirectMessage, type InsertDirectMessage,
  type AttendanceRecord, type InsertAttendance,
  type SalaryProfile, type InsertSalaryProfile,
  type SalarySlip, type InsertSalarySlip,
  type UkWeeklySchedule, type InsertUkSchedule,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<void>;

  // VAT Records
  getVatRecords(): Promise<VatRecord[]>;
  getVatRecordsByClient(clientId: number): Promise<VatRecord[]>;
  createVatRecord(record: InsertVatRecord): Promise<VatRecord>;
  updateVatRecord(id: number, record: Partial<InsertVatRecord>): Promise<VatRecord | undefined>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  deleteAllNotifications(userId: number): Promise<void>;

  // Direct Messages
  getDirectMessages(userId1: number, userId2: number): Promise<DirectMessage[]>;
  getConversationPartners(userId: number): Promise<{ userId: number; lastMessage: DirectMessage }[]>;
  createDirectMessage(msg: InsertDirectMessage): Promise<DirectMessage>;
  markMessagesRead(senderId: number, receiverId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;

  // HR - Attendance
  getAttendanceByUser(userId: number): Promise<AttendanceRecord[]>;
  getAttendanceByDate(date: string): Promise<AttendanceRecord[]>;
  getAttendanceByUserAndMonth(userId: number, month: string, year: string): Promise<AttendanceRecord[]>;
  createAttendance(record: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: number, record: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;
  deleteAttendance(id: number): Promise<void>;

  // HR - Salary Profiles
  getSalaryProfiles(): Promise<SalaryProfile[]>;
  getSalaryProfileByUser(userId: number): Promise<SalaryProfile | undefined>;
  createSalaryProfile(profile: InsertSalaryProfile): Promise<SalaryProfile>;
  updateSalaryProfile(id: number, profile: Partial<InsertSalaryProfile>): Promise<SalaryProfile | undefined>;

  // HR - Salary Slips
  getSalarySlips(): Promise<SalarySlip[]>;
  getSalarySlipsByUser(userId: number): Promise<SalarySlip[]>;
  createSalarySlip(slip: InsertSalarySlip): Promise<SalarySlip>;
  updateSalarySlip(id: number, slip: Partial<InsertSalarySlip>): Promise<SalarySlip | undefined>;
  deleteSalarySlip(id: number): Promise<void>;

  // UK Weekly Schedules
  getUkScheduleByClient(clientId: number): Promise<UkWeeklySchedule[]>;
  saveUkSchedule(clientId: number, items: { taskName: string; days: string }[]): Promise<UkWeeklySchedule[]>;
  getUkSchedulesForAllClients(): Promise<UkWeeklySchedule[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByName(name: string) {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.name}) = LOWER(${name})`);
    return user;
  }

  async getUsers() {
    return db.select().from(users).orderBy(asc(users.name));
  }

  async createUser(user: InsertUser) {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async deleteUser(id: number) {
    await db.delete(users).where(eq(users.id, id));
  }

  // Clients
  async getClient(id: number) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClients() {
    return db.select().from(clients).orderBy(asc(clients.companyName));
  }

  async createClient(client: InsertClient) {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  async updateClient(id: number, client: Partial<InsertClient>) {
    const [updated] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: number) {
    await db.delete(vatRecords).where(eq(vatRecords.clientId, id));
    await db.delete(tasks).where(eq(tasks.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
  }

  // VAT Records
  async getVatRecords() {
    return db.select().from(vatRecords).orderBy(asc(vatRecords.clientId), asc(vatRecords.vatQuarter));
  }

  async getVatRecordsByClient(clientId: number) {
    return db.select().from(vatRecords).where(eq(vatRecords.clientId, clientId)).orderBy(asc(vatRecords.vatQuarter));
  }

  async createVatRecord(record: InsertVatRecord) {
    const [created] = await db.insert(vatRecords).values(record).returning();
    return created;
  }

  async updateVatRecord(id: number, record: Partial<InsertVatRecord>) {
    const [updated] = await db.update(vatRecords).set(record).where(eq(vatRecords.id, id)).returning();
    return updated;
  }

  // Tasks
  async getTask(id: number) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasks() {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTasksByUser(userId: number) {
    return db.select().from(tasks).where(eq(tasks.assignedTo, userId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask) {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: number, task: Partial<InsertTask>) {
    if (task.status) {
      await pool.query('UPDATE tasks SET status = $1::task_status WHERE id = $2', [task.status, id]);
      const rest = { ...task };
      delete rest.status;
      if (Object.keys(rest).length > 0) {
        await db.update(tasks).set(rest).where(eq(tasks.id, id));
      }
      const [result] = await db.select().from(tasks).where(eq(tasks.id, id));
      return result;
    }
    const [updated] = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number) {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Audit Logs
  async getAuditLogs() {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100);
  }

  async createAuditLog(log: InsertAuditLog) {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  // Notifications
  async getNotificationsByUser(userId: number) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: number) {
    return db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.status, "unread")))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification) {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: number) {
    await db.update(notifications).set({ status: "read" }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number) {
    await db.update(notifications)
      .set({ status: "read" })
      .where(and(eq(notifications.userId, userId), eq(notifications.status, "unread")));
  }

  async deleteNotification(id: number) {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteAllNotifications(userId: number) {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  // Direct Messages
  async getDirectMessages(userId1: number, userId2: number) {
    return db.select().from(directMessages)
      .where(
        or(
          and(eq(directMessages.senderId, userId1), eq(directMessages.receiverId, userId2)),
          and(eq(directMessages.senderId, userId2), eq(directMessages.receiverId, userId1))
        )
      )
      .orderBy(asc(directMessages.createdAt));
  }

  async getConversationPartners(userId: number) {
    const allMessages = await db.select().from(directMessages)
      .where(
        or(eq(directMessages.senderId, userId), eq(directMessages.receiverId, userId))
      )
      .orderBy(desc(directMessages.createdAt));

    const partnerMap = new Map<number, DirectMessage>();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, msg);
      }
    }

    return Array.from(partnerMap.entries()).map(([partnerId, lastMessage]) => ({
      userId: partnerId,
      lastMessage,
    }));
  }

  async createDirectMessage(msg: InsertDirectMessage) {
    const [created] = await db.insert(directMessages).values(msg).returning();
    return created;
  }

  async markMessagesRead(senderId: number, receiverId: number) {
    await db.update(directMessages)
      .set({ isRead: "true" })
      .where(
        and(
          eq(directMessages.senderId, senderId),
          eq(directMessages.receiverId, receiverId),
          eq(directMessages.isRead, "false")
        )
      );
  }

  async getUnreadMessageCount(userId: number) {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(directMessages)
      .where(
        and(eq(directMessages.receiverId, userId), eq(directMessages.isRead, "false"))
      );
    return Number(result[0]?.count || 0);
  }

  // HR - Attendance
  async getAttendanceByUser(userId: number) {
    return db.select().from(attendanceRecords).where(eq(attendanceRecords.userId, userId)).orderBy(desc(attendanceRecords.date));
  }

  async getAttendanceByDate(date: string) {
    return db.select().from(attendanceRecords).where(eq(attendanceRecords.date, date));
  }

  async getAttendanceByUserAndMonth(userId: number, month: string, year: string) {
    const prefix = `${year}-${month.padStart(2, "0")}`;
    return db.select().from(attendanceRecords)
      .where(and(eq(attendanceRecords.userId, userId), sql`${attendanceRecords.date} LIKE ${prefix + '%'}`))
      .orderBy(asc(attendanceRecords.date));
  }

  async createAttendance(record: InsertAttendance) {
    const [created] = await db.insert(attendanceRecords).values(record).returning();
    return created;
  }

  async updateAttendance(id: number, record: Partial<InsertAttendance>) {
    const [updated] = await db.update(attendanceRecords).set(record).where(eq(attendanceRecords.id, id)).returning();
    return updated;
  }

  async deleteAttendance(id: number) {
    await db.delete(attendanceRecords).where(eq(attendanceRecords.id, id));
  }

  // HR - Salary Profiles
  async getSalaryProfiles() {
    return db.select().from(salaryProfiles).orderBy(asc(salaryProfiles.userId));
  }

  async getSalaryProfileByUser(userId: number) {
    const [profile] = await db.select().from(salaryProfiles).where(eq(salaryProfiles.userId, userId));
    return profile;
  }

  async createSalaryProfile(profile: InsertSalaryProfile) {
    const [created] = await db.insert(salaryProfiles).values(profile).returning();
    return created;
  }

  async updateSalaryProfile(id: number, profile: Partial<InsertSalaryProfile>) {
    const [updated] = await db.update(salaryProfiles).set(profile).where(eq(salaryProfiles.id, id)).returning();
    return updated;
  }

  // HR - Salary Slips
  async getSalarySlips() {
    return db.select().from(salarySlips).orderBy(desc(salarySlips.generatedAt));
  }

  async getSalarySlipsByUser(userId: number) {
    return db.select().from(salarySlips).where(eq(salarySlips.userId, userId)).orderBy(desc(salarySlips.generatedAt));
  }

  async createSalarySlip(slip: InsertSalarySlip) {
    const [created] = await db.insert(salarySlips).values(slip).returning();
    return created;
  }

  async updateSalarySlip(id: number, slip: Partial<InsertSalarySlip>) {
    const [updated] = await db.update(salarySlips).set(slip).where(eq(salarySlips.id, id)).returning();
    return updated;
  }

  async deleteSalarySlip(id: number) {
    await db.delete(salarySlips).where(eq(salarySlips.id, id));
  }

  // UK Weekly Schedules
  async getUkScheduleByClient(clientId: number) {
    return db.select().from(ukWeeklySchedules).where(eq(ukWeeklySchedules.clientId, clientId));
  }

  async saveUkSchedule(clientId: number, items: { taskName: string; days: string }[]) {
    await db.delete(ukWeeklySchedules).where(eq(ukWeeklySchedules.clientId, clientId));
    if (items.length === 0) return [];
    const inserted = await db.insert(ukWeeklySchedules).values(
      items.map(i => ({ clientId, taskName: i.taskName, days: i.days }))
    ).returning();
    return inserted;
  }

  async getUkSchedulesForAllClients() {
    return db.select().from(ukWeeklySchedules);
  }
}

export const storage = new DatabaseStorage();
