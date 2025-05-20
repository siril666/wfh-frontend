import { Outlet } from "react-router-dom";
import Sidebar from "../nav/Sidebar";

const DashboardLayout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 ">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
