import { Outlet } from "react-router-dom";
import DashboardTopbar from "../components/navigation/DashboardTopbar.jsx";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[var(--qms-bg)] text-slate-900 qms-light">
      <div className="max-w-[2000px] w-full mx-auto px-10 md:px-14 lg:px-[72px] py-2">
        <div className="qms-surface overflow-visible relative z-30">
          <DashboardTopbar />
        </div>
      </div>
      <div className="max-w-[2000px] w-full mx-auto px-4 md:px-8 mt-2 pb-8">
        <main className="bg-[var(--qms-bg)] min-h-[760px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
