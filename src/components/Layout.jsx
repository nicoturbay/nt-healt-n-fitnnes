import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Salad, TrendingUp, ClipboardList, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workout',   icon: Dumbbell,        label: 'Workout'   },
  { to: '/nutrition', icon: Salad,           label: 'Nutrition' },
  { to: '/progress',  icon: TrendingUp,      label: 'Progress'  },
  { to: '/log',       icon: ClipboardList,   label: 'Log'       },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('nav-collapsed') === 'true' } catch { return false }
  })

  const toggle = () => setCollapsed(prev => {
    const next = !prev
    try { localStorage.setItem('nav-collapsed', String(next)) } catch {}
    return next
  })

  const sidebarW = collapsed ? 'w-16' : 'w-56'
  const mainML  = collapsed ? 'md:ml-16' : 'md:ml-56'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col ${sidebarW} border-r border-gray-900 fixed h-full z-10 transition-all duration-200 overflow-hidden`}>

        {/* Logo + collapse toggle */}
        <div className={`flex items-center border-b border-gray-900 h-14 flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-green-400 tracking-tight">NT Fitness</p>
              <p className="text-xs text-gray-600 mt-0.5">Health Dashboard</p>
            </div>
          )}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand nav' : 'Collapse nav'}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-2 flex-1 mt-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-green-500/10 text-green-400'
                    : 'text-gray-500 hover:text-white hover:bg-gray-900'
                }`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${mainML} pb-24 md:pb-8 transition-all duration-200`}>
        <div className="w-full px-6 pt-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-900 z-20">
        <div className="flex">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center pt-4 pb-6 gap-1.5 transition-colors ${
                  isActive ? 'text-green-400' : 'text-gray-600'
                }`
              }
            >
              <Icon size={26} />
              <span className="text-[11px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
