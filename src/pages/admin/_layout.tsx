import { Outlet } from "react-router-dom";

import AdminPanelBar from "../../components/admin/AdminPanelBar";
import { AccountProvider } from "@/contexts/AccountContext";
const AdminLayout = () => (
  <>
    <AccountProvider>
      <AdminPanelBar content={<Outlet />} />
    </AccountProvider>
  </>
);

export default AdminLayout;
