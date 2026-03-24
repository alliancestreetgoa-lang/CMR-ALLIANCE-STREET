import { 
  Search, 
  Bell, 
  Home, 
  Users, 
  CheckSquare, 
  Users2, 
  FileText, 
  Calculator, 
  Settings,
  MoreHorizontal,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function WarmCraft() {
  const stats = [
    { title: "Total Clients", value: "12", label: "Active portfolios", trend: "+2 this month" },
    { title: "Active Tasks", value: "8", label: "Needs attention", trend: "3 due today" },
    { title: "Completed", value: "24", label: "Last 30 days", trend: "+12% efficiency" },
    { title: "Employees", value: "6", label: "Full-time staff", trend: "Fully staffed" },
  ];

  const tasks = [
    { id: 1, client: "Harrison & Sons Ltd", task: "Q3 VAT Return", due: "Today", status: "In Progress", priority: "High" },
    { id: 2, client: "The Sterling Group", task: "Annual Payroll Audit", due: "Tomorrow", status: "Pending", priority: "Medium" },
    { id: 3, client: "Eleanor Vance", task: "Personal Tax Assessment", due: "Oct 15", status: "Review", priority: "Low" },
    { id: 4, client: "Meridian Holdings", task: "Quarterly Review", due: "Oct 18", status: "Pending", priority: "Medium" },
    { id: 5, client: "Atlas Ventures", task: "New Employee Onboarding", due: "Oct 20", status: "In Progress", priority: "High" },
  ];

  const activities = [
    { id: 1, user: "Sarah Jenkins", action: "uploaded", target: "Q3 Financials.pdf", time: "2 hours ago" },
    { id: 2, user: "Michael Chen", action: "completed task", target: "Sterling Audit", time: "4 hours ago" },
    { id: 3, user: "David Ross", action: "left a note on", target: "Harrison VAT", time: "Yesterday at 4:30 PM" },
    { id: 4, user: "System", action: "generated report", target: "Monthly Summaries", time: "Yesterday at 11:00 AM" },
  ];

  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-900 font-sans selection:bg-amber-200">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-400 flex flex-col flex-shrink-0 border-r border-stone-800 shadow-xl shadow-stone-900/20 z-20">
        <div className="h-20 flex items-center px-6 gap-3 border-b border-stone-800/50">
          <div className="w-10 h-10 bg-amber-700/20 text-amber-500 flex items-center justify-center rounded border border-amber-700/30 font-['Playfair_Display'] text-xl italic font-bold">
            AS
          </div>
          <span className="font-['Playfair_Display'] text-stone-100 text-xl font-medium tracking-wide">
            Alliance Street
          </span>
        </div>

        <div className="flex-1 py-8 px-4 overflow-y-auto">
          <div className="mb-8">
            <h3 className="px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 font-['Playfair_Display']">
              Menu
            </h3>
            <nav className="space-y-1">
              <SidebarItem icon={<Home size={18} />} label="Dashboard" active />
              <SidebarItem icon={<Users size={18} />} label="Clients" />
              <SidebarItem icon={<CheckSquare size={18} />} label="Tasks" badge="8" />
              <SidebarItem icon={<Users2 size={18} />} label="HR" />
              <SidebarItem icon={<FileText size={18} />} label="Documents" />
              <SidebarItem icon={<Calculator size={18} />} label="VAT Tracking" />
            </nav>
          </div>

          <div>
            <h3 className="px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 font-['Playfair_Display']">
              System
            </h3>
            <nav className="space-y-1">
              <SidebarItem icon={<Settings size={18} />} label="Settings" />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-stone-800/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-9 w-9 border border-stone-700">
              <AvatarImage src="https://i.pravatar.cc/150?u=a04258114e29026702d" />
              <AvatarFallback className="bg-stone-800 text-stone-300">EV</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-stone-200">Eleanor Vance</span>
              <span className="text-xs text-stone-500">Senior Partner</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background texture/gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/50 via-stone-50 to-stone-50 pointer-events-none" />

        {/* Header */}
        <header className="h-20 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 max-w-md w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="Search clients, tasks, or documents..." 
                className="w-full pl-9 bg-white/50 border-stone-200/80 focus-visible:ring-amber-600/20 focus-visible:border-amber-600 shadow-sm transition-all text-stone-700 placeholder:text-stone-400 rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-stone-500 hover:text-stone-700 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-600 border border-stone-50"></span>
            </button>
            <div className="h-8 w-px bg-stone-200" />
            <div className="text-sm text-stone-600 font-medium">
              Tuesday, October 12
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Title Area */}
            <div>
              <h1 className="text-4xl font-['Playfair_Display'] font-semibold text-stone-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-stone-500 mt-2 font-['Playfair_Display'] text-lg italic">
                Good morning, Eleanor. Here is your firm's overview for today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="border-stone-200/80 shadow-sm shadow-amber-900/5 bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden group hover:shadow-md hover:border-amber-200/50 transition-all">
                  <div className="h-1 w-full bg-gradient-to-r from-stone-100 to-stone-200 group-hover:from-amber-200 group-hover:to-amber-400 transition-all" />
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-stone-500 mb-1 font-['Playfair_Display'] tracking-wide">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-bold text-stone-800">{stat.value}</h2>
                      <span className="text-xs text-stone-400">{stat.label}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {stat.trend}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Task List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-['Playfair_Display'] font-semibold text-stone-800">
                    Active Tasks
                  </h2>
                  <button className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors">
                    View all tasks &rarr;
                  </button>
                </div>

                <div className="bg-white border border-stone-200/80 shadow-sm shadow-amber-900/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100 bg-stone-50/50">
                        <th className="py-4 px-6 text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Playfair_Display']">Client / Task</th>
                        <th className="py-4 px-6 text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Playfair_Display']">Due Date</th>
                        <th className="py-4 px-6 text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Playfair_Display']">Status</th>
                        <th className="py-4 px-6 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="py-4 px-6">
                            <p className="text-sm font-medium text-stone-800">{task.client}</p>
                            <p className="text-sm text-stone-500">{task.task}</p>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className={`h-3.5 w-3.5 ${task.due === 'Today' ? 'text-amber-600' : 'text-stone-400'}`} />
                              <span className={task.due === 'Today' ? 'font-medium text-amber-700' : 'text-stone-600'}>
                                {task.due}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button className="text-stone-400 hover:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-['Playfair_Display'] font-semibold text-stone-800">
                    Recent Activity
                  </h2>
                </div>

                <Card className="border-stone-200/80 shadow-sm shadow-amber-900/5 bg-white rounded-xl">
                  <CardContent className="p-0">
                    <div className="divide-y divide-stone-100">
                      {activities.map((activity, i) => (
                        <div key={activity.id} className="p-5 flex gap-4 hover:bg-stone-50/50 transition-colors">
                          <div className="mt-1">
                            <div className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-50"></div>
                          </div>
                          <div>
                            <p className="text-sm text-stone-800">
                              <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                              <span className="font-medium text-amber-800">{activity.target}</span>
                            </p>
                            <p className="text-xs text-stone-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-stone-100 bg-stone-50/50 rounded-b-xl text-center">
                      <button className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                        View full log
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Promotional / Info Card */}
                <Card className="border-none bg-amber-900 text-stone-50 shadow-md rounded-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-800 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                  <CardContent className="p-6 relative z-10">
                    <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-2 text-white">Quarterly Reviews</h3>
                    <p className="text-amber-200 text-sm mb-4 leading-relaxed">
                      It's time to begin preparing the Q4 financial summaries for key accounts.
                    </p>
                    <button className="bg-white text-amber-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-50 transition-colors shadow-sm w-full">
                      Start Preparation
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Helpers
function SidebarItem({ icon, label, active = false, badge }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string }) {
  return (
    <a 
      href="#" 
      className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-md transition-colors ${
        active 
          ? 'bg-amber-900/40 text-amber-500 font-medium border-l-2 border-amber-500 ml-[6px]' 
          : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-amber-900/80 text-amber-200' : 'bg-stone-800 text-stone-400'}`}>
          {badge}
        </span>
      )}
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Review': 'bg-purple-50 text-purple-700 border-purple-200',
    'Completed': 'bg-green-50 text-green-700 border-green-200'
  };
  
  const icons: Record<string, React.ReactNode> = {
    'In Progress': <Clock className="h-3 w-3 mr-1" />,
    'Pending': <AlertCircle className="h-3 w-3 mr-1" />,
    'Review': <FileText className="h-3 w-3 mr-1" />,
    'Completed': <CheckCircle2 className="h-3 w-3 mr-1" />
  };

  const style = styles[status] || 'bg-stone-100 text-stone-700 border-stone-200';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>
      {icons[status]}
      {status}
    </span>
  );
}
