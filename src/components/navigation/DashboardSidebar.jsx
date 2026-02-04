import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "Create Coin", icon: "C", to: "/create" },
  { label: "Funders Points", icon: "F", to: "/dashboard" },
];

function NavItem({ item, forceActive = false }) {
  const base =
    "flex shrink-0 items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition";
  if (item.to) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `${base} ${
            isActive || forceActive
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-100"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-semibold ${
                isActive || forceActive
                  ? "bg-blue-100 text-blue-700"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </>
        )}
      </NavLink>
    );
  }
  const inactiveClass = "text-slate-500 hover:bg-slate-100";
  const activeClass = "bg-blue-50 text-blue-700";
  return (
    <button
      className={`${base} ${forceActive ? activeClass : inactiveClass}`}
      type="button"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-semibold ${
          forceActive ? "bg-blue-100 text-blue-700" : "bg-blue-50 text-blue-600"
        }`}
      >
        {item.icon}
      </span>
      {item.label}
    </button>
  );
}

export default function DashboardSidebar() {
  const location = useLocation();
  const isCreateActive =
    location.pathname === "/" || location.pathname.startsWith("/create");

  return (
    <aside className="qms-surface w-full lg:w-[240px] max-h-[calc(100vh-160px)] overflow-y-auto">
      <div className="hidden lg:flex flex-col h-full px-4 py-6 gap-2">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            forceActive={item.label === "Create Coin" && isCreateActive}
          />
        ))}
      </div>
      <div className="flex lg:hidden gap-2 overflow-x-auto px-4 py-4">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            forceActive={item.label === "Create Coin" && isCreateActive}
          />
        ))}
      </div>
    </aside>
  );
}
