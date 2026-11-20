
import User from "../../models/User.js";
import Customer from "../../models/Customer.js";
import Visit from "../../models/Visit.js";
import CallActivity from "../../models/CallActivity.js";
import Message from "../../models/Message.js";

export const getDashboardOverview = async () => {
  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    employeesByRole,
    totalCustomers,
    activeCustomers,
    customersByStatus,
    totalVisits,
    visitsByStatus,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),

    User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),

    Customer.countDocuments(),
    Customer.countDocuments({ isActive: true }),

    Customer.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Visit.countDocuments(),

    Visit.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees,
      byRole: employeesByRole,
    },

    customers: {
      total: totalCustomers,
      active: activeCustomers,
      byStatus: customersByStatus,
    },

    visits: {
      total: totalVisits,
      byStatus: visitsByStatus,
    },
  };
};


export const getEmployeeOverview = async () => {
  const employees = await User.find()
    .select("-password")
    .sort({ createdAt: -1 });

  return employees;
};


export const getCustomerOverview = async () => {
  const customers = await Customer.find()
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });

  return customers;
};


export const getVisitOverview = async () => {
  const visits = await Visit.find()
    .populate("customer", "name phone email")
    .populate("assignedTo", "name email role")
    .populate("scheduledBy", "name email role")
    .sort({ scheduledDate: -1 });

  return visits;
};


export const getRecentActivities = async () => {
  const [customers, calls, messages, visits] = await Promise.all([
    Customer.find()
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    CallActivity.find()
      .populate("customer", "name")
      .populate("employee", "name role")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    Message.find()
      .populate("customer", "name")
      .populate("employee", "name role")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    Visit.find()
      .populate("customer", "name")
      .populate("assignedTo", "name role")
      .populate("scheduledBy", "name role")
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const activities = [
    ...customers.map((customer) => ({
      id: `customer-${customer._id}`,
      type: "customer",
      title: "New customer added",
      description: `${customer.name} was added to the customer database`,
      performedBy: customer.createdBy?.name || "Unknown employee",
      timestamp: customer.createdAt,
    })),

    ...calls.map((call) => ({
      id: `call-${call._id}`,
      type: "call",
      title: "Customer call recorded",
      description: `Call with ${call.customer?.name || "Unknown customer"} — ${call.callStatus.replaceAll("_", " ")}`,
      performedBy: call.employee?.name || "Unknown employee",
      timestamp: call.createdAt,
    })),

    ...messages.map((message) => ({
      id: `message-${message._id}`,
      type: "message",
      title: "WhatsApp message recorded",
      description: `Message record for ${message.customer?.name || "Unknown customer"}`,
      performedBy: message.employee?.name || "Unknown employee",
      timestamp: message.createdAt,
    })),

    ...visits.map((visit) => ({
      id: `visit-${visit._id}`,
      type: "visit",
      title: `Property visit ${visit.status.replaceAll("_", " ")}`,
      description: `${visit.propertyName} — ${visit.customer?.name || "Unknown customer"}`,
      performedBy: visit.assignedTo?.name || visit.scheduledBy?.name || "Unknown employee",
      timestamp: visit.updatedAt || visit.createdAt,
    })),
  ];

  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )
    .slice(0, 10);
};
