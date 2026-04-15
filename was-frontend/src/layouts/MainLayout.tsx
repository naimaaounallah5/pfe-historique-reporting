import { Outlet } from "react-router-dom";
import Sidebar from "../shared/views/Sidebar";
import TopBar from "../shared/views/TopBar";

const MainLayout = () => {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: "auto", background: "#f5f6fa" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;