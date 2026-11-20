
import User from "../../models/User.js";
import Customer from "../../models/Customer.js";
import CallActivity from "../../models/CallActivity.js";
import Visit from "../../models/Visit.js";

export const getEmployeePerformanceReport = async () => {
  const employees = await User.find({
    role: { $in: ["executive", "inside_sales", "outside_sales"] },
  })
    .select("name email role isActive")
    .sort({ name: 1 })
    .lean();

  const reports = await Promise.all(
    employees.map(async (employee) => {
      const [
        totalCalls,
        answeredCalls,
        unansweredCalls,
        totalAssignedCustomers,
        totalVisits,
        completedVisits,
        cancelledVisits,
      ] = await Promise.all([
        CallActivity.countDocuments({ employee: employee._id }),

        CallActivity.countDocuments({
          employee: employee._id,
          callStatus: "answered",
        }),

        CallActivity.countDocuments({
          employee: employee._id,
          callStatus: {
            $in: ["not_answered", "busy", "switched_off", "invalid_number"],
          },
        }),

        Customer.countDocuments({
          assignedTo: employee._id,
          isActive: true,
        }),

        Visit.countDocuments({ assignedTo: employee._id }),

        Visit.countDocuments({
          assignedTo: employee._id,
          status: "completed",
        }),

        Visit.countDocuments({
          assignedTo: employee._id,
          status: "cancelled",
        }),
      ]);

      return {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          isActive: employee.isActive,
        },
        calls: {
          total: totalCalls,
          answered: answeredCalls,
          unanswered: unansweredCalls,
        },
        customers: {
          totalAssigned: totalAssignedCustomers,
        },
        visits: {
          total: totalVisits,
          completed: completedVisits,
          cancelled: cancelledVisits,
          pending: totalVisits - completedVisits - cancelledVisits,
        },
      };
    })
  );

  return reports;
};


export const getCustomerPerformanceReport = async () => {
  const [
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    customersByStatus,
    customersByInterest,
    customersByEmployee,
  ] = await Promise.all([
    Customer.countDocuments(),

    Customer.countDocuments({ isActive: true }),

    Customer.countDocuments({ isActive: false }),

    Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$interestStatus",
          count: { $sum: 1 },
        },
      },
    ]),

    Customer.aggregate([
      { $match: { isActive: true, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: "$assignedTo",
          totalCustomers: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          _id: 0,
          employeeName: "$employee.name",
          employeeEmail: "$employee.email",
          employeeRole: "$employee.role",
          totalCustomers: 1,
        },
      },
    ]),
  ]);

  return {
    customers: {
      total: totalCustomers,
      active: activeCustomers,
      inactive: inactiveCustomers,
      closed: customersByStatus.find(
        (item) => item._id === "closed"
      )?.count || 0,
      lost: customersByStatus.find(
        (item) => item._id === "lost"
      )?.count || 0,
    },
    byStatus: customersByStatus,
    byInterest: customersByInterest,
    byEmployee: customersByEmployee,
  };
};


export const getVisitPerformanceReport = async () => {
  const [
    totalVisits,
    visitsByStatus,
    visitsByEmployee,
    visitsByOutcome,
  ] = await Promise.all([
    Visit.countDocuments(),

    Visit.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Visit.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          totalVisits: { $sum: 1 },
          completedVisits: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          cancelledVisits: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          _id: 0,
          employeeName: "$employee.name",
          employeeEmail: "$employee.email",
          totalVisits: 1,
          completedVisits: 1,
          cancelledVisits: 1,
        },
      },
    ]),

    Visit.aggregate([
      { $match: { visitOutcome: { $ne: null } } },
      {
        $group: {
          _id: "$visitOutcome",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    totalVisits,
    byStatus: visitsByStatus,
    byEmployee: visitsByEmployee,
    byOutcome: visitsByOutcome,
  };
};


export const getSalesConversionReport = async () => {
  const [
    totalCustomers,
    closedCustomers,
    lostCustomers,
    customersByStatus,
  ] = await Promise.all([
    Customer.countDocuments({ isActive: true }),

    Customer.countDocuments({
      isActive: true,
      status: "closed",
    }),

    Customer.countDocuments({
      isActive: true,
      status: "lost",
    }),

    Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const conversionRate =
    totalCustomers > 0
      ? Number(
          ((closedCustomers / totalCustomers) * 100).toFixed(2)
        )
      : 0;

  return {
    totalCustomers,
    closedCustomers,
    lostCustomers,
    conversionRate,
    byStatus: customersByStatus,
  };
};
