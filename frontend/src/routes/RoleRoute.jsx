
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const roleRoutes = {
      admin: "/admin",
      executive: "/executive",
      inside_sales: "/inside-sales",
      outside_sales: "/outside-sales",
    };

    return (
      <Navigate
        to={roleRoutes[user.role] || "/login"}
        replace
      />
    );
  }

  return <Outlet />;
}
