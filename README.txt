LUMINEST — EMPLOYEE BROWSER PRIVACY PATCH

Included changes
1. Adds PrivacyGuard for Inside Sales and Outside Sales workspaces.
2. Obscures the complete employee dashboard when the document becomes hidden,
   the browser window loses focus, or the page is being left.
3. Reveals the dashboard again when the document is visible and the window has focus.
4. Adds print-view suppression for dashboard content.
5. Prevents ordinary text selection, copying, and context-menu copying on the
   CustomerPhoneActions component.
6. Preserves the existing direct tel: call link and masked phone display.

Files to merge/replace
- frontend/src/components/shared/PrivacyGuard.jsx (new)
- frontend/src/styles/components/privacy-guard.css (new)
- frontend/src/components/shared/CustomerPhoneActions.jsx (replace)
- frontend/src/styles/components/customer-phone-actions.css (replace)
- frontend/src/layouts/DashboardLayout.jsx (replace)

Limitations
- A browser application cannot reliably block operating-system screenshots,
  screen recording, camera capture, developer tools, or browser/network inspection.
- The privacy overlay is a best-effort browser focus/visibility deterrent.
- Direct tel: calling still exposes the underlying phone number to the browser/device
  when the call action is invoked. This is not a secure number-proxy service.
- Admin and Executive workspaces are intentionally not covered by this employee
  privacy overlay.
- This patch does not modify backend APIs, authentication, GPS, attendance, or .env files.

Apply
1. Back up your project.
2. Extract this ZIP.
3. Merge its frontend folder into the existing project.
4. Replace the listed files when prompted.
5. Restart the frontend with npm run dev.
