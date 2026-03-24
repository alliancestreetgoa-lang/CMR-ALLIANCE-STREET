import { 
  Bell, 
  Search, 
  Home, 
  Users, 
  CheckSquare, 
  FileText, 
  PieChart, 
  Settings,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function SoftFocus() {
  return (
    <div className="min-h-screen flex bg-violet-50 font-['Plus_Jakarta_Sans'] text-slate-800">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-violet-100 flex flex-col shrink-0 z-10">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-violet-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm shadow-violet-200">
              <div className="w-3 h-3 bg-white rotate-45 rounded-sm" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Alliance</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div className="space-y-1.5">
            <NavItem icon={Home} label="Overview" active />
            <NavItem icon={CheckSquare} label="Tasks" badge="4" />
            <NavItem icon={Users} label="Clients" />
            <NavItem icon={FileText} label="Documents" />
            <NavItem icon={PieChart} label="Reports" />
          </div>

          <div className="space-y-1.5">
            <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Favorites
            </div>
            <NavItem icon={Home} label="Q3 Tax Planning" isSub />
            <NavItem icon={Home} label="Acme Corp Audit" isSub />
            <NavItem icon={Home} label="Team Onboarding" isSub />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-violet-50">
          <NavItem icon={Settings} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white shadow-[0_2px_10px_-4px_rgba(124,58,237,0.1)] flex items-center justify-between px-8 shrink-0 z-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Morning, Sarah</h1>
          
          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300" />
              <Input 
                placeholder="Search anything..." 
                className="w-full pl-10 bg-violet-50/50 border-transparent hover:border-violet-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 transition-all rounded-full h-10 shadow-none text-sm placeholder:text-violet-300"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full border-2 border-white" />
              </button>
              
              <div className="h-8 w-px bg-violet-100" />
              
              <Avatar className="w-9 h-9 border-2 border-white shadow-sm ring-2 ring-violet-50">
                <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold text-sm">
                  SA
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1200px] mx-auto space-y-10">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard 
                title="Active Clients" 
                value="124" 
                trend="+12 this month" 
                icon={Users}
              />
              <StatCard 
                title="Pending Tasks" 
                value="28" 
                trend="4 due today" 
                icon={CheckSquare}
                trendColor="text-amber-500"
              />
              <StatCard 
                title="Documents to Review" 
                value="12" 
                trend="-3 from yesterday" 
                icon={FileText}
              />
              <StatCard 
                title="Revenue" 
                value="$45.2k" 
                trend="+8.4% growth" 
                icon={PieChart}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Task List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Your Focus Today</h2>
                  <Button variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 rounded-full text-sm font-semibold h-9 px-4">
                    View all tasks
                  </Button>
                </div>
                
                <Card className="border-violet-100/50 shadow-sm shadow-violet-100/20 overflow-hidden rounded-2xl">
                  <div className="divide-y divide-violet-50">
                    <TaskRow 
                      title="Review Q3 Financials for Acme Corp" 
                      client="Acme Corp" 
                      time="10:00 AM" 
                      status="In Progress"
                      statusColor="emerald"
                    />
                    <TaskRow 
                      title="Onboard new employee: John Doe" 
                      client="Internal" 
                      time="1:00 PM" 
                      status="To Do"
                      statusColor="violet"
                    />
                    <TaskRow 
                      title="Submit tax filings for TechStart" 
                      client="TechStart Inc." 
                      time="3:30 PM" 
                      status="Urgent"
                      statusColor="amber"
                    />
                    <TaskRow 
                      title="Weekly sync with partners" 
                      client="Internal" 
                      time="5:00 PM" 
                      status="To Do"
                      statusColor="violet"
                    />
                  </div>
                </Card>
              </div>

              {/* Quick Actions / Upcoming */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <QuickActionCard icon={Plus} label="New Task" />
                  <QuickActionCard icon={Users} label="Add Client" />
                  <QuickActionCard icon={FileText} label="Upload Doc" />
                  <QuickActionCard icon={PieChart} label="Create Report" />
                </div>

                <div className="pt-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Upcoming Deadlines</h3>
                  <div className="space-y-4">
                    <DeadlineItem date="Oct 15" title="Q3 Tax Filings" daysLeft={3} />
                    <DeadlineItem date="Oct 20" title="Payroll Processing" daysLeft={8} />
                    <DeadlineItem date="Oct 31" title="End of Month Close" daysLeft={19} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// Subcomponents

function NavItem({ icon: Icon, label, active, badge, isSub }: { icon: any, label: string, active?: boolean, badge?: string, isSub?: boolean }) {
  return (
    <button 
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
        active 
          ? "bg-violet-100 text-violet-700 font-semibold shadow-sm" 
          : "text-slate-500 hover:bg-violet-50 hover:text-slate-900 font-medium"
      }`}
    >
      <div className="flex items-center gap-3">
        {!isSub && <Icon className={`w-5 h-5 ${active ? "text-violet-600" : "text-slate-400"}`} />}
        {isSub && <div className="w-5 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /></div>}
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className="bg-violet-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, trend, icon: Icon, trendColor = "text-emerald-500" }: { title: string, value: string, trend: string, icon: any, trendColor?: string }) {
  return (
    <Card className="border-none shadow-sm shadow-violet-100/50 rounded-2xl bg-white hover:shadow-md hover:shadow-violet-100 transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <Icon className="w-5 h-5" />
          </div>
          <button className="text-slate-300 hover:text-violet-500 transition-colors">
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
          </div>
          <p className={`text-sm mt-2 font-medium ${trendColor}`}>{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ title, client, time, status, statusColor }: { title: string, client: string, time: string, status: string, statusColor: "emerald" | "violet" | "amber" }) {
  const colorMap = {
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700"
  };

  const iconMap = {
    emerald: CheckCircle2,
    violet: Clock,
    amber: AlertCircle
  };

  const StatusIcon = iconMap[statusColor];

  return (
    <div className="p-5 flex items-center justify-between hover:bg-violet-50/50 transition-colors group cursor-pointer bg-white">
      <div className="flex items-center gap-4">
        <button className="w-6 h-6 rounded-md border-2 border-violet-200 flex items-center justify-center text-transparent hover:border-violet-400 transition-colors group-hover:bg-white">
          <CheckSquare className="w-4 h-4" />
        </button>
        <div>
          <h4 className="font-semibold text-slate-900 text-base">{title}</h4>
          <p className="text-sm text-slate-500 mt-0.5">{client} • {time}</p>
        </div>
      </div>
      <Badge variant="secondary" className={`${colorMap[statusColor]} rounded-full px-3 py-1 font-semibold text-xs border-0 flex items-center gap-1.5`}>
        <StatusIcon className="w-3.5 h-3.5" />
        {status}
      </Badge>
    </div>
  );
}

function QuickActionCard({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-violet-100/50 shadow-sm shadow-violet-100/20 hover:bg-violet-50 hover:border-violet-200 transition-all text-violet-600 group">
      <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center mb-3 group-hover:bg-white group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </button>
  );
}

function DeadlineItem({ date, title, daysLeft }: { date: string, title: string, daysLeft: number }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-violet-100/50 shadow-sm shadow-violet-100/20">
      <div className="flex flex-col items-center justify-center w-12 h-12 bg-violet-50 rounded-lg text-violet-700 shrink-0">
        <span className="text-xs font-bold uppercase">{date.split(' ')[0]}</span>
        <span className="text-lg font-black leading-none">{date.split(' ')[1]}</span>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h4 className="font-semibold text-slate-900 truncate">{title}</h4>
        <p className="text-sm text-slate-500 mt-0.5">{daysLeft} days left</p>
      </div>
    </div>
  );
}
