import { Cake, FileText } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/birthday-card', label: 'Thiệp sinh nhật', icon: Cake },
  { to: '/meeting-minutes', label: 'Biên bản cuộc họp', icon: FileText },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#050A1F] text-white lg:flex">
      <aside className="flex flex-col border-b border-white/10 bg-[#080e29] lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center border-b border-white/10 px-4 py-3 lg:block lg:px-5 lg:py-6">
          <img
            src="/brands/histaff-logo.png"
            alt="Logo sản phẩm HiStaff"
            className="h-9 w-auto max-w-[150px] object-contain lg:h-auto lg:w-full lg:max-w-none"
          />
        </div>
        <nav className="flex flex-1 gap-1 overflow-x-auto p-2 lg:flex-col lg:p-4">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-[#2B57F9] text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 lg:h-screen lg:overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
