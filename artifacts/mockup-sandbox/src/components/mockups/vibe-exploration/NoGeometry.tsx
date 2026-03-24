import {
  Bell,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  FileText,
  MessageSquare,
  Users,
  Briefcase,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function NoGeometry() {
  return (
    <div className="min-h-screen bg-[#f6f8f6] font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AS</span>
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">Alliance Street</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center h-full space-x-1">
            <a href="#" className="h-14 px-4 flex items-center text-sm font-medium text-emerald-800 border-b-2 border-emerald-600">
              Dashboard
            </a>
            <a href="#" className="h-14 px-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Clients
            </a>
            <a href="#" className="h-14 px-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Tasks
            </a>
            <a href="#" className="h-14 px-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              HR
            </a>
            <a href="#" className="h-14 px-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Documents
            </a>
            <a href="#" className="h-14 px-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              VAT
            </a>
          </nav>
        </div>

        {/* Global Search & Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="relative h-8 w-8 text-gray-500 hover:text-gray-900">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </Button>

          <div className="h-5 w-px bg-gray-200 mx-1"></div>

          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 border-gray-200 text-gray-600 bg-white">
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Search className="h-4 w-4 mr-2" />
              Find Client
            </Button>
          </div>
        </div>

        {/* Top Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Active Tasks" 
            value="142" 
            trend="+12% from last week" 
            trendUp={true}
            icon={<Briefcase className="h-5 w-5 text-emerald-600" />}
          />
          <StatCard 
            title="Pending Documents" 
            value="28" 
            trend="Needs attention" 
            trendUp={false}
            icon={<FileText className="h-5 w-5 text-amber-500" />}
          />
          <StatCard 
            title="Client Messages" 
            value="5" 
            trend="2 urgent" 
            trendUp={false}
            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
          />
        </div>

        {/* Two-Column Split: 60/40 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column (60%): Task Table */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">Recent Tasks</h2>
              <Button variant="ghost" size="sm" className="text-emerald-600 font-medium">View All</Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs uppercase font-medium">
                  <tr>
                    <th className="px-5 py-3 font-medium">Task / Client</th>
                    <th className="px-5 py-3 font-medium">Assignee</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <TaskRow 
                    task="Q3 Tax Preparation" 
                    client="Acme Corp Ltd" 
                    assignee="Sarah Jenkins"
                    status="In Progress"
                    date="Oct 15"
                  />
                  <TaskRow 
                    task="Monthly Payroll" 
                    client="Globex Inc" 
                    assignee="Mike Ross"
                    status="Pending"
                    date="Oct 18"
                  />
                  <TaskRow 
                    task="VAT Return filing" 
                    client="Stark Industries" 
                    assignee="Sarah Jenkins"
                    status="Review"
                    date="Oct 20"
                  />
                  <TaskRow 
                    task="Annual Audit" 
                    client="Wayne Enterprises" 
                    assignee="David Chen"
                    status="Completed"
                    date="Oct 10"
                  />
                  <TaskRow 
                    task="Onboarding Setup" 
                    client="New Client LLC" 
                    assignee="Mike Ross"
                    status="In Progress"
                    date="Oct 22"
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column (40%): Activity Feed */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">Activity Feed</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-6 h-full">
              <ActivityItem 
                user="Sarah Jenkins" 
                action="completed task" 
                target="Q2 Tax Review for Stark Ind." 
                time="2 hours ago"
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              />
              <ActivityItem 
                user="System" 
                action="flagged a document" 
                target="Missing signature on Contract A" 
                time="4 hours ago"
                icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
              />
              <ActivityItem 
                user="Mike Ross" 
                action="uploaded file" 
                target="Globex_Q3_Financials.pdf" 
                time="5 hours ago"
                icon={<FileText className="h-4 w-4 text-blue-500" />}
              />
              <ActivityItem 
                user="David Chen" 
                action="added a note to" 
                target="Acme Corp Ltd" 
                time="Yesterday"
                icon={<MessageSquare className="h-4 w-4 text-gray-500" />}
              />
              <ActivityItem 
                user="New Client" 
                action="signed up via" 
                target="Client Portal" 
                time="Yesterday"
                icon={<Users className="h-4 w-4 text-purple-500" />}
              />
              
              <Button variant="ghost" className="w-full text-sm text-gray-500 mt-auto">
                Load more activity
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, trend, trendUp, icon }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-semibold text-gray-900 tracking-tight">{value}</div>
        <div className={`text-xs mt-2 ${trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, client, assignee, status, date }: any) {
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Review': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-5 py-4">
        <div className="font-medium text-gray-900">{task}</div>
        <div className="text-xs text-gray-500 mt-0.5">{client}</div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">
              {assignee.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600">{assignee}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge variant="outline" className={`font-normal ${getStatusColor(status)}`}>
          {status}
        </Badge>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end text-sm text-gray-500 gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {date}
        </div>
      </td>
    </tr>
  );
}

function ActivityItem({ user, action, target, time, icon }: any) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm text-gray-800 leading-snug">
          <span className="font-medium text-gray-900">{user}</span> {action} <span className="font-medium text-gray-900">{target}</span>
        </p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}
