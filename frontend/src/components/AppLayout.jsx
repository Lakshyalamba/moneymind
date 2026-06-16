import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../styles/dashboard.css';

function AppLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
