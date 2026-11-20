
import express from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

import {
  getWhatsAppIntegrationSettings,
  updateWhatsAppIntegrationSettings,
} from "./whatsappIntegration.controller.js";

const router = express.Router();

// Only authenticated Admin users can manage integration settings.
router.use(authMiddleware, roleMiddleware("admin"));

router.get("/", getWhatsAppIntegrationSettings);

router.patch("/", updateWhatsAppIntegrationSettings);

export default router;
