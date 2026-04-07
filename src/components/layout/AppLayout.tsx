import { Outlet } from "react-router-dom";
import DesktopSidebar from "./DesktopSidebar";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
