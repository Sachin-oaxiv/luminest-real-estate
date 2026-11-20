
import express from "express";

import {
  createMessage,
  getCustomerMessages,
  getMyMessages,
  simulateMessageStatus,
} from "./messages.controller.js";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("inside_sales"));

// Existing message endpoints
router.post("/", createMessage);
router.get("/my", getMyMessages);
router.get("/customer/:customerId", getCustomerMessages);

// Simulation-only delivery status endpoint
router.patch("/:messageId/simulate-status", simulateMessageStatus);

export default router;
