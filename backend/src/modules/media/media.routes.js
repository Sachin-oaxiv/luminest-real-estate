import express from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

import {
  getAllMedia,
} from "./media.controller.js";

const router = express.Router();

// Only authenticated Admin users can access Media Management.
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// GET /api/v1/media
router.get("/", getAllMedia);

export default router;