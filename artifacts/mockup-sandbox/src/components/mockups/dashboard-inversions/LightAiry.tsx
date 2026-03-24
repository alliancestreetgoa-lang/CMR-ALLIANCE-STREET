import React from "react";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Activity, 
  Search, 
  Bell, 
  Settings,
  FileText,
  Briefcase,
  Menu,
  MoreHorizontal
} from "lucide-react";

export function LightAiry() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] font-sans flex overflow-hidden">
      
      {/* Sidebar - Minimal, thin, light gray */}
      <aside className="w-20 md:w-64 bg-[#F0F2F5] border-r border-[#E5E7EB] flex flex-col justify-between py-8">
        <div>
          <div className="px-6 mb-12 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#6B9080] text-white flex items-center justify-center font-semibold text-sm">
              A
            </div>
            <span className="font-medium text-sm hidden md:block tracking-wide">
              Alliance Street
            </span>
          </div>

          <nav className="flex flex-col gap-2 px-3 md:px-4">
            <SidebarItem icon={<Activity size={20} />} label="Overview" active />
            <SidebarItem icon={<Users size={20} />} label="Clients" />
            <SidebarItem icon={<Briefcase size={20} />} label="Tasks" />
            <SidebarItem icon={<FileText size={20} />} label="Reports" />
          </nav>
        </div>

        <div className="px-3 md:px-4">
          <SidebarItem icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Header - Clean, spacious */}
        <header className="px-10 py-8 flex justify-between items-center bg-transparent">
          <div>
            <h1 className="text-2xl font-light text-[#222222]">Overview</h1>
            <p className="text-sm text-[#888888] mt-1">Good morning, here's what's happening.</p>
          </div>
          
          <div className="flex items-center gap-6 text-[#777777]">
            <Search size={20} className="hover:text-[#333333] cursor-pointer transition-colors" />
            <div className="relative">
              <Bell size={20} className="hover:text-[#333333] cursor-pointer transition-colors" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#6B9080] rounded-full"></span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E2E8F0] overflow-hidden ml-2 border border-[#CBD5E1]">
              <img 
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        <div className="px-10 pb-20 max-w-6xl w-full mx-auto">
          
          {/* Sparse KPIs - Lots of breathing room, simple typography */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-x-12 gap-y-8 mt-4 mb-16">
            <div className="flex flex-col gap-2">
              <span className="text-[#888888] text-sm font-medium uppercase tracking-wider">Total Clients</span>
              <span className="text-4xl font-light text-[#222222]">5</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#888888] text-sm font-medium uppercase tracking-wider">Active Tasks</span>
              <span className="text-4xl font-light text-[#222222]">6</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#888888] text-sm font-medium uppercase tracking-wider">Done</span>
              <span className="text-4xl font-light text-[#6B9080]">3</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#888888] text-sm font-medium uppercase tracking-wider">Overdue</span>
              <span className="text-4xl font-light text-[#222222]">0</span>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            {/* Task Status - Simple Progress bar instead of chart */}
            <section className="col-span-2 flex flex-col gap-8">
              <div>
                <h2 className="text-lg font-medium text-[#333333] mb-6">Task Status Breakdown</h2>
                <div className="w-full">
                  <div className="flex justify-between text-sm text-[#666666] mb-3">
                    <span>6 Total Tasks</span>
                    <span className="font-medium">50% Completed</span>
                  </div>
                  
                  {/* Flat progress bar */}
                  <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#6B9080] transition-all" style={{ width: '50%' }} title="Completed: 3"></div>
                    <div className="h-full bg-[#A3B18A] transition-all opacity-60" style={{ width: '33.3%' }} title="In Process: 2"></div>
                    <div className="h-full bg-[#D1D5DB] transition-all" style={{ width: '16.7%' }} title="Not Started: 1"></div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex gap-6 mt-5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6B9080]"></span>
                      <span className="text-[#666666]">Completed (3)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#A3B18A] opacity-60"></span>
                      <span className="text-[#666666]">In Process (2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]"></span>
                      <span className="text-[#666666]">Not Started (1)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Activity - Clean list, whitespace separation */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-[#333333]">Recent Activity</h2>
                <button className="text-[#6B9080] text-sm font-medium hover:underline">View All</button>
              </div>
              
              <div className="flex flex-col gap-8">
                <ActivityItem 
                  user="uruj"
                  action="completed task"
                  target="Q3 Tax Preparation"
                  time="2h ago"
                />
                <ActivityItem 
                  user="preeti"
                  action="uploaded document"
                  target="Client Onboarding Form"
                  time="4h ago"
                />
                <ActivityItem 
                  user="john"
                  action="started working on"
                  target="Annual Audit Report"
                  time="Yesterday"
                />
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
      active ? "bg-[#E2E8F0] text-[#333333]" : "text-[#777777] hover:bg-[#E5E7EB] hover:text-[#333333]"
    }`}>
      <div className="flex-shrink-0">
        {icon}
      </div>
      <span className="hidden md:block text-sm font-medium">{label}</span>
    </div>
  );
}

function ActivityItem({ user, action, target, time }: { user: string, action: string, target: string, time: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-[#F3F4F6] text-[#6B9080] flex items-center justify-center font-medium text-xs flex-shrink-0 uppercase mt-0.5">
        {user.charAt(0)}
      </div>
      <div>
        <p className="text-sm text-[#333333] leading-relaxed">
          <span className="font-medium capitalize">{user}</span> {action} <span className="font-medium text-[#6B9080]">{target}</span>
        </p>
        <p className="text-xs text-[#999999] mt-1">{time}</p>
      </div>
    </div>
  );
}
