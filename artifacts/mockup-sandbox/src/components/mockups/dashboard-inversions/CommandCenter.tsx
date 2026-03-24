import React from 'react';
import { Terminal, Database, Activity, Users, FileText, CheckSquare, Zap, AlertTriangle } from 'lucide-react';

export function CommandCenter() {
  const kpis = [
    { label: 'CLIENTS', value: '5', trend: 'STABLE' },
    { label: 'TASKS', value: '6', trend: 'ACTIVE' },
    { label: 'DONE', value: '3', trend: 'TODAY' },
    { label: 'OVERDUE', value: '0', trend: 'CLEAR' },
    { label: 'EMPLOYEES', value: '8', trend: 'ONLINE' },
    { label: 'SYS_LOAD', value: '14%', trend: 'NOMINAL' },
    { label: 'NET_LATENCY', value: '24ms', trend: 'NOMINAL' },
  ];

  const tasks = [
    { id: 'TSK-0921', name: 'Q3 Tax Recon: Delta Corp', assignee: 'JDoe', status: 'green', due: '2023-10-15' },
    { id: 'TSK-0922', name: 'Payroll Run: Oct', assignee: 'SJones', status: 'yellow', due: '2023-10-18' },
    { id: 'TSK-0923', name: 'Audit Prep: Omega', assignee: 'JDoe', status: 'green', due: '2023-10-20' },
    { id: 'TSK-0924', name: 'Compliance Review', assignee: 'MKim', status: 'red', due: '2023-10-14' },
    { id: 'TSK-0925', name: 'Client Onboarding: Zeta', assignee: 'RSmith', status: 'yellow', due: '2023-10-22' },
    { id: 'TSK-0926', name: 'Expense Approvals', assignee: 'SJones', status: 'green', due: '2023-10-16' },
  ];

  const activityLog = [
    { time: '08:42:11', user: 'system', action: 'INITIATED DAILY BACKUP TO S3_ARCHIVE_01' },
    { time: '08:45:03', user: 'system', action: 'BACKUP COMPLETE. CHECKSUM VERIFIED.' },
    { time: '09:01:22', user: 'JDoe', action: 'AUTH_SUCCESS: FROM IP 192.168.1.104' },
    { time: '09:14:45', user: 'JDoe', action: 'UPDATE_RECORD: TSK-0921 STATUS -> IN_PROGRESS' },
    { time: '09:22:10', user: 'MKim', action: 'AUTH_FAILED: INVALID_TOKEN (x3)' },
    { time: '09:25:00', user: 'MKim', action: 'AUTH_SUCCESS: MFA_CHALLENGE_PASSED' },
    { time: '09:44:12', user: 'system', action: 'WARN: API_RATE_LIMIT_APPROACHING (SERVICE: G_DRIVE)' },
    { time: '10:05:33', user: 'SJones', action: 'EXPORT_DATA: PAYROLL_MASTER_Q3.CSV' },
  ];

  const workloads = [
    { user: 'JDoe', load: 85, active: 4, pending: 2 },
    { user: 'SJones', load: 60, active: 3, pending: 1 },
    { user: 'MKim', load: 95, active: 6, pending: 3 },
    { user: 'RSmith', load: 40, active: 2, pending: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#1E1E2E] text-[#A6ACCD] font-sans text-xs selection:bg-[#00D9FF] selection:text-[#1E1E2E] overflow-x-hidden">
      {/* Top Nav */}
      <header className="flex items-center justify-between border-b border-[#313244] bg-[#11111B] px-4 py-2">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-[#00D9FF] font-bold tracking-widest text-sm uppercase">
            <Terminal size={14} className="stroke-[2.5]" />
            <span>ASAP // COMMAND</span>
          </div>
          <nav className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em]">
            <a href="#" className="text-[#00D9FF] border-b border-[#00D9FF] pb-1 -mb-1">Ops_Center</a>
            <a href="#" className="hover:text-[#00D9FF] transition-colors pb-1 -mb-1">Task_Matrix</a>
            <a href="#" className="hover:text-[#00D9FF] transition-colors pb-1 -mb-1">Entities</a>
            <a href="#" className="hover:text-[#00D9FF] transition-colors pb-1 -mb-1">Personnel</a>
            <a href="#" className="hover:text-[#00D9FF] transition-colors pb-1 -mb-1">Sys_Logs</a>
          </nav>
        </div>
        <div className="flex items-center gap-5 text-[10px] font-mono tracking-widest">
          <div className="flex items-center gap-1.5 text-green-400">
            <div className="w-1.5 h-1.5 rounded-none bg-green-400 animate-pulse" />
            <span>SECURE_LINK</span>
          </div>
          <span className="text-[#6C7086]">NODE: US-E1-a</span>
          <span className="text-[#00D9FF]">UTC: 10:42:15</span>
        </div>
      </header>

      {/* KPI Ticker */}
      <div className="flex overflow-x-auto border-b border-[#313244] bg-[#181825] scrollbar-hide">
        {kpis.map((kpi, i) => (
          <div key={i} className="flex-1 min-w-[120px] flex flex-col border-r border-[#313244] last:border-r-0 px-4 py-2.5">
            <span className="text-[#6C7086] text-[9px] font-bold tracking-widest uppercase mb-1">{kpi.label}</span>
            <div className="flex items-end justify-between font-mono">
              <span className="text-sm font-bold text-[#00D9FF] leading-none">{kpi.value}</span>
              <span className="text-[9px] text-[#A6ACCD] leading-none">[{kpi.trend}]</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="p-3 grid grid-cols-12 gap-3 h-[calc(100vh-100px)]">
        
        {/* Left Column: Tasks */}
        <div className="col-span-8 flex flex-col gap-3 h-full">
          
          {/* Active Tasks Panel */}
          <div className="border border-[#313244] bg-[#11111B] flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between border-b border-[#313244] px-3 py-2 bg-[#181825]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00D9FF]">
                <CheckSquare size={12} />
                <span>Task_Execution_Queue</span>
              </div>
              <span className="text-[10px] font-mono text-[#6C7086]">SORT: DUE_ASC</span>
            </div>
            <div className="overflow-y-auto min-h-0">
              <table className="w-full text-left font-mono text-[11px] whitespace-nowrap border-collapse">
                <thead className="text-[#6C7086] border-b border-[#313244] sticky top-0 bg-[#11111B]">
                  <tr>
                    <th className="px-3 py-2 font-normal border-r border-[#313244]">STAT</th>
                    <th className="px-3 py-2 font-normal border-r border-[#313244]">ID</th>
                    <th className="px-3 py-2 font-normal border-r border-[#313244] w-full">TASK_DEF</th>
                    <th className="px-3 py-2 font-normal border-r border-[#313244]">ASSIGNEE</th>
                    <th className="px-3 py-2 font-normal">DUE_DATE</th>
                  </tr>
                </thead>
                <tbody className="text-[#A6ACCD]">
                  {tasks.map((task, i) => (
                    <tr key={i} className="border-b border-[#313244] hover:bg-[#181825] transition-none group cursor-pointer">
                      <td className="px-3 py-2 border-r border-[#313244] text-center">
                        <div className="inline-flex items-center justify-center">
                          <div className={`w-1.5 h-1.5 rounded-none ${
                            task.status === 'green' ? 'bg-green-500' :
                            task.status === 'yellow' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-[#313244] text-[#00D9FF] group-hover:bg-[#313244]/30">{task.id}</td>
                      <td className="px-3 py-2 border-r border-[#313244] group-hover:text-white truncate">{task.name}</td>
                      <td className="px-3 py-2 border-r border-[#313244] group-hover:bg-[#313244]/30">{task.assignee}</td>
                      <td className="px-3 py-2 text-[#6C7086]">{task.due}</td>
                    </tr>
                  ))}
                  {Array.from({length: 4}).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-[#313244]/30">
                      <td className="px-3 py-2 border-r border-[#313244]/30 text-transparent">-</td>
                      <td className="px-3 py-2 border-r border-[#313244]/30 text-transparent">-</td>
                      <td className="px-3 py-2 border-r border-[#313244]/30 text-transparent">-</td>
                      <td className="px-3 py-2 border-r border-[#313244]/30 text-transparent">-</td>
                      <td className="px-3 py-2 text-transparent">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Metrics & System Health */}
          <div className="grid grid-cols-2 gap-3 h-48 shrink-0">
            <div className="border border-[#313244] bg-[#11111B] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#313244] px-3 py-2 bg-[#181825]">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00D9FF]">
                  <Activity size={12} />
                  <span>Throughput_Metrics</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center gap-4 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6C7086]">TASKS_PER_HOUR</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#00D9FF]">14.2</span>
                    <div className="w-24 h-1 bg-[#313244]">
                      <div className="w-[60%] h-full bg-[#00D9FF]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6C7086]">AVG_COMPLETION</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#00D9FF]">4.1h</span>
                    <div className="w-24 h-1 bg-[#313244]">
                      <div className="w-[40%] h-full bg-[#00D9FF]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6C7086]">ERROR_RATE</span>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">0.8%</span>
                    <div className="w-24 h-1 bg-[#313244]">
                      <div className="w-[5%] h-full bg-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#313244] bg-[#11111B] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#313244] px-3 py-2 bg-[#181825]">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00D9FF]">
                  <Database size={12} />
                  <span>System_Nodes</span>
                </div>
              </div>
              <div className="p-4 flex-1 grid grid-cols-2 gap-4 font-mono text-[10px]">
                <div className="border border-[#313244] p-2 flex flex-col gap-1">
                  <span className="text-[#6C7086]">DB_PRIMARY</span>
                  <span className="text-green-400 font-bold">ONLINE (99.9%)</span>
                  <span className="text-[#00D9FF]">LAT: 12ms</span>
                </div>
                <div className="border border-[#313244] p-2 flex flex-col gap-1">
                  <span className="text-[#6C7086]">DB_REPLICA</span>
                  <span className="text-green-400 font-bold">SYNCED</span>
                  <span className="text-[#00D9FF]">LAG: 0ms</span>
                </div>
                <div className="border border-[#313244] p-2 flex flex-col gap-1">
                  <span className="text-[#6C7086]">AUTH_SERVICE</span>
                  <span className="text-green-400 font-bold">ONLINE</span>
                  <span className="text-[#00D9FF]">REQ/S: 45</span>
                </div>
                <div className="border border-[#313244] border-dashed p-2 flex flex-col gap-1 opacity-50">
                  <span className="text-[#6C7086]">WORKER_Q2</span>
                  <span className="text-yellow-400 font-bold">STANDBY</span>
                  <span className="text-[#6C7086]">IDLE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workload & Logs */}
        <div className="col-span-4 flex flex-col gap-3 h-full">
          
          {/* Resource Load */}
          <div className="border border-[#313244] bg-[#11111B]">
            <div className="flex items-center justify-between border-b border-[#313244] px-3 py-2 bg-[#181825]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00D9FF]">
                <Users size={12} />
                <span>Resource_Allocation</span>
              </div>
            </div>
            <div className="p-3 flex flex-col gap-4 font-mono text-[10px]">
              {workloads.map((work, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[#A6ACCD] font-bold">{work.user}</span>
                    <div className="flex gap-3">
                      <span className="text-[#6C7086]">A:{work.active} P:{work.pending}</span>
                      <span className={work.load > 85 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                        [{work.load}%]
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[#181825] border border-[#313244] flex overflow-hidden p-[1px]">
                    <div 
                      className={`h-full ${work.load > 85 ? 'bg-red-500' : work.load > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                      style={{ width: `${work.load}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Log */}
          <div className="border border-[#313244] bg-[#11111B] flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-[#313244] px-3 py-2 bg-[#181825]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00D9FF]">
                <FileText size={12} />
                <span>Sys_Event_Stream</span>
              </div>
              <span className="text-[10px] font-mono text-[#6C7086] animate-pulse">TAIL -F</span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-[#A6ACCD]">
              {activityLog.map((log, i) => (
                <div key={i} className="flex gap-3 mb-1.5 hover:bg-[#181825] px-1 py-0.5 -mx-1">
                  <span className="text-[#6C7086] shrink-0">[{log.time}]</span>
                  <span className={`${log.user === 'system' ? 'text-purple-400' : 'text-[#00D9FF]'} shrink-0 w-12`}>
                    {log.user}
                  </span>
                  <span className="text-[#6C7086] shrink-0">{'>'}</span>
                  <span className={`break-words ${
                    log.action.includes('WARN') ? 'text-yellow-400' :
                    log.action.includes('FAILED') ? 'text-red-400' : 
                    ''
                  }`}>
                    {log.action}
                  </span>
                </div>
              ))}
              {/* Fake historical logs to fill space */}
              <div className="opacity-50">
                <div className="flex gap-3 mb-1.5 px-1 py-0.5 -mx-1">
                  <span className="text-[#6C7086] shrink-0">[10:06:12]</span>
                  <span className="text-[#00D9FF] shrink-0 w-12">RSmith</span>
                  <span className="text-[#6C7086] shrink-0">{'>'}</span>
                  <span className="break-words">READ_RECORD: CL-003_PROFILE</span>
                </div>
                <div className="flex gap-3 mb-1.5 px-1 py-0.5 -mx-1">
                  <span className="text-[#6C7086] shrink-0">[10:07:44]</span>
                  <span className="text-purple-400 shrink-0 w-12">system</span>
                  <span className="text-[#6C7086] shrink-0">{'>'}</span>
                  <span className="break-words">CRON_JOB_EXECUTED: INVOICE_REMINDERS</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 items-center">
                <span className="text-[#00D9FF]">{'>'}</span>
                <span className="w-2 h-3 bg-[#00D9FF] animate-pulse" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CommandCenter;
