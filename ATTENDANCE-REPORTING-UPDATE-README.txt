LUMINEST - ADMIN ATTENDANCE REPORTING UPDATE

Base: Luminest-Latest-Project(3).zip

Included:
- Admin-only attendance reporting API at GET /api/v1/attendance/admin-report
- Daily attendance summary for the selected date range
- Employee-wise attendance and working-hours summary
- Late arrival calculation after 9:30 AM IST
- Early departure calculation before 6:30 PM IST
- Attendance history with date and employee filters
- CSV export that opens in Microsoft Excel
- Print / Save as PDF support
- Admin sidebar link: Attendance (/admin/attendance)

INSTALLATION
1. Extract this ZIP into your existing project folder and allow it to merge/replace the listed files.
2. Do not delete or replace your .env files.
3. Restart backend and frontend development servers.
4. Log in as Admin and open Attendance from the sidebar.

NOTES
- The report uses Asia/Kolkata (IST) for dates and shift calculations.
- Shift timing is configured as 9:30 AM to 6:30 PM.
- Working duration is calculated from stored login/logout timestamps. For an active session, duration is counted up to report generation time.
- CSV export is Excel-compatible. Use Print / Save as PDF to create a PDF through the browser print dialog.
- The existing /attendance/ping GPS endpoint remains available.
