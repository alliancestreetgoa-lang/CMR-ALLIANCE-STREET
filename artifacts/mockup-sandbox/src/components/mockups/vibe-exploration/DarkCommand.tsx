import { useState, useEffect } from "react";
import { 
  Activity, 
  AlertTriangle, 
  BarChart2, 
  Bell, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  FileText, 
  Hexagon, 
  LayoutDashboard, 
  LogOut, 
  MessageSquare, 
  Search, 
  Settings, 
  ShieldAlert, 
  Users, 
  Zap 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function DarkCommand() {
  const [time, setTime] = useState(new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Sidebar */}
      <aside className="w-[240px] bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="h-14 px-4 flex items-center border-b border-slate-800 gap-3">
          <div className="w-8 h-8 bg-cyan-500 flex items-center justify-center rounded-sm text-slate-950 font-bold font-['Space_Grotesk'] text-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            A
          </div>
          <div className="font-['Space_Grotesk'] font-bold text-sm tracking-widest text-slate-100 uppercase mt-0.5">
            Alliance Street
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
          <div className="text-[10px] font-['Space_Grotesk'] uppercase tracking-widest text-slate-500 mb-2 px-2">
            System Modules
          </div>
          <nav className="space-y-0.5">
            <NavItem icon={<LayoutDashboard size={14} />} label="Command Center" active />
            <NavItem icon={<Users size={14} />} label="Active Personnel" />
            <NavItem icon={<FileText size={14} />} label="Intelligence" />
            <NavItem icon={<Activity size={14} />} label="Live Operations" />
            <NavItem icon={<MessageSquare size={14} />} label="Communications" badge="3" />
          </nav>

          <div className="text-[10px] font-['Space_Grotesk'] uppercase tracking-widest text-slate-500 mt-6 mb-2 px-2">
            Infrastructure
          </div>
          <nav className="space-y-0.5">
            <NavItem icon={<BarChart2 size={14} />} label="Telemetry" />
            <NavItem icon={<ShieldAlert size={14} />} label="Security Protocol" badge="1" badgeAlert />
            <NavItem icon={<Settings size={14} />} label="System Config" />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center gap-3 hover:bg-slate-900/50 cursor-pointer transition-colors">
          <Avatar className="w-8 h-8 border border-slate-700 rounded-sm">
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
            <AvatarFallback className="bg-slate-800 text-xs rounded-sm">OP</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">Operative 7</div>
            <div className="text-[10px] text-slate-500 truncate">SYSADMIN_G_CL3</div>
          </div>
          <LogOut size={14} className="text-slate-500 hover:text-red-400" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-xs font-['Space_Grotesk'] uppercase tracking-wider text-slate-400">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Root</span>
            <ChevronRight size={12} className="text-slate-600" />
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Modules</span>
            <ChevronRight size={12} className="text-slate-600" />
            <span className="text-slate-100">Command Center</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="QUERY DATABASE..." 
                className="bg-slate-950 border border-slate-800 h-7 rounded-sm text-xs font-mono pl-8 pr-3 w-64 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all"
              />
            </div>
            
            <div className="font-mono text-[11px] text-cyan-400 bg-slate-950 px-2 py-1 rounded-sm border border-slate-800/80">
              SYS.T: {time}
            </div>
            
            <button className="relative text-slate-400 hover:text-slate-100 transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 custom-scrollbar">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-2xl font-['Space_Grotesk'] font-bold text-slate-100 tracking-tight">GLOBAL OPERATIONS</h1>
              <p className="text-xs font-mono text-slate-500 mt-1 uppercase">Node status: <span className="text-green-400">Nominal</span> | Sync: <span className="text-cyan-400">100%</span></p>
            </div>
            <div className="flex gap-2">
              <button className="h-7 px-3 bg-slate-800 border border-slate-700 text-xs font-['Space_Grotesk'] uppercase tracking-wider hover:bg-slate-700 transition-colors rounded-sm flex items-center gap-1.5">
                <Settings size={12} /> Config
              </button>
              <button className="h-7 px-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-['Space_Grotesk'] uppercase tracking-wider hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors rounded-sm flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <Zap size={12} className="fill-cyan-400/50" /> Execute Protocol
              </button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <StatCard 
              label="ACTIVE CONNECTIONS" 
              value="8,492" 
              trend="+12.4%" 
              trendUp 
              primary
            />
            <StatCard 
              label="NETWORK THROUGHPUT" 
              value="4.2 TB/s" 
              trend="-0.8%" 
              trendUp={false}
            />
            <StatCard 
              label="OPEN INCIDENTS" 
              value="14" 
              trend="-3" 
              trendUp 
              alert={true}
            />
            <StatCard 
              label="COMPLETION RATE" 
              value="99.9%" 
              trend="+0.1%" 
              trendUp
            />
            <StatCard 
              label="SYSTEM LOAD" 
              value="42%" 
              trend="+5%" 
              trendUp={false}
              progress={42}
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Task Table */}
            <div className="col-span-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-['Space_Grotesk'] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Hexagon size={12} className="text-cyan-500" />
                  Priority Task Queue
                </h2>
                <button className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300">VIEW ALL [142]</button>
              </div>
              
              <div className="bg-slate-950 border border-slate-800 rounded-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="py-2 px-3 text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-slate-500 font-medium">ID</th>
                      <th className="py-2 px-3 text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-slate-500 font-medium">Status</th>
                      <th className="py-2 px-3 text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-slate-500 font-medium">Directive</th>
                      <th className="py-2 px-3 text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-slate-500 font-medium">Assignee</th>
                      <th className="py-2 px-3 text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-slate-500 font-medium text-right">T-Minus</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono">
                    <TaskRow id="TSK-8992" status="critical" desc="Update core firewall rules across all regional nodes" assignee="SEC-OP-1" time="00:15:00" />
                    <TaskRow id="TSK-8991" status="active" desc="Deploy v2.4.1 patches to alpha cluster" assignee="SYS-OP-3" time="01:42:15" />
                    <TaskRow id="TSK-8988" status="pending" desc="Routine database defragmentation - sector 4" assignee="AUTO-SYS" time="04:00:00" />
                    <TaskRow id="TSK-8985" status="active" desc="Investigate anomaly in packet routing on node 72" assignee="NET-OP-2" time="05:12:30" />
                    <TaskRow id="TSK-8982" status="completed" desc="Weekly security audit complete" assignee="SEC-OP-4" time="--:--:--" />
                    <TaskRow id="TSK-8980" status="completed" desc="Backup rotation protocol initiated" assignee="AUTO-SYS" time="--:--:--" />
                    <TaskRow id="TSK-8979" status="completed" desc="User access review for Q3 finalized" assignee="ADM-OP-1" time="--:--:--" />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Log */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-['Space_Grotesk'] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity size={12} className="text-cyan-500" />
                  System Telemetry
                </h2>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-mono text-slate-500">LIVE</span>
                </div>
              </div>
              
              <div className="bg-slate-950 border border-slate-800 rounded-sm p-0 flex-1 overflow-hidden relative flex flex-col">
                <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none"></div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-[11px] font-mono">
                  <LogEntry time="14:32:01.442" type="INFO" msg="User authentication successful [OP-7]" />
                  <LogEntry time="14:31:42.109" type="WARN" msg="Latency spike detected on backbone link NYC-LON (142ms)" />
                  <LogEntry time="14:30:00.005" type="SYSTEM" msg="Cron job TSK-8980 [Backup] completed successfully" />
                  <LogEntry time="14:28:15.992" type="INFO" msg="Deploy hook triggered for microservice auth-api" />
                  <LogEntry time="14:25:33.111" type="ERROR" msg="Failed to connect to replica database db-read-03" />
                  <LogEntry time="14:25:33.150" type="INFO" msg="Failover initiated to db-read-04" />
                  <LogEntry time="14:25:35.820" type="INFO" msg="Failover complete, connections restored" />
                  <LogEntry time="14:22:10.040" type="INFO" msg="New client connection established from 192.168.1.104" />
                  <LogEntry time="14:20:00.000" type="SYSTEM" msg="Hourly snapshot initiated" />
                  <LogEntry time="14:15:42.331" type="INFO" msg="Configuration reload requested via API" />
                  <LogEntry time="14:15:43.010" type="INFO" msg="Configuration reloaded successfully" />
                </div>
                
                <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}} />
    </div>
  );
}

// Subcomponents

function NavItem({ icon, label, active, badge, badgeAlert }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, badgeAlert?: boolean }) {
  return (
    <a 
      href="#" 
      className={\`flex items-center gap-3 px-3 py-1.5 mx-1 rounded-sm text-xs font-['Space_Grotesk'] tracking-wide transition-all \${
        active 
          ? 'bg-slate-900/80 text-cyan-400 relative' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
      }\`}
    >
      {active && <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-cyan-500 rounded-r shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>}
      <span className={\`\${active ? 'opacity-100' : 'opacity-70'}\`}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <Badge variant="outline" className={\`text-[9px] h-4 px-1 min-w-[16px] flex items-center justify-center font-mono rounded-sm border \${
          badgeAlert ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'
        }\`}>
          {badge}
        </Badge>
      )}
    </a>
  );
}

function StatCard({ label, value, trend, trendUp, primary, alert, progress }: { label: string, value: string, trend: string, trendUp: boolean, primary?: boolean, alert?: boolean, progress?: number }) {
  return (
    <div className={\`bg-slate-800/80 border p-3 flex flex-col relative overflow-hidden rounded-sm \${
      primary ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 
      alert ? 'border-amber-500/30' : 'border-slate-700'
    }\`}>
      {primary && <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>}
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>}
      
      <div className="text-[10px] font-['Space_Grotesk'] uppercase tracking-widest text-slate-400 mb-1 z-10">{label}</div>
      <div className={\`text-2xl font-mono font-medium z-10 \${
        primary ? 'text-cyan-400 text-shadow-cyan' : 
        alert ? 'text-amber-400' : 'text-slate-100'
      }\`}>
        {value}
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-2 z-10">
        <div className={\`text-[10px] font-mono flex items-center gap-1 \${trendUp ? 'text-green-400' : 'text-slate-500'}\`}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
        {progress !== undefined && (
          <div className="w-12 h-1 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400" style={{ width: \`\${progress}%\` }}></div>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: \`
        .text-shadow-cyan {
          text-shadow: 0 0 10px rgba(6,182,212,0.3);
        }
      \`}} />
    </div>
  );
}

function TaskRow({ id, status, desc, assignee, time }: { id: string, status: 'critical' | 'active' | 'pending' | 'completed', desc: string, assignee: string, time: string }) {
  const statusConfig = {
    critical: { color: 'bg-red-500', text: 'text-red-400', label: 'CRITICAL', icon: AlertTriangle },
    active: { color: 'bg-cyan-500', text: 'text-cyan-400', label: 'IN PROGRESS', icon: Zap },
    pending: { color: 'bg-amber-500', text: 'text-amber-400', label: 'PENDING', icon: Clock },
    completed: { color: 'bg-green-500', text: 'text-green-500', label: 'COMPLETE', icon: CheckCircle2 },
  };
  
  const conf = statusConfig[status];
  const Icon = conf.icon;

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
      <td className="py-2.5 px-3 text-slate-300 group-hover:text-cyan-400 transition-colors">{id}</td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <span className={\`w-1.5 h-1.5 rounded-full \${conf.color} \${status === 'active' || status === 'critical' ? 'animate-pulse shadow-[0_0_5px_currentColor]' : ''}\`}></span>
          <span className={\`text-[10px] \${conf.text}\`}>{conf.label}</span>
        </div>
      </td>
      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[300px] font-sans text-xs">{desc}</td>
      <td className="py-2.5 px-3 text-slate-400 text-[10px]">{assignee}</td>
      <td className={\`py-2.5 px-3 text-right \${status === 'completed' ? 'text-slate-600' : 'text-slate-300'}\`}>{time}</td>
    </tr>
  );
}

function LogEntry({ time, type, msg }: { time: string, type: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM', msg: string }) {
  const typeColors = {
    INFO: 'text-cyan-400',
    WARN: 'text-amber-400',
    ERROR: 'text-red-400 bg-red-500/10 px-1 rounded-sm',
    SYSTEM: 'text-purple-400'
  };

  return (
    <div className="flex gap-2 hover:bg-slate-900/50 p-0.5 rounded-sm transition-colors cursor-default">
      <span className="text-slate-600 shrink-0">[{time}]</span>
      <span className={\`shrink-0 w-12 \${typeColors[type]}\`}>{type}</span>
      <span className="text-slate-300 break-words">{msg}</span>
    </div>
  );
}
