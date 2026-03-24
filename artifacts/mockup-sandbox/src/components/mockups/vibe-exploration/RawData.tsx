import { 
  Activity, 
  BarChart3, 
  Briefcase, 
  ChevronRight, 
  Circle, 
  Clock, 
  FileText, 
  Folder, 
  Home, 
  Search, 
  Settings, 
  Users 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RawData() {
  const kpis = [
    { label: "REV_YTD", value: "$2.4M", trend: "+12.4%", status: "good" },
    { label: "ACTIVE_CLIENTS", value: "142", trend: "+3", status: "good" },
    { label: "OPEN_TASKS", value: "84", trend: "-12", status: "warning" },
    { label: "OVERDUE", value: "7", trend: "+2", status: "critical" },
    { label: "BILLABLE_HOURS", value: "1,240", trend: "+5%", status: "good" },
    { label: "AVG_MARGIN", value: "68%", trend: "-1%", status: "warning" },
  ];

  const clients = [
    { id: "CL-1042", name: "Acme Corp", industry: "Manufacturing", status: "Active", risk: "Low", lastTouch: "2h ago" },
    { id: "CL-1043", name: "Stark Industries", industry: "Defense", status: "Active", risk: "Med", lastTouch: "1d ago" },
    { id: "CL-1044", name: "Wayne Ent", industry: "Conglomerate", status: "Active", risk: "Low", lastTouch: "3d ago" },
    { id: "CL-1045", name: "Cyberdyne", industry: "Tech", status: "At Risk", risk: "High", lastTouch: "4h ago" },
    { id: "CL-1046", name: "Initech", industry: "Software", status: "Active", risk: "Low", lastTouch: "5d ago" },
    { id: "CL-1047", name: "Umbrella Corp", industry: "Pharma", status: "Active", risk: "High", lastTouch: "1h ago" },
    { id: "CL-1048", name: "Globex", industry: "Energy", status: "Inactive", risk: "Low", lastTouch: "2w ago" },
    { id: "CL-1049", name: "Soylent Corp", industry: "Food", status: "Active", risk: "Med", lastTouch: "1w ago" },
  ];

  const tasks = [
    { id: "TSK-8901", title: "Q3 Tax Reconciliation", client: "Acme Corp", assignee: "J. Doe", due: "Today", status: "In Progress", priority: "High" },
    { id: "TSK-8902", title: "Payroll Setup", client: "Stark Ind", assignee: "M. Smith", due: "Tomorrow", status: "Not Started", priority: "Med" },
    { id: "TSK-8903", title: "Audit Prep 2023", client: "Wayne Ent", assignee: "A. Wong", due: "In 3 days", status: "Review", priority: "High" },
    { id: "TSK-8904", title: "Compliance Filing", client: "Cyberdyne", assignee: "J. Doe", due: "Overdue", status: "Blocked", priority: "Critical" },
    { id: "TSK-8905", title: "Benefits Renewal", client: "Initech", assignee: "S. Lee", due: "Next Week", status: "Not Started", priority: "Low" },
    { id: "TSK-8906", title: "Vendor Onboarding", client: "Umbrella Corp", assignee: "M. Smith", due: "Tomorrow", status: "In Progress", priority: "Med" },
    { id: "TSK-8907", title: "Expense Audit", client: "Globex", assignee: "A. Wong", due: "Next Week", status: "Not Started", priority: "Low" },
    { id: "TSK-8908", title: "Financial Projections", client: "Soylent Corp", assignee: "J. Doe", due: "Today", status: "Review", priority: "High" },
  ];

  const activityLog = [
    { time: "10:42:05", user: "system", action: "BATCH_PROC_COMPLETE", target: "payroll_run_04", status: "OK" },
    { time: "10:38:12", user: "jdoe", action: "STATUS_UPDATE", target: "TSK-8901", status: "OK" },
    { time: "10:15:00", user: "system", action: "API_SYNC_FAILED", target: "bank_feed_chase", status: "ERR" },
    { time: "09:55:22", user: "msmith", action: "DOC_UPLOAD", target: "CL-1043_w9.pdf", status: "OK" },
    { time: "09:30:11", user: "awong", action: "CLIENT_MEETING", target: "CL-1044", status: "OK" },
    { time: "09:05:44", user: "system", action: "AUTO_BILLING_RUN", target: "sub_tier_2", status: "OK" },
    { time: "08:45:10", user: "slee", action: "LOGIN", target: "auth_service", status: "OK" },
    { time: "08:00:00", user: "system", action: "DAILY_BACKUP", target: "db_main", status: "OK" },
  ];

  const StatusDot = ({ status }: { status: "good" | "warning" | "critical" | string }) => {
    let color = "bg-gray-400";
    if (status === "good" || status === "Active" || status === "OK" || status === "Low") color = "bg-emerald-500";
    if (status === "warning" || status === "At Risk" || status === "Med" || status === "In Progress" || status === "Review") color = "bg-amber-500";
    if (status === "critical" || status === "Inactive" || status === "ERR" || status === "High" || status === "Blocked" || status === "Overdue") color = "bg-red-500";
    
    return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
  };

  return (
    <div className="flex h-screen w-full bg-white text-[#111] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-[200px] flex-shrink-0 bg-gray-900 text-gray-300 border-r border-gray-800 flex flex-col">
        <div className="p-2 border-b border-gray-800 flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
          <span className="text-xs font-mono font-bold text-white tracking-widest">ERP_SYS_V2</span>
        </div>
        
        <div className="p-2 border-b border-gray-800">
          <div className="flex items-center gap-2 bg-gray-800 text-gray-400 p-1 text-xs font-mono">
            <Search className="w-3 h-3" />
            <input 
              type="text" 
              placeholder="CMD+K TO SEARCH" 
              className="bg-transparent border-none outline-none w-full placeholder:text-gray-500 uppercase tracking-wider text-[10px]"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-[1px]">
            {[
              { icon: Home, label: "DASHBOARD", active: true },
              { icon: Users, label: "CLIENT_DB", active: false },
              { icon: FileText, label: "LEDGER", active: false },
              { icon: Clock, label: "TIME_TRACK", active: false },
              { icon: Folder, label: "DOCUMENTS", active: false },
              { icon: Activity, label: "REPORTS", active: false },
              { icon: Briefcase, label: "HR_SYSTEM", active: false },
            ].map((item, i) => (
              <li key={i}>
                <a 
                  href="#" 
                  className={`flex items-center gap-2 px-2 py-1 text-xs font-mono ${
                    item.active ? "bg-gray-800 text-white" : "hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  <span className="tracking-wider text-[10px]">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 border-t border-gray-800 text-[10px] font-mono text-gray-500">
          <div>SYS_STATUS: ONLINE</div>
          <div className="flex items-center gap-1 mt-1">
            <StatusDot status="good" /> ALL SYSTEMS GO
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Top KPI Strip - Fixed height */}
        <div className="h-[60px] flex-shrink-0 border-b border-gray-200 flex items-center px-4 overflow-x-auto bg-gray-50">
          <div className="flex items-center space-x-8">
            {kpis.map((kpi, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{kpi.label}</span>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-sm font-semibold">{kpi.value}</span>
                  <span className={`text-[10px] ${kpi.status === 'good' ? 'text-emerald-600' : kpi.status === 'warning' ? 'text-amber-600' : 'text-red-600'}`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2x2 Grid Area */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 bg-gray-200 gap-[1px] min-h-0">
          
          {/* Top Left: Client List */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">CLIENT_ROSTER</span>
              <span className="text-[10px] font-mono text-gray-400 mr-1">T_RECS: 142</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e5e7eb] z-10">
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="py-1 px-2 font-normal">ID</th>
                    <th className="py-1 px-2 font-normal">NAME</th>
                    <th className="py-1 px-2 font-normal">INDUSTRY</th>
                    <th className="py-1 px-2 font-normal">RISK</th>
                    <th className="py-1 px-2 font-normal">L_TOUCH</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {clients.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 h-7">
                      <td className="py-0 px-2 text-gray-500">{c.id}</td>
                      <td className="py-0 px-2 font-sans">{c.name}</td>
                      <td className="py-0 px-2 font-sans text-gray-600">{c.industry}</td>
                      <td className="py-0 px-2 flex items-center gap-1 mt-1">
                        <StatusDot status={c.risk} />
                        <span className="text-[10px]">{c.risk}</span>
                      </td>
                      <td className="py-0 px-2 text-gray-500">{c.lastTouch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Right: Tasks */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">ACTIVE_TASKS</span>
              <span className="text-[10px] font-mono text-gray-400 mr-1">T_RECS: 84</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e5e7eb] z-10">
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="py-1 px-2 font-normal">ID</th>
                    <th className="py-1 px-2 font-normal">TITLE</th>
                    <th className="py-1 px-2 font-normal">CLIENT</th>
                    <th className="py-1 px-2 font-normal">PRIORITY</th>
                    <th className="py-1 px-2 font-normal">DUE</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {tasks.map((t, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 h-7">
                      <td className="py-0 px-2 text-gray-500">{t.id}</td>
                      <td className="py-0 px-2 font-sans truncate max-w-[150px]">{t.title}</td>
                      <td className="py-0 px-2 font-sans text-gray-600 truncate max-w-[100px]">{t.client}</td>
                      <td className="py-0 px-2">
                        <span className={`px-1 py-[2px] rounded text-[9px] uppercase ${
                          t.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          t.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                          t.priority === 'Med' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className={`py-0 px-2 ${t.due === 'Overdue' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{t.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Left: Financial/HR Summary Placeholder (Or more dense tables) */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">WORKFORCE_METRICS</span>
              <span className="text-[10px] font-mono text-gray-400 mr-1">DEPTS: 4</span>
            </div>
            <div className="flex-1 overflow-auto p-2">
               {/* Just a dense list of key-value pairs representing HR/Finance data */}
               <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                 <div className="border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 mb-2">DEPT: ENGINEERING</div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">HEADCOUNT</span><span>24</span></div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">UTILIZATION</span><span className="text-emerald-600">92%</span></div>
                    <div className="flex justify-between py-1"><span className="text-gray-600">OPEN_REQS</span><span>3</span></div>
                 </div>
                 <div className="border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 mb-2">DEPT: CONSULTING</div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">HEADCOUNT</span><span>42</span></div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">UTILIZATION</span><span className="text-amber-600">78%</span></div>
                    <div className="flex justify-between py-1"><span className="text-gray-600">OPEN_REQS</span><span>1</span></div>
                 </div>
                 <div className="border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 mb-2">DEPT: SUPPORT</div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">HEADCOUNT</span><span>18</span></div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">SLA_BREACHES</span><span className="text-red-600">4</span></div>
                    <div className="flex justify-between py-1"><span className="text-gray-600">AVG_RES_TIME</span><span>1.2h</span></div>
                 </div>
                 <div className="border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 mb-2">SYS_RESOURCE_USAGE</div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">DB_LOAD</span><span>42%</span></div>
                    <div className="flex justify-between border-b border-gray-100 py-1"><span className="text-gray-600">MEM_UTIL</span><span>88%</span></div>
                    <div className="flex justify-between py-1"><span className="text-gray-600">API_LATENCY</span><span>45ms</span></div>
                 </div>
               </div>
            </div>
          </div>

          {/* Bottom Right: Activity Log */}
          <div className="bg-white flex flex-col min-h-0 overflow-hidden">
            <div className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600 ml-1">SYSTEM_EVENT_LOG</span>
              <span className="text-[10px] font-mono text-gray-400 mr-1">LIVE</span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <tbody className="font-mono">
                  {activityLog.map((log, i) => (
                    <tr key={i} className="border-b border-gray-200/50 hover:bg-gray-100 h-6 text-[10px]">
                      <td className="py-0 px-2 text-gray-400 w-16">{log.time}</td>
                      <td className="py-0 px-2 font-bold w-16">{log.user}</td>
                      <td className="py-0 px-2 text-blue-600">{log.action}</td>
                      <td className="py-0 px-2 text-gray-600">{log.target}</td>
                      <td className="py-0 px-2 text-right">
                        <span className={`px-1 rounded ${log.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
