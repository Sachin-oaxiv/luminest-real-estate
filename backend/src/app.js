
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import employeeRoutes from "./modules/employees/employees.routes.js";
import customerRoutes from "./modules/customers/customers.routes.js";
import assignmentRoutes from "./modules/assignments/assignments.routes.js";
import callActivityRoutes from "./modules/call-activities/callActivities.routes.js";
import messageRoutes from "./modules/messages/messages.routes.js";
import visitRoutes from "./modules/visits/visits.routes.js";
import visitEvidenceRoutes from "./modules/visits/visitEvidence.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import announcementRoutes from "./modules/announcements/announcements.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import activitiesRoutes from "./modules/activities/activities.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import whatsappIntegrationRoutes from "./modules/whatsapp/whatsappIntegration.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import permissionRoutes from "./modules/permissions/permissions.routes.js";

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/permissions", permissionRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/call-activities", callActivityRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/visits", visitRoutes);
app.use("/api/v1/visit-evidence", visitEvidenceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/activities", activitiesRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use("/api/v1/whatsapp-integration", whatsappIntegrationRoutes);

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Real Estate API is running",
  });
});

export default app;
