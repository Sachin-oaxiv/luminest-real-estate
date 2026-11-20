import Attendance from "./attendance.model.js";

export const createAttendance = (employeeId, latitude, longitude) => Attendance.create({
  employee: employeeId,
  loginLocation: { latitude, longitude },
  lastLocation: { latitude, longitude, checkedAt: new Date() },
});

export const updateAttendanceLocation = (attendanceId, latitude, longitude) => Attendance.findOneAndUpdate(
  { _id: attendanceId, status: "active" },
  { $set: { lastLocation: { latitude, longitude, checkedAt: new Date() } } },
  { new: true }
);

export const closeAttendance = async (attendanceId, reason = "employee_logout") => {
  if (!attendanceId) return null;
  return Attendance.findOneAndUpdate(
    { _id: attendanceId, status: "active" },
    { $set: { status: "logged_out", logoutAt: new Date(), logoutReason: reason } },
    { new: true }
  );
};
