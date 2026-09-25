import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

function Logo({ variant = 'default', size = 'md' }) {
  const sizeClass = size === 'md' ? 'w-32 h-auto' : 'w-24 h-auto';

  const variantClass =
    variant === 'white' ? 'brightness-0 invert' : '';

  return (
    <img
      src={logo}
      alt="MPRSS Logo"
      className={`${sizeClass} ${variantClass}`}
    />
  );
}
import {
  Menu, X, Cpu, Wrench, Calendar, Package, History,
  ArrowRight, Bell, LayoutDashboard, CheckCircle,
  TrendingUp, Shield, BarChart2,
  ChevronRight, Smartphone, Monitor, Zap, FileText,
  Users, Settings, Search, Download, Plus, Sparkles, AlertTriangle,
  Clock, Bike, MessageSquare, Star, LogOut
} from 'lucide-react';

// ─── Phone screen variants ────────────────────────────────────────────────────

function PhoneHeader({ title }) {
  return (
    <div className="bg-white px-3 py-1.5 border-b border-gray-100 flex items-center justify-between shrink-0">
      <div className="flex flex-col gap-[2px]">
        <div className="w-2.5 h-[1.5px] bg-gray-700 rounded-full" />
        <div className="w-2 h-[1.5px] bg-gray-700 rounded-full" />
        <div className="w-2.5 h-[1.5px] bg-gray-700 rounded-full" />
      </div>
      <p className="text-[8px] font-semibold text-gray-900">{title}</p>
      <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Bell className="w-2 h-2 text-gray-600" />
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="h-full bg-gray-50 overflow-hidden flex flex-col">
      <PhoneHeader title="Dashboard" />
      <div className="flex-1 overflow-hidden px-2 py-1.5 flex flex-col gap-1.5">

        {/* Active Motorcycle */}
        <div className="bg-[#0a0f1a] text-white rounded-xl p-2.5">
          <p className="text-[4.5px] tracking-[0.15em] uppercase text-slate-400 mb-0.5 font-semibold">Active Motorcycle</p>
          <p className="text-[9px] font-semibold leading-tight">Samurai 155i</p>
          <p className="text-[5px] text-slate-400 mt-0.5">NCR-4821 &bull; 2023 Model</p>
          <div className="grid grid-cols-2 gap-1 mt-1.5">
            <div className="bg-white/[0.06] rounded-lg px-2 py-1">
              <p className="text-[4px] uppercase tracking-widest text-slate-400 mb-0.5">Last Service</p>
              <p className="text-[5.5px] font-medium">Jan 15, 2026</p>
            </div>
            <div className="bg-white/[0.06] rounded-lg px-2 py-1">
              <p className="text-[4px] uppercase tracking-widest text-slate-400 mb-0.5">Next Due</p>
              <p className="text-[5.5px] font-medium">Mar 15, 2026</p>
            </div>
          </div>
        </div>

        {/* Current Service + Next Maintenance */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
            <p className="text-[4px] tracking-[0.15em] uppercase text-gray-400 mb-1 font-semibold">Current Service</p>
            <p className="text-[7px] font-semibold text-gray-900 leading-tight">Chain Adjustment</p>
            <p className="text-[4.5px] text-gray-500 mt-0.5 mb-1.5">Samurai 155i</p>
            <span className="text-[4px] px-1.5 py-0.5 rounded-full font-medium bg-gray-800 text-white">In Progress</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
            <p className="text-[4px] tracking-[0.15em] uppercase text-gray-400 mb-1 font-semibold">Next Maintenance</p>
            <div className="flex items-start gap-1">
              <div className="w-4 h-4 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Wrench className="w-2 h-2 text-gray-600" />
              </div>
              <div>
                <p className="text-[6.5px] font-semibold text-gray-900 leading-tight">Oil Change</p>
                <p className="text-[4.5px] text-gray-500 mt-0.5">Mar 15, 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-2 py-1.5">
          <p className="text-[4px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-semibold">Maintenance History</p>
          <div className="flex items-center divide-x divide-gray-100">
            <div className="flex items-center gap-1 pr-2">
              <CheckCircle className="w-2 h-2 text-gray-500 shrink-0" />
              <div>
                <p className="text-[7px] font-semibold text-gray-900 leading-none">3</p>
                <p className="text-[4px] text-gray-400 mt-0.5">Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2">
              <Wrench className="w-2 h-2 text-gray-500 shrink-0" />
              <div>
                <p className="text-[7px] font-semibold text-gray-900 leading-none">1</p>
                <p className="text-[4px] text-gray-400 mt-0.5">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-1 pl-2">
              <Calendar className="w-2 h-2 text-gray-500 shrink-0" />
              <div>
                <p className="text-[7px] font-semibold text-gray-900 leading-none">1</p>
                <p className="text-[4px] text-gray-400 mt-0.5">Upcoming</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[4px] tracking-[0.15em] uppercase text-gray-400 mb-1 font-semibold">Quick Actions</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { Icon: Plus, label: 'Request Service' },
              { Icon: Sparkles, label: 'AI Assistant' },
              { Icon: Package, label: 'Browse Parts' },
              { Icon: History, label: 'My Builds' },
            ].map(({ Icon, label }) => (
              <div key={label} className="bg-white rounded-lg border border-gray-100 shadow-sm p-1.5 flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-[#0a0f1a] rounded-md flex items-center justify-center shrink-0">
                  <Icon className="w-2 h-2 text-white" />
                </div>
                <span className="text-[5px] font-medium text-gray-800 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceScreen() {
  return (
    <div className="h-full bg-gray-50 overflow-hidden flex flex-col">
      <PhoneHeader title="My Services" />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-2 flex gap-0.5 shrink-0">
        {['Pending', 'Active', 'Completed'].map((tab, i) => (
          <div key={tab} className={`text-[5.5px] py-1.5 px-1.5 font-semibold border-b-[1.5px] ${
            i === 0 ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'
          }`}>{tab}</div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden px-2 py-1.5 flex flex-col gap-1.5">
        {/* Service Card 1 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[4.5px] bg-gray-100 text-gray-600 font-mono px-1.5 py-0.5 rounded font-semibold">REF-2026-001</span>
            <span className="text-[4px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">Under Review</span>
          </div>
          <p className="text-[7.5px] font-semibold text-gray-900 mb-0.5">Complete PMS</p>
          <p className="text-[4.5px] text-gray-500 mb-2">Samurai 155i &bull; Jan 20, 2026</p>
          {/* Status tracker */}
          <div className="flex items-center justify-between">
            {['Received', 'Review', 'Approved', 'Scheduled'].map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-0.5 flex-1">
                <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[4px] font-bold ${
                  i < 2 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < 2 ? '✓' : i + 1}
                </div>
                <p className={`text-[3.5px] text-center leading-tight ${i < 2 ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Service Card 2 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[4.5px] bg-gray-100 text-gray-600 font-mono px-1.5 py-0.5 rounded font-semibold">REF-2026-002</span>
            <span className="text-[4px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">Pending</span>
          </div>
          <p className="text-[7.5px] font-semibold text-gray-900 mb-0.5">Tire Replacement</p>
          <p className="text-[4.5px] text-gray-500">Samurai 155i &bull; Feb 5, 2026</p>
        </div>

        {/* Request button */}
        <div className="mt-auto">
          <div className="flex items-center justify-center gap-1 px-3 py-1.5 bg-[#0a0f1a] text-white rounded-lg">
            <Plus className="w-2 h-2" />
            <p className="text-[5.5px] font-medium">Request New Service</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartsScreen() {
  return (
    <div className="h-full bg-gray-50 overflow-hidden flex flex-col">
      <PhoneHeader title="AI Assistant" />
      <div className="flex-1 overflow-hidden px-2 py-1.5 flex flex-col gap-1.5">

        {/* Safety banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 flex items-start gap-1">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[5px] font-bold text-amber-900">Important Safety Notice</p>
            <p className="text-[4px] text-amber-700 leading-tight mt-0.5">Recommendations are based on your motorcycle specs. Consult a mechanic before applying changes.</p>
          </div>
        </div>

        {/* Mode selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <p className="text-[4.5px] text-gray-500 mb-1.5">Select Mode</p>
          <div className="grid grid-cols-2 gap-1">
            <div className="border-2 border-gray-800 bg-gray-50 rounded-lg p-1.5">
              <div className="flex items-center gap-0.5 mb-0.5">
                <Sparkles className="w-2 h-2 text-gray-800" />
                <p className="text-[5px] font-medium text-gray-900">Get Recommendations</p>
              </div>
              <p className="text-[3.5px] text-gray-500 leading-tight">AI-powered parts suggestions for your build</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-1.5">
              <div className="flex items-center gap-0.5 mb-0.5">
                <AlertTriangle className="w-2 h-2 text-gray-500" />
                <p className="text-[5px] font-medium text-gray-700">Evaluate Setup</p>
              </div>
              <p className="text-[3.5px] text-gray-400 leading-tight">Check compatibility and safety</p>
            </div>
          </div>
        </div>

        {/* Input form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <p className="text-[5.5px] font-medium text-gray-800 mb-1.5">Get Recommendations</p>
          <div className="space-y-1">
            <div>
              <p className="text-[4px] text-gray-500 mb-0.5">Motorcycle *</p>
              <div className="border border-gray-200 rounded-md px-1.5 py-1 flex items-center justify-between">
                <p className="text-[5.5px] text-gray-800">Samurai 155i</p>
                <ChevronRight className="w-2 h-2 text-gray-400" />
              </div>
            </div>
            <div>
              <p className="text-[4px] text-gray-500 mb-0.5">Goal *</p>
              <div className="border border-gray-200 rounded-md px-1.5 py-1 flex items-center justify-between">
                <p className="text-[5.5px] text-gray-400">Select your goal</p>
                <ChevronRight className="w-2 h-2 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="mt-2 bg-[#0a0f1a] text-white rounded-md py-1 flex items-center justify-center">
            <p className="text-[5.5px] font-semibold">Get Recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepairScreen() {
  return (
    <div className="h-full bg-gray-50 overflow-hidden flex flex-col">
      <PhoneHeader title="My Services" />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-2 flex gap-0.5 shrink-0">
        {['Pending', 'Active', 'Completed'].map((tab, i) => (
          <div key={tab} className={`text-[5.5px] py-1.5 px-1.5 font-semibold border-b-[1.5px] ${
            i === 1 ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'
          }`}>{tab}</div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden px-2 py-1.5 flex flex-col gap-1.5">
        {/* Active Service Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <div className="flex items-start justify-between mb-1.5">
            <div>
              <span className="text-[4.5px] bg-gray-100 text-gray-600 font-mono px-1.5 py-0.5 rounded font-semibold">SVC-2026-042</span>
              <p className="text-[7.5px] font-semibold text-gray-900 mt-1 mb-0.5">Chain Adjustment</p>
              <p className="text-[4.5px] text-gray-500">Samurai 155i</p>
            </div>
            <span className="text-[4px] px-1.5 py-0.5 rounded-full bg-gray-800 text-white font-semibold shrink-0">In Progress</span>
          </div>

          {/* Status tracker */}
          <div className="mt-1.5 pt-1.5 border-t border-gray-100">
            <p className="text-[4px] text-gray-400 uppercase tracking-widest mb-1.5">Status Tracker</p>
            <div className="space-y-1.5">
              {[
                { step: 'Request Received', done: true },
                { step: 'Mechanic Assigned', done: true },
                { step: 'In Progress', done: true },
                { step: 'Quality Check', done: false },
                { step: 'Ready for Pickup', done: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 text-[4px] font-bold ${
                    s.done ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}>
                    {s.done ? '✓' : i + 1}
                  </div>
                  <p className={`text-[5px] ${s.done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-gray-100">
            <p className="text-[4px] text-gray-400 uppercase tracking-widest mb-0.5">Assigned Mechanic</p>
            <p className="text-[5.5px] font-medium text-gray-900">Juan Dela Cruz</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phone frame wrapper ──────────────────────────────────────────────────────
function PhoneMockup({ screen, className = '' }) {
  return (
    <div className={`relative ${className}`} style={{ width: 180, height: 360 }}>
      <div className="absolute inset-0 rounded-[2rem] border-[3px] border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="h-5 bg-slate-900 flex items-center justify-center relative">
          <div className="w-14 h-3.5 bg-slate-800 rounded-b-xl" />
        </div>
        <div className="h-[calc(100%-20px)] overflow-hidden">
          {screen === 'dashboard' && <DashboardScreen />}
          {screen === 'service' && <ServiceScreen />}
          {screen === 'parts' && <PartsScreen />}
          {screen === 'repair' && <RepairScreen />}
        </div>
      </div>
    </div>
  );
}

// ─── Admin dashboard mockup ───────────────────────────────────────────────────
function AdminMockup() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Browser chrome */}
      <div className="bg-slate-200 rounded-t-xl px-4 py-2.5 flex items-center gap-3 border border-slate-300 border-b-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono">
          mprss.admin.app/dashboard
        </div>
      </div>

      {/* Dashboard window — bg-gray-50 matches the real AdminLayout */}
      <div className="bg-gray-50 border border-slate-300 rounded-b-xl overflow-hidden flex" style={{ height: 320 }}>

        {/* Sidebar — bg-gray-900 matches AdminLayout */}
        <div className="w-40 bg-gray-900 text-white flex-shrink-0 flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center shrink-0">
                <div className="w-3 h-3 border border-white/40 rounded-sm" />
              </div>
              <div>
                <p className="text-[11px] font-semibold leading-tight">MPRSS</p>
                <p className="text-[8.5px] text-gray-400 leading-tight">Admin</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-hidden">
            {[
              { Icon: LayoutDashboard, label: 'Dashboard', active: true },
              { Icon: Users, label: 'Customers', active: false },
              { Icon: Wrench, label: 'Services', active: false },
              { Icon: Calendar, label: 'Schedules', active: false },
              { Icon: Package, label: 'Inventory', active: false },
              { Icon: Bike, label: 'Motorcycle Deletions', active: false },
              { Icon: AlertTriangle, label: 'AI Safety Alerts', active: false },
              { Icon: MessageSquare, label: 'Messages', active: false },
              { Icon: Star, label: 'Feedback & Community', active: false },
            ].map(({ Icon, label, active }) => (
              <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md ${
                active ? 'bg-white text-black' : 'text-gray-400'
              }`}>
                <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="text-[8px] truncate">{label}</span>
              </div>
            ))}
          </nav>
          <div className="px-2 py-2 border-t border-gray-700">
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-gray-400">
              <LogOut className="w-2.5 h-2.5" />
              <span className="text-[8px]">Logout</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header — bg-white matches AdminLayout header */}
          <header className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">
                <Menu className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <h2 className="text-sm font-medium text-gray-900">Dashboard</h2>
            </div>
            <div className="relative w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100">
              <Bell className="w-3.5 h-3.5 text-gray-600" />
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-black rounded-full" />
            </div>
          </header>

          {/* Content area — p-3 matches real p-4 sm:p-6 scaled */}
          <main className="flex-1 overflow-hidden p-3 flex flex-col gap-2">

            {/* Operations overview — mirrors real grid grid-cols-1 lg:grid-cols-3 */}
            <div className="grid grid-cols-4 gap-2">

              {/* Featured: Active Services — bg-[#0a0f1a] matches real */}
              <div className="bg-[#0a0f1a] text-white rounded-xl p-2.5 flex flex-col justify-between">
                <div>
                  <p className="text-[6.5px] tracking-[0.12em] uppercase text-slate-400 mb-1.5 font-semibold">Active Services</p>
                  <p className="text-2xl font-bold leading-none mb-0.5">5</p>
                  <p className="text-[7.5px] text-slate-400">In workshop</p>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold">3</p>
                    <p className="text-[6.5px] text-slate-400 mt-0.5">Pending requests</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <Wrench className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Customers — bg-white border-gray-100 matches real */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users className="w-3 h-3 text-gray-600" />
                  </div>
                  <div className="flex items-center gap-0.5 text-[6.5px] text-gray-400">
                    <TrendingUp className="w-2 h-2" />
                    <span>Active</span>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-none">156</p>
                <p className="text-[7.5px] text-gray-400 mt-1">Registered customers</p>
              </div>

              {/* Low Stock — amber alert variant */}
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-2.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Package className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-[6.5px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Alert</span>
                </div>
                <p className="text-xl font-bold text-amber-600 leading-none">3</p>
                <p className="text-[7.5px] text-gray-400 mt-1">Items need reorder</p>
              </div>

              {/* AI Safety Alerts — bg-gray-800 text-white "New" badge */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="text-[6.5px] font-semibold bg-gray-800 text-white px-1.5 py-0.5 rounded-full">New</span>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-none">2</p>
                <p className="text-[7.5px] text-gray-400 mt-1">Safety alerts</p>
              </div>
            </div>

            {/* Service activity — two white panels side by side */}
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-hidden">

              {/* Pending Requests */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 shrink-0">
                  <Clock className="w-2.5 h-2.5 text-gray-500" />
                  <p className="text-[8.5px] font-semibold text-gray-800">Pending Requests</p>
                  <span className="ml-auto bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[7px] font-medium">3</span>
                </div>
                <div className="flex-1 overflow-hidden p-2 space-y-1.5">
                  {[
                    { name: 'Carlos Reyes', moto: 'Samurai 155i', service: 'Complete PMS', date: 'Jan 20' },
                    { name: 'Angela Santos', moto: 'Yamaha NMAX 155', service: 'Chain Adjustment', date: 'Jan 21' },
                    { name: 'Miguel Dela Cruz', moto: 'Kawasaki Ninja 400', service: 'Oil Change', date: 'Jan 22' },
                  ].map((r) => (
                    <div key={r.name} className="rounded-lg border border-gray-100 p-1.5">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <p className="text-[7.5px] font-semibold text-gray-900 truncate">{r.name}</p>
                        <span className="text-[6.5px] text-gray-400 shrink-0">{r.date}</span>
                      </div>
                      <p className="text-[6.5px] text-gray-500 truncate">{r.moto}</p>
                      <p className="text-[7px] text-gray-700 mt-0.5">{r.service}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Completed */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 shrink-0">
                  <CheckCircle className="w-2.5 h-2.5 text-gray-500" />
                  <p className="text-[8.5px] font-semibold text-gray-800">Recent Completed</p>
                </div>
                <div className="flex-1 overflow-hidden p-2 space-y-1.5">
                  {[
                    { name: 'Patricia Mendoza', moto: 'Honda Beat 110', service: 'Change Oil', cost: '₱450', stars: '★★★★★' },
                    { name: 'Marco Villanueva', moto: 'Suzuki Raider R150', service: 'Tire Replacement', cost: '₱1,200', stars: '★★★★' },
                    { name: 'Carlos Reyes', moto: 'Samurai 155i', service: 'Brake Service', cost: '₱650', stars: '★★★★★' },
                  ].map((r) => (
                    <div key={r.name + r.service} className="rounded-lg border border-gray-100 p-1.5">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <p className="text-[7.5px] font-semibold text-gray-900 truncate">{r.name}</p>
                        <span className="text-[6.5px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium shrink-0">Done</span>
                      </div>
                      <p className="text-[6.5px] text-gray-500 truncate">{r.moto}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[6.5px] text-amber-500">{r.stars}</span>
                        <span className="text-[7px] text-gray-600 font-medium">{r.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: 'About Us', id: 'about' },
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Mobile App', id: 'download' },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Logo variant="default" size="md" />

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium">
              {navLinks.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/admin/login"
                className="px-5 py-2 text-sm font-semibold bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] transition-colors"
              >
                Admin Login
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {label}
              </button>
            ))}
            <Link
              to="/admin/login"
              className="block mt-2 px-3 py-2 text-sm font-semibold bg-[#0a0f1a] text-white rounded-lg text-center"
              onClick={() => setMenuOpen(false)}
            >
              Admin Login
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0a0f1a]">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-[90vh] py-20 lg:py-0">

            {/* Left — text */}
            <div className="max-w-xl lg:py-32">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-medium tracking-wide">Motorcycle Management System</span>
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.02] mb-6"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.02em' }}
              >
                Smarter<br />Motorcycle<br />Maintenance<br />
                <span className="text-slate-400">Starts Here.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
                MPRSS helps motorcycle riders manage their motorcycles, discover AI-powered parts and performance recommendations, request services, and track their maintenance history.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => scrollToSection('download')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#0a0f1a] font-semibold rounded-lg hover:bg-slate-100 transition-colors text-sm"
                >
                  <Smartphone className="w-4 h-4" />
                  Explore the Mobile App
                </button>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/5 transition-colors text-sm"
                >
                  Admin Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right — motorcycle photo + phone */}
            <div className="relative flex items-center justify-center lg:justify-end lg:h-screen">
              {/* Photo container */}
              <div className="relative w-full max-w-sm lg:max-w-none lg:w-auto lg:h-full">
                <div
                  className="relative rounded-2xl lg:rounded-none overflow-hidden bg-slate-800"
                  style={{ height: 480 }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1709913472012-a0c243ca6cc9?w=700&h=900&fit=crop&auto=format"
                    alt="Motorcycle with headlights illuminated at night"
                    className="w-full h-full object-cover opacity-80"
                  />
                  {/* Left fade into hero bg */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a] via-[#0a0f1a]/20 to-transparent" />
                  {/* Bottom fade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent" />
                </div>

                {/* Phone mockup overlaid */}
                <div className="absolute -left-8 sm:-left-16 bottom-8 lg:bottom-12 drop-shadow-2xl">
                  <PhoneMockup screen="dashboard" />
                </div>

                {/* Floating status badge */}
                <div className="absolute right-0 top-12 bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 text-white shadow-xl max-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <p className="text-[9px] font-semibold">Service Complete</p>
                  </div>
                  <p className="text-[8px] text-slate-400">Samurai 155i &mdash; PMS done</p>
                </div>

                {/* Floating AI badge */}
                <div className="absolute right-0 bottom-28 bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 text-white shadow-xl max-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <p className="text-[9px] font-semibold">AI Recommendation</p>
                  </div>
                  <p className="text-[8px] text-slate-400">3 parts suggested for your bike</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform section ── */}
      <section id="about" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">System Architecture</p>
            <h2
              className="text-4xl sm:text-5xl font-black text-[#0a0f1a] leading-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              One System. Two Connected Platforms.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mobile App card */}
            <div className="bg-[#0a0f1a] rounded-2xl p-8 lg:p-10 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-6">
                  <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-xs text-slate-300 font-medium">For Customers</span>
                </div>
                <h3
                  className="text-3xl lg:text-4xl font-black mb-4 leading-tight"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Customer Mobile App
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Manage your motorcycle, receive AI-powered recommendations, request services, track repairs, and view your complete maintenance history — all from your phone.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Motorcycle registration & management',
                    'AI-powered parts & performance advice',
                    'Service scheduling with real-time calendar',
                    'Repair tracking & maintenance history',
                    'Parts catalog & community builds',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scrollToSection('download')}
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white border-b border-white/20 pb-0.5 hover:border-white transition-colors"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Admin System card */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 mb-6">
                <Monitor className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs text-slate-600 font-medium">For Administrators</span>
              </div>
              <h3
                className="text-3xl lg:text-4xl font-black text-[#0a0f1a] mb-4 leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Admin Web System
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Manage customers, motorcycles, service requests, appointments, inventory, repairs, and notifications from a full-featured web dashboard built for efficiency.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Customer & motorcycle management',
                  'Service request processing & repair tracking',
                  'Appointment scheduling dashboard',
                  'Parts inventory management',
                  'AI safety controls & feedback monitoring',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a0f1a] border-b-2 border-gray-300 pb-0.5 hover:border-gray-900 transition-colors"
                >
                  Admin Login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Capabilities</p>
            <h2
              className="text-4xl sm:text-5xl font-black text-[#0a0f1a]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Everything You Need to Manage<br />Motorcycle Maintenance
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Cpu,
                title: 'AI Parts & Performance Recommendations',
                desc: 'Intelligent suggestions for parts, upgrades, and maintenance based on your motorcycle model and usage patterns.',
              },
              {
                icon: Wrench,
                title: 'Motorcycle Management',
                desc: 'Register and manage multiple motorcycles with full specs, photos, and service records in one place.',
              },
              {
                icon: Calendar,
                title: 'Service Scheduling',
                desc: 'Book appointments with a real-time calendar showing available and fully booked dates at a glance.',
              },
              {
                icon: FileText,
                title: 'Repair Tracking',
                desc: 'Follow every step of your service request from submission to completion with live status updates.',
              },
              {
                icon: Package,
                title: 'Parts & Inventory Management',
                desc: 'Browse a comprehensive parts catalog with brand filtering, and let admins manage stock levels efficiently.',
              },
              {
                icon: History,
                title: 'Maintenance History',
                desc: 'Access your complete service history, past repairs, and upcoming maintenance schedule in one timeline.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group border border-gray-200 rounded-2xl p-7 hover:border-gray-400 hover:shadow-md transition-all duration-200"
              >
                <div className="w-11 h-11 border border-gray-200 rounded-xl flex items-center justify-center mb-5 group-hover:border-gray-400 transition-colors">
                  <Icon className="w-5 h-5 text-[#0a0f1a]" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-[#0a0f1a] mb-2 leading-snug">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#0a0f1a] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Process</p>
            <h2
              className="text-4xl sm:text-5xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              From Registration to Repair
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {[
              {
                step: '01',
                title: 'Add Your Motorcycle',
                desc: 'Register through the mobile app. Add your motorcycle details, specs, and documentation to your profile.',
                icon: Wrench,
              },
              {
                step: '02',
                title: 'Get Recommendations',
                desc: 'The AI Advisor analyzes your motorcycle and riding patterns to suggest parts and preventive maintenance.',
                icon: Cpu,
              },
              {
                step: '03',
                title: 'Request a Service',
                desc: 'Pick a service type and choose an available date from the live calendar. Submit your service request.',
                icon: Calendar,
              },
              {
                step: '04',
                title: 'Track Your Service',
                desc: 'Receive real-time updates as your motorcycle moves through the repair process. Get notified when it\'s ready.',
                icon: CheckCircle,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                {/* Connector line (desktop) */}
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-slate-700 z-0 -translate-x-6" style={{ width: 'calc(100% - 3rem)' }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-5xl font-black text-slate-800 leading-none"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {step}
                    </span>
                  </div>
                  <div className="w-9 h-9 border border-slate-700 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile App Showcase ── */}
      <section id="mobile-app" className="py-20 lg:py-28 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 mb-6">
                <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">Customer Mobile App</span>
              </div>
              <h2
                className="text-4xl sm:text-5xl font-black text-[#0a0f1a] leading-tight mb-6"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Your Motorcycle.<br />Your Service History.<br />In Your Hands.
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                The MPRSS customer app puts full control of your motorcycle maintenance in your pocket. Track every service, chat with an AI advisor, and schedule your next appointment — all without calling the shop.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Wrench, label: 'Motorcycle Dashboard', desc: 'See your bike\'s full profile and service history' },
                  { icon: Cpu, label: 'AI Parts Advisor', desc: 'Get tailored recommendations for your motorcycle' },
                  { icon: Calendar, label: 'Service Scheduling', desc: 'Book appointments on live availability calendar' },
                  { icon: CheckCircle, label: 'Repair Tracking', desc: 'Follow every step of your service in real time' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 bg-white">
                      <Icon className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 phone screens */}
            <div className="relative flex items-end justify-center gap-4 h-[420px]">
              <div className="translate-y-6 opacity-60">
                <PhoneMockup screen="repair" />
              </div>
              <div className="-translate-y-2 opacity-90">
                <PhoneMockup screen="service" />
              </div>
              <div className="-translate-y-8 z-10">
                <PhoneMockup screen="dashboard" />
              </div>
              <div className="translate-y-4 opacity-75">
                <PhoneMockup screen="parts" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── APK Download ── */}
      <section id="download" className="bg-[#0a0f1a] py-20 lg:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-6">
                <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-xs text-slate-300 font-medium">Android Application</span>
              </div>
              <h2
                className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Get the MPRSS<br />Mobile App
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
                Manage your motorcycle, get AI-powered parts and performance recommendations, request services, and track your maintenance from your phone.
              </p>
              <Link
                to="/splash"
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-white text-[#0a0f1a] font-semibold rounded-lg hover:bg-slate-100 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download APK
              </Link>
              <p className="text-xs text-slate-600 mt-4">Android &bull; Free download</p>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative" style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}>
                <PhoneMockup screen="dashboard" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Admin System Showcase ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 mb-6">
              <Monitor className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs text-slate-600 font-medium">Admin Web System</span>
            </div>
            <h2
              className="text-4xl sm:text-5xl font-black text-[#0a0f1a]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Powerful Tools for Motorcycle<br />Service Management
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              A comprehensive web dashboard for motorcycle shop administrators. Manage every aspect of your operation — from service requests to inventory — in one cohesive system.
            </p>
          </div>

          {/* Admin mockup */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <AdminMockup />
          </div>

          {/* Admin feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: Users, label: 'Customer Management' },
              { icon: Wrench, label: 'Service Requests' },
              { icon: Calendar, label: 'Schedules' },
              { icon: Package, label: 'Inventory' },
              { icon: Shield, label: 'AI Safety Controls' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm text-gray-700 font-medium">
                <Icon className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-[#0a0f1a] py-20 lg:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            The Future of Motorcycle<br />Maintenance Is Digital.
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-lg mx-auto leading-relaxed">
            MPRSS brings your motorcycle shop into the digital age with a connected platform for riders and administrators.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => scrollToSection('download')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#0a0f1a] font-semibold rounded-lg hover:bg-slate-100 transition-colors text-sm"
            >
              <Smartphone className="w-4 h-4" />
              Explore the Mobile App
            </button>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              Admin Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#060b14] border-t border-slate-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Logo variant="white" size="md" />
              <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-[180px]">
                Digital motorcycle management for riders and shops.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><button onClick={() => scrollToSection('mobile-app')} className="hover:text-white transition-colors">Mobile App</button></li>
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin System</Link></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About MPRSS</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Access</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span>&copy; 2026 MPRSS. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Motor Parts Recommendation and Service Scheduling System
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
