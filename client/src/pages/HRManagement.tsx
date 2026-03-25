import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Trash2, Eye, FileText, DollarSign, CalendarCheck, User, CalendarDays, BarChart3, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserData = { id: number; name: string; role: string };
type AttendanceRecord = {
  id: number;
  userId: number;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: string | null;
  notes: string | null;
};
type SalaryProfile = {
  id: number;
  userId: number;
  basicSalary: string;
  housingAllowance: string | null;
  transportAllowance: string | null;
  otherAllowances: string | null;
  deductions: string | null;
  pf: string | null;
  tds: string | null;
  currency: string;
  effectiveFrom: string | null;
};
type SalarySlip = {
  id: number;
  userId: number;
  month: string;
  year: string;
  basicSalary: string;
  housingAllowance: string | null;
  transportAllowance: string | null;
  otherAllowances: string | null;
  grossSalary: string;
  deductions: string | null;
  pf: string | null;
  tds: string | null;
  netSalary: string;
  workingDays: string | null;
  presentDays: string | null;
  absentDays: string | null;
  currency: string;
  status: string;
  generatedAt: string | null;
};

export default function HRManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== "super_admin") {
    return <Redirect to="/" />;
  }

  useEffect(() => {
    api
      .get("/api/users")
      .then((data) => setUsers(data))
      .catch((err: any) =>
        toast({ title: "Error loading users", description: err.message, variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground" data-testid="text-hr-title">
            HR Management
          </h1>
          <p className="text-muted-foreground">Manage attendance, salaries, and payslips.</p>
        </div>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl" data-testid="tabs-hr">
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="salary" data-testid="tab-salary">
              <DollarSign className="mr-2 h-4 w-4" />
              Salary
            </TabsTrigger>
            <TabsTrigger value="slips" data-testid="tab-slips">
              <FileText className="mr-2 h-4 w-4" />
              Salary Slips
            </TabsTrigger>
            <TabsTrigger value="payroll" data-testid="tab-payroll">
              <BarChart3 className="mr-2 h-4 w-4" />
              Payroll Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <AttendanceTab users={users} toast={toast} />
          </TabsContent>
          <TabsContent value="salary">
            <SalaryTab users={users} toast={toast} />
          </TabsContent>
          <TabsContent value="slips">
            <SalarySlipsTab users={users} toast={toast} />
          </TabsContent>
          <TabsContent value="payroll">
            <PayrollSummaryTab users={users} toast={toast} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function AttendanceTab({ users, toast }: { users: UserData[]; toast: any }) {
  const [view, setView] = useState<"daily" | "employee">("daily");

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        <Button
          variant={view === "daily" ? "default" : "outline"}
          onClick={() => setView("daily")}
          data-testid="button-daily-view"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Daily View
        </Button>
        <Button
          variant={view === "employee" ? "default" : "outline"}
          onClick={() => setView("employee")}
          data-testid="button-employee-view"
        >
          <User className="mr-2 h-4 w-4" />
          Employee Wise
        </Button>
      </div>
      {view === "daily" ? (
        <DailyAttendanceView users={users} toast={toast} />
      ) : (
        <EmployeeAttendanceView users={users} toast={toast} />
      )}
    </div>
  );
}

function DailyAttendanceView({ users, toast }: { users: UserData[]; toast: any }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useState<
    Record<number, { status: string; checkIn: string; checkOut: string; notes: string }>
  >({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const fetchAttendance = async (date: string) => {
    setLoading(true);
    try {
      const data = await api.get(`/api/hr/attendance?date=${date}`);
      setAttendance(data);
      const local: typeof localData = {};
      users.forEach((u) => {
        const record = data.find((a: AttendanceRecord) => a.userId === u.id);
        local[u.id] = {
          status: record?.status || "Present",
          checkIn: record?.checkIn || "",
          checkOut: record?.checkOut || "",
          notes: record?.notes || "",
        };
      });
      setLocalData(local);
    } catch (err: any) {
      toast({ title: "Error loading attendance", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  const handleMarkAttendance = async (userId: number) => {
    const entry = localData[userId];
    if (!entry) return;
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      const existing = attendance.find((a) => a.userId === userId);
      if (existing) {
        const updated = await api.patch(`/api/hr/attendance/${existing.id}`, {
          status: entry.status,
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
        });
        setAttendance((prev) => prev.map((a) => (a.id === existing.id ? updated : a)));
      } else {
        const created = await api.post("/api/hr/attendance", {
          userId,
          date: selectedDate,
          status: entry.status,
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
        });
        setAttendance((prev) => [...prev, created]);
      }
      toast({ title: "Attendance saved" });
    } catch (err: any) {
      toast({ title: "Error saving attendance", description: err.message, variant: "destructive" });
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const updateLocal = (userId: number, field: string, value: string) => {
    setLocalData((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>Mark daily attendance for all employees</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="attendance-date" className="text-sm whitespace-nowrap">
              Date:
            </Label>
            <Input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px]"
              data-testid="input-attendance-date"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const entry = localData[u.id] || { status: "Present", checkIn: "", checkOut: "", notes: "" };
                  return (
                    <TableRow key={u.id} data-testid={`row-attendance-${u.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>
                        <Select
                          value={entry.status}
                          onValueChange={(v) => updateLocal(u.id, "status", v)}
                        >
                          <SelectTrigger className="w-[130px]" data-testid={`select-status-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Present">Present</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                            <SelectItem value="Half Day">Half Day</SelectItem>
                            <SelectItem value="Leave">Leave</SelectItem>
                            <SelectItem value="Week Off">Week Off (Paid)</SelectItem>
                            <SelectItem value="Holiday">Holiday (Paid)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={entry.checkIn}
                          onChange={(e) => updateLocal(u.id, "checkIn", e.target.value)}
                          className="w-[130px]"
                          data-testid={`input-checkin-${u.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={entry.checkOut}
                          onChange={(e) => updateLocal(u.id, "checkOut", e.target.value)}
                          className="w-[130px]"
                          data-testid={`input-checkout-${u.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.notes}
                          onChange={(e) => updateLocal(u.id, "notes", e.target.value)}
                          placeholder="Notes..."
                          className="w-[160px]"
                          data-testid={`input-notes-${u.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleMarkAttendance(u.id)}
                          disabled={saving[u.id]}
                          data-testid={`button-mark-attendance-${u.id}`}
                        >
                          {saving[u.id] && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Mark
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmployeeAttendanceView({ users, toast }: { users: UserData[]; toast: any }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "M"));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDefault, setBulkDefault] = useState("Present");
  const [bulkEntries, setBulkEntries] = useState<Record<number, string>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchRecords = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const data = await api.get(
        `/api/hr/attendance/monthly?userId=${selectedUserId}&month=${selectedMonth}&year=${selectedYear}`
      );
      setRecords(data);
    } catch (err: any) {
      toast({ title: "Error loading attendance", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) fetchRecords();
  }, [selectedUserId, selectedMonth, selectedYear]);

  const statusColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Absent": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Half Day": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Leave": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "Week Off": return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
      case "Holiday": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  const daysInMonth = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
  const markedDates = new Set(records.map((r) => new Date(r.date).getDate()));
  const unmarkedDaysList = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (day) => !markedDates.has(day)
  );
  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const halfDayCount = records.filter((r) => r.status === "Half Day").length;
  const leaveCount = records.filter((r) => r.status === "Leave").length;
  const weekOffCount = records.filter((r) => r.status === "Week Off").length;
  const holidayCount = records.filter((r) => r.status === "Holiday").length;
  const paidDays = presentCount + halfDayCount + weekOffCount + holidayCount;
  const unmarkedDays = unmarkedDaysList.length;

  const selectedUser = users.find((u) => u.id === Number(selectedUserId));

  const openBulkDialog = () => {
    const entries: Record<number, string> = {};
    unmarkedDaysList.forEach((day) => {
      entries[day] = bulkDefault;
    });
    setBulkEntries(entries);
    setBulkOpen(true);
  };

  const applyDefaultToAll = (status: string) => {
    setBulkDefault(status);
    const updated: Record<number, string> = {};
    Object.keys(bulkEntries).forEach((key) => {
      updated[Number(key)] = status;
    });
    setBulkEntries(updated);
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    try {
      const entries = Object.entries(bulkEntries).map(([day, status]) => {
        const dateStr = `${selectedYear}-${selectedMonth.padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return {
          userId: Number(selectedUserId),
          date: dateStr,
          status,
          checkIn: null,
          checkOut: null,
          notes: null,
        };
      });
      const created = await api.post("/api/hr/attendance/bulk", { entries });
      setRecords((prev) => [...prev, ...created]);
      setBulkOpen(false);
      toast({ title: `${created.length} attendance records saved` });
    } catch (err: any) {
      toast({ title: "Error saving bulk attendance", description: err.message, variant: "destructive" });
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Employee Wise Attendance</CardTitle>
            <CardDescription>View attendance history for a specific employee</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[180px]" data-testid="select-employee-attendance">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]" data-testid="select-month-attendance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]" data-testid="select-year-attendance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedUserId ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Select an employee</p>
            <p className="text-sm">Choose an employee to view their attendance records</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Days</p>
                <p className="text-xl font-bold">{daysInMonth}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-green-700 dark:text-green-400">Present</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">{presentCount}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-red-700 dark:text-red-400">Absent</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{absentCount}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">Half Day</p>
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{halfDayCount}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-700 dark:text-orange-400">Leave</p>
                <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{leaveCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-700 dark:text-slate-400">Week Off</p>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-400">{weekOffCount}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-700 dark:text-purple-400">Holiday</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{holidayCount}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Paid Days</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{paidDays}</p>
              </div>
            </div>

            {unmarkedDays > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {unmarkedDays} day(s) not yet marked for {selectedUser?.name}
                </p>
                <Button
                  size="sm"
                  onClick={openBulkDialog}
                  data-testid="button-bulk-attendance"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Bulk Mark Attendance
                </Button>
              </div>
            )}

            {records.length === 0 && unmarkedDays === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>No attendance records found for {selectedUser?.name} in {monthNames[Number(selectedMonth) - 1]} {selectedYear}</p>
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((r) => {
                        const d = new Date(r.date);
                        const dayName = format(d, "EEEE");
                        return (
                          <TableRow key={r.id} data-testid={`row-emp-attendance-${r.id}`}>
                            <TableCell className="font-medium">{format(d, "dd MMM yyyy")}</TableCell>
                            <TableCell className="text-muted-foreground">{dayName}</TableCell>
                            <TableCell>
                              <Badge className={cn("font-medium", statusColor(r.status))} variant="secondary">
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{r.checkIn || "—"}</TableCell>
                            <TableCell>{r.checkOut || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{r.notes || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Mark Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for all {unmarkedDays} unmarked days of {selectedUser?.name} in {monthNames[Number(selectedMonth) - 1]} {selectedYear}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <Label className="text-sm whitespace-nowrap">Set all to:</Label>
              <Select value={bulkDefault} onValueChange={applyDefaultToAll}>
                <SelectTrigger className="w-[160px]" data-testid="select-bulk-default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Half Day">Half Day</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="Week Off">Week Off (Paid)</SelectItem>
                  <SelectItem value="Holiday">Holiday (Paid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmarkedDaysList.map((day) => {
                    const d = new Date(Number(selectedYear), Number(selectedMonth) - 1, day);
                    const dayName = format(d, "EEEE");
                    return (
                      <TableRow key={day} data-testid={`row-bulk-${day}`}>
                        <TableCell className="font-medium">{format(d, "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-muted-foreground">{dayName}</TableCell>
                        <TableCell>
                          <Select
                            value={bulkEntries[day] || "Present"}
                            onValueChange={(v) =>
                              setBulkEntries((prev) => ({ ...prev, [day]: v }))
                            }
                          >
                            <SelectTrigger className="w-[150px]" data-testid={`select-bulk-status-${day}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Present">Present</SelectItem>
                              <SelectItem value="Absent">Absent</SelectItem>
                              <SelectItem value="Half Day">Half Day</SelectItem>
                              <SelectItem value="Leave">Leave</SelectItem>
                              <SelectItem value="Week Off">Week Off (Paid)</SelectItem>
                              <SelectItem value="Holiday">Holiday (Paid)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={bulkSaving}
              data-testid="button-bulk-save"
            >
              {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All ({Object.keys(bulkEntries).length} days)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SalaryTab({ users, toast }: { users: UserData[]; toast: any }) {
  const [profiles, setProfiles] = useState<SalaryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SalaryProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [formData, setFormData] = useState({
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    otherAllowances: "",
    deductions: "",
    pf: "",
    tds: "",
    currency: "AED",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/api/hr/salary-profiles")
      .then((data) => setProfiles(data))
      .catch((err: any) =>
        toast({ title: "Error loading salary profiles", description: err.message, variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const getUserName = (id: number) => users.find((u) => u.id === id)?.name || `User #${id}`;

  const openCreateDialog = (userId: number) => {
    setEditingProfile(null);
    setSelectedUserId(String(userId));
    setFormData({
      basicSalary: "",
      housingAllowance: "",
      transportAllowance: "",
      otherAllowances: "",
      deductions: "",
      pf: "",
      tds: "",
      currency: "AED",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (profile: SalaryProfile) => {
    setEditingProfile(profile);
    setSelectedUserId(String(profile.userId));
    setFormData({
      basicSalary: profile.basicSalary || "",
      housingAllowance: profile.housingAllowance || "",
      transportAllowance: profile.transportAllowance || "",
      otherAllowances: profile.otherAllowances || "",
      deductions: profile.deductions || "",
      pf: profile.pf || "",
      tds: profile.tds || "",
      currency: profile.currency || "AED",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editingProfile) {
        const updated = await api.patch(`/api/hr/salary-profiles/${editingProfile.id}`, formData);
        setProfiles((prev) => prev.map((p) => (p.id === editingProfile.id ? updated : p)));
        toast({ title: "Salary profile updated" });
      } else {
        const created = await api.post("/api/hr/salary-profiles", {
          userId: Number(selectedUserId),
          ...formData,
        });
        setProfiles((prev) => [...prev, created]);
        toast({ title: "Salary profile created" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error saving salary profile", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getProfileForUser = (userId: number) => profiles.find((p) => p.userId === userId);

  return (
    <Card className="border-border/60 shadow-sm mt-4">
      <CardHeader>
        <CardTitle>Salary Management</CardTitle>
        <CardDescription>Configure salary profiles for all employees</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Housing</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Other</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>PF</TableHead>
                  <TableHead>TDS</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const profile = getProfileForUser(u.id);
                  return (
                    <TableRow key={u.id} data-testid={`row-salary-${u.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{profile?.basicSalary || "—"}</TableCell>
                      <TableCell>{profile?.housingAllowance || "—"}</TableCell>
                      <TableCell>{profile?.transportAllowance || "—"}</TableCell>
                      <TableCell>{profile?.otherAllowances || "—"}</TableCell>
                      <TableCell>{profile?.deductions || "—"}</TableCell>
                      <TableCell>{profile?.pf || "—"}</TableCell>
                      <TableCell>{profile?.tds || "—"}</TableCell>
                      <TableCell>
                        {profile ? (
                          <Badge variant="outline">{profile.currency}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {profile ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(profile)}
                            data-testid={`button-edit-salary-${u.id}`}
                          >
                            Edit Salary
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openCreateDialog(u.id)}
                            data-testid={`button-set-salary-${u.id}`}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Set Salary
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? "Edit Salary Profile" : "Set Salary Profile"}
              </DialogTitle>
              <DialogDescription>
                {editingProfile
                  ? `Update salary details for ${getUserName(editingProfile.userId)}`
                  : `Set salary details for ${getUserName(Number(selectedUserId))}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Basic Salary</Label>
                <Input
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  placeholder="0"
                  data-testid="input-basic-salary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Housing Allowance</Label>
                  <Input
                    type="number"
                    value={formData.housingAllowance}
                    onChange={(e) => setFormData({ ...formData, housingAllowance: e.target.value })}
                    placeholder="0"
                    data-testid="input-housing-allowance"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Transport Allowance</Label>
                  <Input
                    type="number"
                    value={formData.transportAllowance}
                    onChange={(e) => setFormData({ ...formData, transportAllowance: e.target.value })}
                    placeholder="0"
                    data-testid="input-transport-allowance"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Other Allowances</Label>
                  <Input
                    type="number"
                    value={formData.otherAllowances}
                    onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                    placeholder="0"
                    data-testid="input-other-allowances"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Deductions</Label>
                  <Input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    placeholder="0"
                    data-testid="input-deductions"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>PF (Provident Fund)</Label>
                  <Input
                    type="number"
                    value={formData.pf}
                    onChange={(e) => setFormData({ ...formData, pf: e.target.value })}
                    placeholder="0"
                    data-testid="input-pf"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>TDS (Tax Deducted at Source)</Label>
                  <Input
                    type="number"
                    value={formData.tds}
                    onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                    placeholder="0"
                    data-testid="input-tds"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formData.basicSalary}
                data-testid="button-submit-salary"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProfile ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function SalarySlipsTab({ users, toast }: { users: UserData[]; toast: any }) {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [viewSlip, setViewSlip] = useState<SalarySlip | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    api
      .get("/api/hr/salary-slips")
      .then((data) => setSlips(data))
      .catch((err: any) =>
        toast({ title: "Error loading salary slips", description: err.message, variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const getUserName = (id: number) => users.find((u) => u.id === id)?.name || `User #${id}`;

  const handleGenerate = async () => {
    if (!selectedUserId) return;
    setGenerating(true);
    try {
      const slip = await api.post("/api/hr/generate-salary-slip", {
        userId: Number(selectedUserId),
        month: selectedMonth,
        year: selectedYear,
      });
      setSlips((prev) => [slip, ...prev]);
      toast({ title: "Salary slip generated" });
    } catch (err: any) {
      toast({ title: "Error generating salary slip", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/hr/salary-slips/${id}`);
      setSlips((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Salary slip deleted" });
    } catch (err: any) {
      toast({ title: "Error deleting salary slip", description: err.message, variant: "destructive" });
    }
  };

  const [slipAttendance, setSlipAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const downloadSlipPDF = (slip: SalarySlip) => {
    const name = getUserName(slip.userId);
    const monthName = getMonthName(slip.month);
    const currency = slip.currency;
    const basicSalary = parseFloat(slip.basicSalary) || 0;
    const housing = parseFloat(slip.housingAllowance || "0") || 0;
    const transport = parseFloat(slip.transportAllowance || "0") || 0;
    const other = parseFloat(slip.otherAllowances || "0") || 0;
    const deductionsAmt = parseFloat(slip.deductions || "0") || 0;
    const pfAmt = parseFloat(slip.pf || "0") || 0;
    const tdsAmt = parseFloat(slip.tds || "0") || 0;
    const gross = parseFloat(slip.grossSalary) || 0;
    const net = parseFloat(slip.netSalary) || 0;
    const totalDeductions = deductionsAmt + pfAmt + tdsAmt;

    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // ── HEADER ────────────────────────────────────────────────────────────────
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("Alliance Street Accounting Private Limited", pw / 2, 18, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Salary Slip", pw / 2, 25, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(`${monthName} ${slip.year}`, pw / 2, 32, { align: "center" });

    doc.setDrawColor(210);
    doc.line(14, 36, pw - 14, 36);

    // ── EMPLOYEE INFO ─────────────────────────────────────────────────────────
    doc.setFontSize(9);
    let y = 44;
    const leftX = 14;
    const rightX = pw / 2 + 5;

    const infoRow = (label1: string, val1: string, label2: string, val2: string) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      doc.text(label1, leftX, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20);
      doc.text(val1, leftX + doc.getTextWidth(label1) + 2, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      doc.text(label2, rightX, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20);
      doc.text(val2, rightX + doc.getTextWidth(label2) + 2, y);
      y += 8;
    };

    infoRow("Employee Name:", name, "Currency:", currency);
    infoRow("Working Days:", String(slip.workingDays || "—"), "Present Days (Paid):", String(slip.presentDays || "—"));
    infoRow("Absent Days:", String(slip.absentDays || "—"), "Status:", slip.status);

    y += 2;

    // ── DAILY ATTENDANCE CALENDAR ─────────────────────────────────────────────
    const statusShortPDF = (status: string) => {
      switch (status) {
        case "Present": return "P";
        case "Absent": return "A";
        case "Half Day": return "HD";
        case "Leave": return "L";
        case "Week Off": return "WO";
        case "Holiday": return "H";
        default: return "—";
      }
    };

    const statusColorPDF = (status: string): [number, number, number] => {
      switch (status) {
        case "Present":  return [209, 250, 229];
        case "Absent":   return [254, 202, 202];
        case "Half Day": return [253, 246, 178];
        case "Leave":    return [254, 215, 170];
        case "Week Off": return [226, 232, 240];
        case "Holiday":  return [233, 213, 255];
        default:         return [245, 245, 245];
      }
    };

    const attendanceMap: Record<number, AttendanceRecord> = {};
    slipAttendance.forEach((a) => {
      attendanceMap[new Date(a.date).getDate()] = a;
    });

    const daysInMonth = new Date(Number(slip.year), Number(slip.month), 0).getDate();
    const firstDayOfMonth = new Date(Number(slip.year), Number(slip.month) - 1, 1).getDay();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = Array(firstDayOfMonth).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    // Section header bar
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y, pw - 28, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(40);
    doc.text(`Daily Attendance — ${monthName} ${slip.year}`, 18, y + 5);
    y += 9;

    autoTable(doc, {
      startY: y,
      head: [["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]],
      body: weeks.map(week =>
        week.map(day => {
          if (!day) return "";
          const d = new Date(Number(slip.year), Number(slip.month) - 1, day);
          const dayName = format(d, "EEE");
          const record = attendanceMap[day];
          return `${day}\n${dayName}\n${record ? statusShortPDF(record.status) : "—"}`;
        })
      ),
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontSize: 8, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 8, minCellHeight: 18, valign: "middle", halign: "center", cellPadding: 1 },
      didParseCell: (data: any) => {
        if (data.section === "body") {
          const day = weeks[data.row.index]?.[data.column.index];
          if (day) {
            const record = attendanceMap[day];
            data.cell.styles.fillColor = record ? statusColorPDF(record.status) : [245, 245, 245];
            data.cell.styles.textColor = record ? [30, 30, 30] : [160, 160, 160];
          } else {
            data.cell.styles.fillColor = [255, 255, 255];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    const afterCalendar = (doc as any).lastAutoTable.finalY + 3;

    // Legend
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const legendItems: { color: [number, number, number]; label: string }[] = [
      { color: [209, 250, 229], label: "P = Present" },
      { color: [254, 202, 202], label: "A = Absent" },
      { color: [253, 246, 178], label: "HD = Half Day" },
      { color: [254, 215, 170], label: "L = Leave" },
      { color: [226, 232, 240], label: "WO = Week Off" },
      { color: [233, 213, 255], label: "H = Holiday" },
    ];
    let legendX = 14;
    legendItems.forEach(({ color, label }) => {
      doc.setFillColor(...color);
      doc.rect(legendX, afterCalendar, 3.5, 3.5, "F");
      doc.setDrawColor(180);
      doc.rect(legendX, afterCalendar, 3.5, 3.5, "S");
      doc.setTextColor(60);
      doc.text(label, legendX + 4.5, afterCalendar + 3);
      legendX += 29;
    });

    y = afterCalendar + 9;

    // ── EARNINGS TABLE ────────────────────────────────────────────────────────
    autoTable(doc, {
      startY: y,
      head: [["Earnings", `Amount (${currency})`]],
      body: [
        ["Basic Salary", basicSalary.toFixed(2)],
        ["Housing Allowance", housing.toFixed(2)],
        ["Transport Allowance", transport.toFixed(2)],
        ["Other Allowances", other.toFixed(2)],
        ["Gross Salary", gross.toFixed(2)],
      ],
      theme: "grid",
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: { 1: { halign: "right" } },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.row.index === 4) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [238, 238, 238];
        }
      },
      margin: { left: 14, right: 14 },
    });

    const afterEarnings = (doc as any).lastAutoTable.finalY + 5;

    // ── DEDUCTIONS TABLE ──────────────────────────────────────────────────────
    autoTable(doc, {
      startY: afterEarnings,
      head: [["Deductions", `Amount (${currency})`]],
      body: [
        ["Deductions", deductionsAmt.toFixed(2)],
        ["PF (Provident Fund)", pfAmt.toFixed(2)],
        ["TDS (Tax Deducted at Source)", tdsAmt.toFixed(2)],
        ["Total Deductions", totalDeductions.toFixed(2)],
      ],
      theme: "grid",
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: { 1: { halign: "right" } },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.row.index === 3) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [238, 238, 238];
        }
      },
      margin: { left: 14, right: 14 },
    });

    const afterDeductions = (doc as any).lastAutoTable.finalY + 8;

    // ── NET SALARY ────────────────────────────────────────────────────────────
    doc.setFillColor(255, 240, 240);
    doc.roundedRect(14, afterDeductions, pw - 28, 14, 2, 2, "F");
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, afterDeductions, pw - 28, 14, 2, 2, "S");
    doc.setLineWidth(0.2);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text("Net Salary", 20, afterDeductions + 9);
    doc.setTextColor(220, 38, 38);
    doc.text(`${currency} ${net.toFixed(2)}`, pw - 20, afterDeductions + 9, { align: "right" });

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const footerY = afterDeductions + 26;
    doc.setDrawColor(220);
    doc.line(14, footerY - 4, pw - 14, footerY - 4);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130);
    doc.text("This is a computer-generated document and does not require a signature.", pw / 2, footerY, { align: "center" });
    if (slip.generatedAt) {
      doc.text(
        `Generated on: ${format(new Date(slip.generatedAt), "MMMM d, yyyy 'at' h:mm a")}`,
        pw / 2, footerY + 5, { align: "center" }
      );
    }

    doc.save(`Salary_Slip_${name.replace(/\s+/g, "_")}_${monthName}_${slip.year}.pdf`);
    toast({ title: "PDF downloaded", description: `Salary slip for ${name} — ${monthName} ${slip.year}` });
  };

  const openViewDialog = async (slip: SalarySlip) => {
    setViewSlip(slip);
    setViewDialogOpen(true);
    setLoadingAttendance(true);
    try {
      const data = await api.get(
        `/api/hr/attendance/monthly?userId=${slip.userId}&month=${slip.month}&year=${slip.year}`
      );
      setSlipAttendance(data);
    } catch {
      setSlipAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const getMonthName = (m: string) => months.find((mo) => mo.value === m)?.label || m;

  const years = ["2024", "2025", "2026", "2027"];

  return (
    <Card className="border-border/60 shadow-sm mt-4">
      <CardHeader>
        <CardTitle>Salary Slips</CardTitle>
        <CardDescription>Generate and manage employee salary slips</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-muted/30 rounded-lg border border-border/40">
          <div className="grid gap-2 flex-1">
            <Label>Employee</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger data-testid="select-slip-employee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]" data-testid="select-slip-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]" data-testid="select-slip-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedUserId}
            data-testid="button-generate-slip"
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Salary Slip
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : slips.length === 0 ? (
          <div className="text-center text-muted-foreground py-10" data-testid="text-no-slips">
            No salary slips generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>PF</TableHead>
                  <TableHead>TDS</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slips.map((slip) => (
                  <TableRow key={slip.id} data-testid={`row-slip-${slip.id}`}>
                    <TableCell className="font-medium">{getUserName(slip.userId)}</TableCell>
                    <TableCell>
                      {getMonthName(slip.month)} {slip.year}
                    </TableCell>
                    <TableCell>
                      {slip.currency} {slip.grossSalary}
                    </TableCell>
                    <TableCell>
                      {slip.currency} {slip.deductions || "0"}
                    </TableCell>
                    <TableCell>
                      {slip.currency} {slip.pf || "0"}
                    </TableCell>
                    <TableCell>
                      {slip.currency} {slip.tds || "0"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {slip.currency} {slip.netSalary}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={slip.status === "Final" ? "default" : "secondary"}
                        data-testid={`badge-status-${slip.id}`}
                      >
                        {slip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {slip.generatedAt
                        ? format(new Date(slip.generatedAt), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openViewDialog(slip)}
                          data-testid={`button-view-slip-${slip.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(slip.id)}
                          data-testid={`button-delete-slip-${slip.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            {viewSlip && (
              <SalarySlipPrintView
                slip={viewSlip}
                employeeName={getUserName(viewSlip.userId)}
                getMonthName={getMonthName}
                attendance={slipAttendance}
                loadingAttendance={loadingAttendance}
              />
            )}
            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {viewSlip && (
                <Button variant="outline" onClick={() => downloadSlipPDF(viewSlip)} data-testid="button-download-slip-pdf">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function PayrollSummaryTab({ users, toast }: { users: UserData[]; toast: any }) {
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(false);
  const [countryFilter, setCountryFilter] = useState<"ALL" | "UK" | "UAE">("ALL");

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = ["2024", "2025", "2026", "2027"];
  const getMonthName = (m: string) => months.find((mo) => mo.value === m)?.label || m;
  const getUserName = (id: number) => users.find((u) => u.id === id)?.name || `User #${id}`;

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const allSlips = await api.get("/api/hr/salary-slips");
      const filtered = allSlips.filter(
        (s: SalarySlip) => s.month === selectedMonth && s.year === selectedYear
      );
      setSlips(filtered);
    } catch (err: any) {
      toast({ title: "Error loading payroll data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlips();
  }, [selectedMonth, selectedYear]);

  const getCurrencyCountry = (curr: string) => curr === "AED" ? "UAE" : "UK";
  
  const filteredSlips = countryFilter === "ALL" 
    ? slips 
    : slips.filter(s => getCurrencyCountry(s.currency) === countryFilter);
  
  const totalGross = filteredSlips.reduce((sum, s) => sum + (parseFloat(s.grossSalary) || 0), 0);
  const totalDeductions = filteredSlips.reduce((sum, s) => sum + (parseFloat(s.deductions || "0") || 0) + (parseFloat(s.pf || "0") || 0) + (parseFloat(s.tds || "0") || 0), 0);
  const totalNet = filteredSlips.reduce((sum, s) => sum + (parseFloat(s.netSalary) || 0), 0);
  const currency = filteredSlips.length > 0 ? filteredSlips[0].currency : "AED";

  const buildTableData = () =>
    filteredSlips.map((slip, index) => ({
      "#": index + 1,
      Employee: getUserName(slip.userId),
      "Working Days": slip.workingDays || "—",
      "Present (Paid)": slip.presentDays || "—",
      Absent: slip.absentDays || "—",
      "Gross Salary": `${slip.currency} ${parseFloat(slip.grossSalary).toFixed(2)}`,
      Deductions: `${slip.currency} ${parseFloat(slip.deductions || "0").toFixed(2)}`,
      PF: `${slip.currency} ${parseFloat(slip.pf || "0").toFixed(2)}`,
      TDS: `${slip.currency} ${parseFloat(slip.tds || "0").toFixed(2)}`,
      "Net Salary": `${slip.currency} ${parseFloat(slip.netSalary).toFixed(2)}`,
    }));

  const exportToExcel = () => {
    const data = buildTableData();
    data.push({
      "#": "" as any,
      Employee: "",
      "Working Days": "",
      "Present (Paid)": "",
      Absent: "Grand Total",
      "Gross Salary": `${currency} ${totalGross.toFixed(2)}`,
      Deductions: `${currency} ${totalDeductions.toFixed(2)}`,
      PF: `${currency} ${slips.reduce((sum, s) => sum + (parseFloat(s.pf || "0") || 0), 0).toFixed(2)}`,
      TDS: `${currency} ${slips.reduce((sum, s) => sum + (parseFloat(s.tds || "0") || 0), 0).toFixed(2)}`,
      "Net Salary": `${currency} ${totalNet.toFixed(2)}`,
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
    XLSX.writeFile(wb, `Payroll_Summary_${getMonthName(selectedMonth)}_${selectedYear}.xlsx`);
    toast({ title: "Excel exported", description: `Payroll summary for ${getMonthName(selectedMonth)} ${selectedYear} downloaded.` });
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const title = `Payroll Summary — ${getMonthName(selectedMonth)} ${selectedYear}`;
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.text(`Alliance Street Accounting Private Limited`, 14, 26);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, 14, 32);

    const head = [["#", "Employee", "Working Days", "Present (Paid)", "Absent", "Gross Salary", "Deductions", "PF", "TDS", "Net Salary"]];
    const body = slips.map((slip, i) => [
      i + 1,
      getUserName(slip.userId),
      slip.workingDays || "—",
      slip.presentDays || "—",
      slip.absentDays || "—",
      `${slip.currency} ${parseFloat(slip.grossSalary).toFixed(2)}`,
      `${slip.currency} ${parseFloat(slip.deductions || "0").toFixed(2)}`,
      `${slip.currency} ${parseFloat(slip.pf || "0").toFixed(2)}`,
      `${slip.currency} ${parseFloat(slip.tds || "0").toFixed(2)}`,
      `${slip.currency} ${parseFloat(slip.netSalary).toFixed(2)}`,
    ]);
    body.push([
      "", "", "", "", "Grand Total",
      `${currency} ${totalGross.toFixed(2)}`,
      `${currency} ${totalDeductions.toFixed(2)}`,
      `${currency} ${slips.reduce((sum, s) => sum + (parseFloat(s.pf || "0") || 0), 0).toFixed(2)}`,
      `${currency} ${slips.reduce((sum, s) => sum + (parseFloat(s.tds || "0") || 0), 0).toFixed(2)}`,
      `${currency} ${totalNet.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 38,
      head,
      body,
      theme: "grid",
      headStyles: { fillColor: [41, 98, 255], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data: any) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 240, 255];
        }
      },
    });

    doc.save(`Payroll_Summary_${getMonthName(selectedMonth)}_${selectedYear}.pdf`);
    toast({ title: "PDF exported", description: `Payroll summary for ${getMonthName(selectedMonth)} ${selectedYear} downloaded.` });
  };

  return (
    <Card className="border-border/60 shadow-sm mt-4">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Payroll Summary</CardTitle>
            <CardDescription>Total salary overview of all employees month wise</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]" data-testid="select-payroll-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]" data-testid="select-payroll-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-md bg-background p-0.5">
              {(["ALL", "UK", "UAE"] as const).map((c) => (
                <Button
                  key={c}
                  variant={countryFilter === c ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`filter-payroll-country-${c.toLowerCase()}`}
                  onClick={() => setCountryFilter(c)}
                  className="h-7 text-xs"
                >
                  {c === "ALL" ? "All" : c}
                </Button>
              ))}
            </div>
            {slips.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={exportToPDF} data-testid="button-export-pdf" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel} data-testid="button-export-excel" className="gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : slips.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No salary slips found for {getMonthName(selectedMonth)} {selectedYear}</p>
            <p className="text-sm mt-1">Generate salary slips from the Salary Slips tab first</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/20">
                <p className="text-sm text-primary">Total Gross Salary</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {currency} {totalGross.toFixed(2)}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">Total Deductions</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
                  {currency} {totalDeductions.toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Total Net Salary</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {currency} {totalNet.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              <Badge variant="secondary">{filteredSlips.length} employee(s)</Badge>
              <span className="ml-2">for {getMonthName(selectedMonth)} {selectedYear}</span>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>#</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Working Days</TableHead>
                    <TableHead>Present (Paid)</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead className="text-right">Gross Salary</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">TDS</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSlips.map((slip, index) => (
                    <TableRow key={slip.id} data-testid={`row-payroll-${slip.id}`}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{getUserName(slip.userId)}</TableCell>
                      <TableCell>{slip.workingDays || "—"}</TableCell>
                      <TableCell>{slip.presentDays || "—"}</TableCell>
                      <TableCell>{slip.absentDays || "—"}</TableCell>
                      <TableCell className="text-right">{slip.currency} {parseFloat(slip.grossSalary).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {slip.currency} {parseFloat(slip.deductions || "0").toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {slip.currency} {parseFloat(slip.pf || "0").toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {slip.currency} {parseFloat(slip.tds || "0").toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {slip.currency} {parseFloat(slip.netSalary).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold border-t-2">
                    <TableCell colSpan={5} className="text-right">
                      Grand Total
                    </TableCell>
                    <TableCell className="text-right">{currency} {totalGross.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">{currency} {totalDeductions.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">{currency} {slips.reduce((sum, s) => sum + (parseFloat(s.pf || "0") || 0), 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">{currency} {slips.reduce((sum, s) => sum + (parseFloat(s.tds || "0") || 0), 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-primary">{currency} {totalNet.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SalarySlipPrintView({
  slip,
  employeeName,
  getMonthName,
  attendance,
  loadingAttendance,
}: {
  slip: SalarySlip;
  employeeName: string;
  getMonthName: (m: string) => string;
  attendance: AttendanceRecord[];
  loadingAttendance: boolean;
}) {
  const basicSalary = parseFloat(slip.basicSalary) || 0;
  const housing = parseFloat(slip.housingAllowance || "0") || 0;
  const transport = parseFloat(slip.transportAllowance || "0") || 0;
  const other = parseFloat(slip.otherAllowances || "0") || 0;
  const deductions = parseFloat(slip.deductions || "0") || 0;
  const pfAmount = parseFloat(slip.pf || "0") || 0;
  const tdsAmount = parseFloat(slip.tds || "0") || 0;
  const gross = parseFloat(slip.grossSalary) || 0;
  const net = parseFloat(slip.netSalary) || 0;

  const daysInMonth = new Date(Number(slip.year), Number(slip.month), 0).getDate();
  const attendanceMap: Record<number, AttendanceRecord> = {};
  attendance.forEach((a) => {
    const day = new Date(a.date).getDate();
    attendanceMap[day] = a;
  });

  const statusShort = (status: string) => {
    switch (status) {
      case "Present": return "P";
      case "Absent": return "A";
      case "Half Day": return "HD";
      case "Leave": return "L";
      case "Week Off": return "WO";
      case "Holiday": return "H";
      default: return "—";
    }
  };

  const statusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case "Present": return { backgroundColor: "#d1fae5", color: "#166534" };
      case "Absent": return { backgroundColor: "#fee2e2", color: "#991b1b" };
      case "Half Day": return { backgroundColor: "#fef9c3", color: "#854d0e" };
      case "Leave": return { backgroundColor: "#ffedd5", color: "#9a3412" };
      case "Week Off": return { backgroundColor: "#f1f5f9", color: "#1e293b" };
      case "Holiday": return { backgroundColor: "#f3e8ff", color: "#6b21a8" };
      default: return { backgroundColor: "#f9fafb", color: "#9ca3af" };
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Absent": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Half Day": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Leave": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "Week Off": return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
      case "Holiday": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-gray-50 text-gray-400 dark:bg-gray-900/20 dark:text-gray-500";
    }
  };

  const P: React.CSSProperties = {
    fontFamily: "'Inter', Arial, sans-serif",
    color: "#111111",
    backgroundColor: "#ffffff",
  };
  const muted: React.CSSProperties = { color: "#666666" };
  const tblHead: React.CSSProperties = { backgroundColor: "#f3f4f6", color: "#111111", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: "13px", fontWeight: 600 };
  const tblCell: React.CSSProperties = { color: "#111111", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: "12px" };
  const tblCellRight: React.CSSProperties = { ...tblCell, textAlign: "right" };
  const tblRowAlt: React.CSSProperties = { backgroundColor: "#f9fafb" };

  return (
    <div className="salary-slip-print" data-testid="salary-slip-print" style={P}>
      <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "24px", backgroundColor: "#ffffff" }}>
        <div style={{ textAlign: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "16px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111111", margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Alliance Street Accounting Private Limited</h2>
          <p style={{ fontSize: "13px", ...muted, margin: "4px 0 0" }}>Salary Slip</p>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", margin: "4px 0 0" }}>
            {getMonthName(slip.month)} {slip.year}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "20px" }}>
          <div><span style={muted}>Employee Name:</span> <span style={{ fontWeight: 500, color: "#111111" }}>{employeeName}</span></div>
          <div><span style={muted}>Currency:</span> <span style={{ fontWeight: 500, color: "#111111" }}>{slip.currency}</span></div>
          <div><span style={muted}>Working Days:</span> <span style={{ fontWeight: 500, color: "#111111" }}>{slip.workingDays || "—"}</span></div>
          <div><span style={muted}>Present Days (Paid):</span> <span style={{ fontWeight: 500, color: "#111111" }}>{slip.presentDays || "—"}</span></div>
          <div><span style={muted}>Absent Days:</span> <span style={{ fontWeight: 500, color: "#111111" }}>{slip.absentDays || "—"}</span></div>
          <div><span style={muted}>Status:</span> <span style={{ fontWeight: 500, color: "#111111", marginLeft: "8px" }}>{slip.status}</span></div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ backgroundColor: "#f3f4f6", padding: "8px 16px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#111111", margin: 0 }}>Daily Attendance — {getMonthName(slip.month)} {slip.year}</h3>
          </div>
          {loadingAttendance ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#666" }}>Loading...</div>
          ) : (
            <div style={{ padding: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", fontSize: "11px" }}>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const record = attendanceMap[day];
                  const d = new Date(Number(slip.year), Number(slip.month) - 1, day);
                  const dayName = format(d, "EEE");
                  const status = record ? record.status : "—";
                  const short = record ? statusShort(record.status) : "—";
                  const cellStyle = record ? statusStyle(record.status) : { backgroundColor: "#f9fafb", color: "#9ca3af", borderStyle: "dashed" as const };
                  return (
                    <div
                      key={day}
                      style={{
                        ...cellStyle,
                        borderRadius: "4px",
                        padding: "6px",
                        textAlign: "center",
                        border: `1px ${record ? "solid" : "dashed"} #d1d5db`,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      } as React.CSSProperties}
                      title={`${format(d, "dd MMM")} — ${status}`}
                    >
                      <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{day}</div>
                      <div style={{ fontSize: "10px", opacity: 0.7 }}>{dayName}</div>
                      <div style={{ fontWeight: 700, marginTop: "2px", lineHeight: 1.2 }}>{short}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px", paddingTop: "8px", borderTop: "1px solid #e5e7eb", fontSize: "10px", color: "#555" }}>
                {[
                  { label: "P = Present", bg: "#d1fae5" },
                  { label: "A = Absent", bg: "#fee2e2" },
                  { label: "HD = Half Day", bg: "#fef9c3" },
                  { label: "L = Leave", bg: "#ffedd5" },
                  { label: "WO = Week Off", bg: "#f1f5f9" },
                  { label: "H = Holiday", bg: "#f3e8ff" },
                  { label: "— = Not Marked", bg: "#f9fafb" },
                ].map((item) => (
                  <span key={item.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: item.bg, border: "1px solid #d1d5db", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}></span>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><th style={{ ...tblHead, textAlign: "left" }}>Earnings</th><th style={{ ...tblHead, textAlign: "right" }}>Amount ({slip.currency})</th></tr>
            </thead>
            <tbody>
              <tr><td style={tblCell}>Basic Salary</td><td style={tblCellRight}>{basicSalary.toFixed(2)}</td></tr>
              <tr style={tblRowAlt}><td style={tblCell}>Housing Allowance</td><td style={tblCellRight}>{housing.toFixed(2)}</td></tr>
              <tr><td style={tblCell}>Transport Allowance</td><td style={tblCellRight}>{transport.toFixed(2)}</td></tr>
              <tr style={tblRowAlt}><td style={tblCell}>Other Allowances</td><td style={tblCellRight}>{other.toFixed(2)}</td></tr>
              <tr style={{ backgroundColor: "#f3f4f6" }}><td style={{ ...tblCell, fontWeight: 600 }}>Gross Salary</td><td style={{ ...tblCellRight, fontWeight: 600 }}>{gross.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><th style={{ ...tblHead, textAlign: "left" }}>Deductions</th><th style={{ ...tblHead, textAlign: "right" }}>Amount ({slip.currency})</th></tr>
            </thead>
            <tbody>
              <tr><td style={tblCell}>Deductions</td><td style={tblCellRight}>{deductions.toFixed(2)}</td></tr>
              <tr style={tblRowAlt}><td style={tblCell}>PF (Provident Fund)</td><td style={tblCellRight}>{pfAmount.toFixed(2)}</td></tr>
              <tr><td style={tblCell}>TDS (Tax Deducted at Source)</td><td style={tblCellRight}>{tdsAmount.toFixed(2)}</td></tr>
              <tr style={{ backgroundColor: "#f3f4f6" }}><td style={{ ...tblCell, fontWeight: 600 }}>Total Deductions</td><td style={{ ...tblCellRight, fontWeight: 600 }}>{(deductions + pfAmount + tdsAmount).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: "#fef2f2", borderRadius: "6px", border: "2px solid #dc2626" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#111111" }}>Net Salary</span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626" }}>
            {slip.currency} {net.toFixed(2)}
          </span>
        </div>

        <div style={{ textAlign: "center", fontSize: "11px", color: "#888888", paddingTop: "16px", marginTop: "16px", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ margin: 0 }}>This is a computer-generated document and does not require a signature.</p>
          {slip.generatedAt && (
            <p style={{ margin: "4px 0 0" }}>
              Generated on: {format(new Date(slip.generatedAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
