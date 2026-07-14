import { NavLink, Outlet } from 'react-router-dom'
import { Dumbbell, BookOpen, Apple, TrendingUp, Camera } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Today', icon: Dumbbell },
  { to: '/log', label: 'Log', icon: BookOpen },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/photos', label: 'Photos', icon: Camera },
]

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 p-4 fixed h-full">
        <div className="mb-8 mt-2">
          <span className="text-green-400 font-bold text-xl tracking-tight">NT Fitness</span>
          <p className="text-gray-500 text-xs mt-0.5">Track. Train. Improve.</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500/10 text-green-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex md:hidden z-50">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-green-400' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
