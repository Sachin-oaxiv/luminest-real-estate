
import express from "express";

import {
  createCustomer,
  getAllCustomers,
  getAllCustomersForAdmin,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
  reactivateCustomer,
  permanentlyDeleteCustomer,
} from "./customers.controller.js";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// Only Admin and Executive can manage customers
router.use(
  authMiddleware,
  roleMiddleware("admin", "executive")
);

router.post("/", createCustomer);
router.get("/", getAllCustomers);

// Admin-only routes
router.get(
  "/admin/all",
  roleMiddleware("admin"),
  getAllCustomersForAdmin
);

router.delete(
  "/:id/permanent",
  roleMiddleware("admin"),
  permanentlyDeleteCustomer
);

// Existing customer routes
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.patch("/:id/deactivate", deactivateCustomer);
router.patch("/:id/reactivate", reactivateCustomer);

export default router;
