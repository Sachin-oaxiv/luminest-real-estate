
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check whether the employee is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check whether the employee's role is permitted
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You do not have permission.",
        });
      }

      // Employee has permission; continue
      next();
    } catch (error) {
      console.error("Role authorization error:", error);

      return res.status(500).json({
        success: false,
        message: "Authorization error",
      });
    }
  };
};

export default roleMiddleware;
