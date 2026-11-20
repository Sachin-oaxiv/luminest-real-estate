import express from "express";
import { login, getMe, logout } from "./auth.controller.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.get("/admin-test", authMiddleware, roleMiddleware("admin"), (req, res) => res.status(200).json({ success: true, message: "Welcome Admin! Access granted.", role: req.user.role }));
router.post("/logout", logout);
export default router;
