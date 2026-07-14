import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Salad, TrendingUp, ClipboardList } from 'lucide-react'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workout',    icon: Dumbbell,         label: 'Workout'   },
  { to: '/nutrition',  icon: Salad,            label: 'Nutrition' },
  { to: '/progress',   icon: TrendingUp,       label: 'Progress'  },
  { to: '/log',        icon: ClipboardList,    label: 'Log'       },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-gray-900 p-4 gap-1 fixed h-full z-10">
        <div className="px-2 py-3 mb-4">
          <p className="text-sm font-bold text-green-400 tracking-tight">NT Fitness</p>
          <p className="text-xs text-gray-600 mt-0.5">Health Dashboard</p>
        </div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-500/10 text-green-400'
                  : 'text-gray-500 hover:text-white hover:bg-gray-900'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-24 md:pb-8">
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
                `flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
                  isActive ? 'text-green-400' : 'text-gray-600'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
