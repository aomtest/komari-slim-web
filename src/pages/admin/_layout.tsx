import { Outlet } from "react-router-dom";

import AdminPanelBar from "../../components/admin/AdminPanelBar";
const AdminLayout = () => (
  <>
    <AdminPanelBar content={<Outlet />} />
  </>
);

export default AdminLayout;
