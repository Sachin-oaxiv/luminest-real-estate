import Attendance from "./attendance.model.js";
import User from "../../models/User.js";
import { updateAttendanceLocation } from "./attendance.service.js";

const TIME_ZONE = "Asia/Kolkata";
const SHIFT_START_MINUTES = 9 * 60 + 30;
const SHIFT_END_MINUTES = 18 * 60 + 30;

function istDateStart(value) {
  return new Date(`${value}T00:00:00.000+05:30`);
}

function istDateEndExclusive(value) {
  const start = istDateStart(value);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

function localDateKey(value) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function minutesSinceMidnight(value) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function buildReportRows(records, users, now) {
  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const grouped = new Map();

  for (const record of records) {
    const employee = usersById.get(String(record.employee?._id || record.employee));
    if (!employee) continue;
    const date = localDateKey(record.loginAt);
    const key = `${employee._id}:${date}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        employeeId: String(employee._id),
        employeeName: employee.name,
        employeeEmail: employee.email,
        role: employee.role,
        date,
        firstLogin: record.loginAt,
        lastLogout: record.logoutAt || null,
        sessions: 0,
        workedMinutes: 0,
        active: false,
      });
    }
    const row = grouped.get(key);
    row.sessions += 1;
    if (new Date(record.loginAt) < new Date(row.firstLogin)) row.firstLogin = record.loginAt;
    if (record.logoutAt && (!row.lastLogout || new Date(record.logoutAt) > new Date(row.lastLogout))) row.lastLogout = record.logoutAt;
    const end = record.logoutAt || now;
    row.workedMinutes += minutesBetween(record.loginAt, end);
    if (record.status === "active" && !record.logoutAt) row.active = true;
  }

  return [...grouped.values()].map((row) => {
    const loginMinutes = minutesSinceMidnight(row.firstLogin);
    const logoutMinutes = row.lastLogout ? minutesSinceMidnight(row.lastLogout) : null;
    const lateMinutes = Math.max(0, loginMinutes - SHIFT_START_MINUTES);
    const earlyMinutes = logoutMinutes === null ? 0 : Math.max(0, SHIFT_END_MINUTES - logoutMinutes);
    return {
      ...row,
      firstLogin: row.firstLogin,
      lastLogout: row.lastLogout,
      workedDuration: formatDuration(row.workedMinutes),
      lateMinutes,
      lateBy: lateMinutes ? formatDuration(lateMinutes) : "—",
      earlyMinutes,
      earlyBy: earlyMinutes ? formatDuration(earlyMinutes) : "—",
      attendanceStatus: row.active ? "Active" : "Logged out",
      punctuality: lateMinutes > 0 ? "Late" : "On time",
      departure: row.active ? "In progress" : (earlyMinutes > 0 ? "Early" : "On time"),
    };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName));
}

export const pingLocation = async (req, res) => {
  const latitude = Number(req.headers["x-user-latitude"]);
  const longitude = Number(req.headers["x-user-longitude"]);
  const attendanceId = req.auth?.attendanceId;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !attendanceId) {
    return res.status(400).json({ success: false, message: "Current GPS location is required." });
  }

  const attendance = await updateAttendanceLocation(attendanceId, latitude, longitude);
  if (!attendance) {
    return res.status(401).json({ success: false, message: "Your attendance session is no longer active. Please log in again." });
  }

  return res.status(200).json({ success: true, message: "Location verified." });
};

export const getAdminAttendanceReport = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Administrator access is required." });
    }

    const today = localDateKey(new Date());
    const from = req.query.from || today;
    const to = req.query.to || today;
    const employeeId = req.query.employeeId || "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
      return res.status(400).json({ success: false, message: "Please provide a valid date range." });
    }
    if (employeeId && !/^[a-f\d]{24}$/i.test(employeeId)) {
      return res.status(400).json({ success: false, message: "Invalid employee filter." });
    }

    const [users, records] = await Promise.all([
      User.find({ role: { $in: ["executive", "inside_sales", "outside_sales"] } })
        .select("name email role isActive")
        .sort({ name: 1 })
        .lean(),
      Attendance.find({
        loginAt: { $gte: istDateStart(from), $lt: istDateEndExclusive(to) },
        ...(employeeId ? { employee: employeeId } : {}),
      })
        .populate("employee", "name email role")
        .sort({ loginAt: -1 })
        .lean(),
    ]);

    const reportRows = buildReportRows(records, users, new Date());
    const employeeRows = reportRows.reduce((map, row) => {
      if (!map.has(row.employeeId)) {
        map.set(row.employeeId, {
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          employeeEmail: row.employeeEmail,
          role: row.role,
          daysPresent: 0,
          lateDays: 0,
          earlyDepartures: 0,
          totalWorkedMinutes: 0,
          sessions: 0,
        });
      }
      const item = map.get(row.employeeId);
      item.daysPresent += 1;
      item.lateDays += row.lateMinutes > 0 ? 1 : 0;
      item.earlyDepartures += row.earlyMinutes > 0 ? 1 : 0;
      item.totalWorkedMinutes += row.workedMinutes;
      item.sessions += row.sessions;
      return map;
    }, new Map());

    const dailyMap = reportRows.reduce((map, row) => {
      if (!map.has(row.date)) map.set(row.date, { date: row.date, present: 0, late: 0, early: 0, workedMinutes: 0 });
      const item = map.get(row.date);
      item.present += 1;
      item.late += row.lateMinutes > 0 ? 1 : 0;
      item.early += row.earlyMinutes > 0 ? 1 : 0;
      item.workedMinutes += row.workedMinutes;
      return map;
    }, new Map());

    const summary = {
      totalEmployees: users.length,
      activeEmployees: users.filter((user) => user.isActive).length,
      employeesPresent: new Set(reportRows.map((row) => row.employeeId)).size,
      attendanceDays: reportRows.length,
      lateArrivals: reportRows.filter((row) => row.lateMinutes > 0).length,
      earlyDepartures: reportRows.filter((row) => row.earlyMinutes > 0).length,
      activeSessions: reportRows.filter((row) => row.active).length,
      totalWorkedMinutes: reportRows.reduce((sum, row) => sum + row.workedMinutes, 0),
    };

    return res.status(200).json({
      success: true,
      shift: { start: "09:30", end: "18:30", timeZone: TIME_ZONE },
      filters: { from, to, employeeId },
      summary,
      records: reportRows,
      employees: [...employeeRows.values()].map((row) => ({ ...row, workedDuration: formatDuration(row.totalWorkedMinutes) })),
      daily: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)).map((row) => ({ ...row, workedDuration: formatDuration(row.workedMinutes) })),
      employeeOptions: users.map(({ _id, name, email, role }) => ({ id: String(_id), name, email, role })),
    });
  } catch (error) {
    console.error("Admin attendance report error:", error);
    return res.status(500).json({ success: false, message: "Unable to generate attendance report." });
  }
};
