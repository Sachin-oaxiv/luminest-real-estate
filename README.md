# Luminest Special GPS Permissions Update

## Included
- Admin and Executive permission management pages:
  - `/admin/special-permissions`
  - `/executive/special-permissions`
- Permission types: Work From Home, Outside Work, Temporary Extension, Full Day.
- Custom start and expiry times, reason, approver identity, revocation history.
- Backend permission API protected for Admin and Executive.
- Inside Sales login may pass the 200m office geofence only when an approved permission is active.
- Authenticated Inside Sales API requests continue to enforce the geofence unless a permission is active.

## Install
Merge the `backend` and `frontend` folders into the existing project and replace the listed files. Do not replace `.env`.

## Important
1. This update does not change the configured office coordinates or radius.
2. Permission is time-limited (maximum 24 hours per approval); create another approval for longer periods.
3. The employee must still provide browser GPS coordinates. The permission bypasses only the office-radius check; it does not disable location capture.
4. A browser cannot guarantee continuous background GPS monitoring while suspended/offline. Server-side enforcement occurs on each authenticated API request.
5. Full-day / half-day are permission labels; set the actual desired start and expiry times in the form.
6. Run and test in a development environment first. Verify MongoDB connection and existing login before production use.

## Test
- Login as Admin and visit `/admin/special-permissions`.
- Login as Executive and visit `/executive/special-permissions`.
- Grant an Inside Sales employee a permission starting now and expiring in 2 hours.
- Attempt Inside Sales login from outside the office radius. It should be allowed while permission is active.
- Revoke the permission, then make an authenticated API request from outside the radius. Access should be denied and attendance closed.
- Confirm ordinary Inside Sales login without permission still requires being within 200m.
