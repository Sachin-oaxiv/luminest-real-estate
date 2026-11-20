import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";
import { listPermissions, grantPermission, revokePermission } from "./permissions.controller.js";

const router = express.Router();
router.use(authMiddleware, roleMiddleware("admin", "executive"));
router.get("/", listPermissions);
router.post("/", grantPermission);
router.patch("/:id/revoke", revokePermission);
export default router;
