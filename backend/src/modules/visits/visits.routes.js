
import express from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

import {
  createVisit,
  getMyScheduledVisits,
  getMyCreatedVisits,
  confirmVisitArrival,
  completeVisit,
  getActiveOutsideSalesEmployees,
} from "./visits.controller.js";

const router = express.Router();

router.use(authMiddleware);

// Inside Sales: get active Outside Sales employees
router.get(
  "/outside-sales-employees",
  roleMiddleware("inside_sales"),
  getActiveOutsideSalesEmployees
);

// Inside Sales: schedule a property visit
router.post(
  "/",
  roleMiddleware("inside_sales"),
  createVisit
);

// Outside Sales: view visits assigned to them
router.get(
  "/my-scheduled",
  roleMiddleware("outside_sales"),
  getMyScheduledVisits
);

// Inside Sales: view visits they scheduled
router.get(
  "/my-created",
  roleMiddleware("inside_sales"),
  getMyCreatedVisits
);

// Outside Sales: confirm arrival
router.patch(
  "/:visitId/arrival",
  roleMiddleware("outside_sales"),
  confirmVisitArrival
);

// Outside Sales: complete a visit
router.patch(
  "/:visitId/complete",
  roleMiddleware("outside_sales"),
  completeVisit
);

export default router;
