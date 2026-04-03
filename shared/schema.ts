import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["super_admin", "admin", "employee"]);
export const vatStatusEnum = pgEnum("vat_status", ["Not Started", "In Progress", "Filed", "Completed", "Overdue"]);
export const vatQuarterEnum = pgEnum("vat_quarter", ["Q1", "Q2", "Q3", "Q4"]);
export const taskPriorityEnum = pgEnum("task_priority", ["Normal", "High", "Emergency"]);
export const taskStatusEnum = pgEnum("task_status", ["Not Started", "In Process", "Completed", "Review", "Done"]);
export const actionTypeEnum = pgEnum("action_type", ["CREATE", "UPDATE", "DELETE", "LOGIN", "EXPORT"]);
export const notificationStatusEnum = pgEnum("notification_status", ["unread", "read", "dismissed"]);

// ===== USERS =====
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("employee"),
  allowedCountries: text("allowed_countries"), // comma-separated: "UK", "UAE", "UK,UAE", or null = all
  notificationPreferences: text("notification_preferences"),
  isActive: text("is_active").notNull().default("true"), // "true" | "false"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ===== CLIENTS =====
export const clients = pgTable("clients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyName: text("company_name").notNull(),
  country: text("country").notNull(), // "UK" | "UAE"
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  vatNumber: text("vat_number"),
  licenseExpiryDate: text("license_expiry_date"),
  corporateTaxStartMonth: text("corporate_tax_start_month"),
  corporateTaxEndMonth: text("corporate_tax_end_month"),
  corporateTaxDueDate: text("corporate_tax_due_date"),
  corporateTaxStatus: text("corporate_tax_status").default("Not Started"),
  plMonthly: text("pl_monthly").default("false"),             // UK only — P&L Monthly
  plMonthlyDate: text("pl_monthly_date"),                     // UK only — P&L Monthly due date
  plQuarterly: text("pl_quarterly").default("false"),         // UK only — P&L Quarterly
  plQuarterlyDate: text("pl_quarterly_date"),                 // UK only — P&L Quarterly due date
  vatQuarterlyUk: text("vat_quarterly_uk").default("false"),  // UK only — VAT Quarterly toggle
  vatQuarterlyDraft1Date: text("vat_quarterly_draft1_date"),  // UK only — VAT Q Draft 1 date
  vatQuarterlyDraft2Date: text("vat_quarterly_draft2_date"),  // UK only — VAT Q Draft 2 date
  vatQuarterlySubmitDate: text("vat_quarterly_submit_date"),  // UK only — VAT Q Submit date
  status: text("status").notNull().default("Active"), // Active, Inactive, Pending
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// ===== VAT RECORDS =====
export const vatRecords = pgTable("vat_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").notNull(),
  vatQuarter: vatQuarterEnum("vat_quarter").notNull(),
  vatPeriodStart: text("vat_period_start"),
  vatPeriodEnd: text("vat_period_end"),
  vatDueDate: text("vat_due_date"),
  status: vatStatusEnum("status").notNull().default("Not Started"),
  assignedTo: integer("assigned_to"),
  isActive: text("is_active").notNull().default("true"),
});

export const insertVatRecordSchema = createInsertSchema(vatRecords).omit({ id: true });
export type InsertVatRecord = z.infer<typeof insertVatRecordSchema>;
export type VatRecord = typeof vatRecords.$inferSelect;

// ===== TASKS =====
export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").notNull(),
  assignedTo: integer("assigned_to").notNull(),
  assignedBy: integer("assigned_by").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: taskPriorityEnum("priority").notNull().default("Normal"),
  status: taskStatusEnum("status").notNull().default("Not Started"),
  dueDate: text("due_date"),
  assignmentDate: text("assignment_date"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ===== AUDIT LOGS =====
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  actionType: actionTypeEnum("action_type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ===== NOTIFICATIONS =====
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // "task_assigned", "deadline_warning", "overdue", "info"
  relatedTaskId: integer("related_task_id"),
  country: text("country"), // "UK", "UAE", or null for system-wide
  status: notificationStatusEnum("status").notNull().default("unread"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ===== UK WEEKLY SCHEDULES =====
export const ukWeeklySchedules = pgTable("uk_weekly_schedules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").notNull(),
  taskName: text("task_name").notNull(),
  days: text("days").notNull().default(""), // comma-separated: "Mon,Tue,Wed"
});

export const insertUkScheduleSchema = createInsertSchema(ukWeeklySchedules).omit({ id: true });
export type InsertUkSchedule = z.infer<typeof insertUkScheduleSchema>;
export type UkWeeklySchedule = typeof ukWeeklySchedules.$inferSelect;

// ===== CLIENT ACTIVITY LOGS =====
export const clientActivityLogs = pgTable("client_activity_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").notNull(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  field: text("field"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientActivityLogSchema = createInsertSchema(clientActivityLogs).omit({ id: true, createdAt: true });
export type InsertClientActivityLog = z.infer<typeof insertClientActivityLogSchema>;
export type ClientActivityLog = typeof clientActivityLogs.$inferSelect;

// ===== DIRECT MESSAGES =====
export const directMessages = pgTable("direct_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  message: text("message").notNull(),
  isRead: text("is_read").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, createdAt: true });
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

// ===== HR - ATTENDANCE =====
export const attendanceRecords = pgTable("attendance_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("Present"),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  workingHours: text("working_hours"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// ===== HR - SALARY PROFILES =====
export const salaryProfiles = pgTable("salary_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  basicSalary: text("basic_salary").notNull().default("0"),
  housingAllowance: text("housing_allowance").default("0"),
  transportAllowance: text("transport_allowance").default("0"),
  otherAllowances: text("other_allowances").default("0"),
  deductions: text("deductions").default("0"),
  pf: text("pf").default("0"),
  tds: text("tds").default("0"),
  currency: text("currency").notNull().default("AED"),
  effectiveFrom: text("effective_from"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalaryProfileSchema = createInsertSchema(salaryProfiles).omit({ id: true, createdAt: true });
export type InsertSalaryProfile = z.infer<typeof insertSalaryProfileSchema>;
export type SalaryProfile = typeof salaryProfiles.$inferSelect;

// ===== HR - SALARY SLIPS =====
export const salarySlips = pgTable("salary_slips", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  month: text("month").notNull(),
  year: text("year").notNull(),
  basicSalary: text("basic_salary").notNull(),
  housingAllowance: text("housing_allowance").default("0"),
  transportAllowance: text("transport_allowance").default("0"),
  otherAllowances: text("other_allowances").default("0"),
  grossSalary: text("gross_salary").notNull(),
  deductions: text("deductions").default("0"),
  pf: text("pf").default("0"),
  tds: text("tds").default("0"),
  netSalary: text("net_salary").notNull(),
  workingDays: text("working_days").default("0"),
  presentDays: text("present_days").default("0"),
  absentDays: text("absent_days").default("0"),
  currency: text("currency").notNull().default("AED"),
  status: text("status").notNull().default("Draft"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const insertSalarySlipSchema = createInsertSchema(salarySlips).omit({ id: true, generatedAt: true });
export type InsertSalarySlip = z.infer<typeof insertSalarySlipSchema>;
export type SalarySlip = typeof salarySlips.$inferSelect;
