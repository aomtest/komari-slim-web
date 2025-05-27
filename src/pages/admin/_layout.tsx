import { Outlet } from "react-router-dom";

import AdminPanelBar from "../../components/admin/AdminPanelBar";
import { Toaster } from "@/components/ui/sonner"
const AdminLayout = () => (
  <>
    <AdminPanelBar content={<Outlet />} />
    <Toaster />
  </>
);

export default AdminLayout;
