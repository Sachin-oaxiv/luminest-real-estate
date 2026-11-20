import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Login from "../pages/auth/Login.jsx";

import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import Announcements from "../pages/admin/Announcements.jsx";
import Employees from "../pages/admin/Employees.jsx";
import Customers from "../pages/admin/Customers.jsx";
import Assignments from "../pages/admin/Assignments.jsx";
import Activities from "../pages/admin/Activities.jsx";
import Media from "../pages/admin/Media.jsx";
import Reports from "../pages/admin/Reports.jsx";
import AttendanceManagement from "../pages/admin/AttendanceManagement.jsx";
import SpecialPermissions from "../pages/shared/SpecialPermissions.jsx";

import ExecutiveDashboard from "../pages/executive/ExecutiveDashboard.jsx";
import ExecutiveCustomers from "../pages/executive/ExecutiveCustomers.jsx";
import ExecutiveEmployees from "../pages/executive/ExecutiveEmployees.jsx";
import ExecutiveAssignments from "../pages/executive/ExecutiveAssignments.jsx";
import ExecutiveReports from "../pages/executive/ExecutiveReports.jsx";

import InsideSalesDashboard from "../pages/inside-sales/InsideSalesDashboard.jsx";
import MyCustomers from "../pages/inside-sales/MyCustomers.jsx";
import FollowUps from "../pages/inside-sales/FollowUps.jsx";
import MyVisits from "../pages/inside-sales/MyVisits.jsx";
import CallActivities from "../pages/inside-sales/CallActivities.jsx";
import InterestStatus from "../pages/inside-sales/InterestStatus.jsx";
import WhatsAppMessages from "../pages/inside-sales/WhatsAppMessages.jsx";
import InsideSalesPerformance from "../pages/inside-sales/InsideSalesPerformance.jsx";

import OutsideSalesDashboard from "../pages/outside-sales/OutsideSalesDashboard.jsx";
import VisitList from "../components/outside-sales/VisitList.jsx";
import VisitEvidence from "../pages/outside-sales/VisitEvidence.jsx";

import AdminLayout from "../layouts/AdminLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";

function AdminPlaceholder() {
  const location = useLocation();

  const sections = {
    "/admin/reports": "Reports",
  };

  const title = sections[location.pathname] || "Admin Section";

  return (
    <AdminLayout>
      <section className="panel">
        <h1>{title}</h1>
        <p>This section is ready for development.</p>
        <p>We will connect its functionality in the next steps.</p>
      </section>
    </AdminLayout>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        {/* ADMIN ROUTES */}
        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/employees" element={<AdminLayout><Employees /></AdminLayout>} />
          <Route path="/admin/customers" element={<AdminLayout><Customers /></AdminLayout>} />
          <Route path="/admin/assignments" element={<AdminLayout><Assignments /></AdminLayout>} />
          <Route path="/admin/activities" element={<AdminLayout><Activities /></AdminLayout>} />
          <Route path="/admin/media" element={<AdminLayout><Media /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/admin/attendance" element={<AdminLayout><AttendanceManagement /></AdminLayout>} />
          <Route path="/admin/announcements" element={<AdminLayout><Announcements /></AdminLayout>} />
          <Route path="/admin/special-permissions" element={<DashboardLayout><SpecialPermissions /></DashboardLayout>} />
        </Route>

        {/* EXECUTIVE ROUTES */}
        <Route element={<RoleRoute allowedRoles={["executive"]} />}>
          <Route
            path="/executive"
            element={<DashboardLayout><ExecutiveDashboard /></DashboardLayout>}
          />
          <Route
            path="/executive/customers"
            element={<DashboardLayout><ExecutiveCustomers /></DashboardLayout>}
          />
          <Route
            path="/executive/employees"
            element={<DashboardLayout><ExecutiveEmployees /></DashboardLayout>}
          />
          <Route
            path="/executive/assignments"
            element={<DashboardLayout><ExecutiveAssignments /></DashboardLayout>}
          />
          <Route
            path="/executive/reports"
            element={<DashboardLayout><ExecutiveReports /></DashboardLayout>}
          />
          <Route
            path="/executive/special-permissions"
            element={<DashboardLayout><SpecialPermissions /></DashboardLayout>}
          />
        </Route>

        {/* INSIDE SALES ROUTES */}
        <Route element={<RoleRoute allowedRoles={["inside_sales"]} />}>
          <Route
            path="/inside-sales"
            element={<DashboardLayout><InsideSalesDashboard /></DashboardLayout>}
          />

          <Route
            path="/inside-sales/customers"
            element={<DashboardLayout><MyCustomers /></DashboardLayout>}
          />

          <Route
            path="/inside-sales/follow-ups"
            element={<DashboardLayout><FollowUps /></DashboardLayout>}
          />

          <Route
            path="/inside-sales/visits"
            element={<DashboardLayout><MyVisits /></DashboardLayout>}
          />

          <Route
            path="/inside-sales/calls"
            element={<DashboardLayout><CallActivities /></DashboardLayout>}
          />

          <Route
            path="/inside-sales/interest-status"
            element={<DashboardLayout><InterestStatus /></DashboardLayout>}
          />
          <Route
            path="/inside-sales/messages"
            element={<DashboardLayout><WhatsAppMessages /></DashboardLayout>}
          />
          <Route
            path="/inside-sales/performance"
            element={<DashboardLayout><InsideSalesPerformance /></DashboardLayout>}
          />
        </Route>

        {/* OUTSIDE SALES ROUTES */}
        <Route element={<RoleRoute allowedRoles={["outside_sales"]} />}>
          <Route
            path="/outside-sales"
            element={<DashboardLayout><OutsideSalesDashboard /></DashboardLayout>}
          />

          <Route
            path="/outside-sales/visits"
            element={<DashboardLayout><VisitList /></DashboardLayout>}
          />

          <Route
            path="/outside-sales/evidence"
            element={<DashboardLayout><VisitEvidence /></DashboardLayout>}
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
