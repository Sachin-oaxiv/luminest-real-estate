import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const password = process.env.ADMIN_INITIAL_PASSWORD;

    if (!password) {
      throw new Error("ADMIN_INITIAL_PASSWORD is missing");
    }

    let admin = await User.findOne({
      email: "admin@realestate.com",
    });

    if (admin) {
      admin.name = "System Admin";
      admin.password = password;
      admin.role = "admin";
      admin.isActive = true;

      await admin.save();

      console.log("Existing Admin password updated.");
    } else {
      await User.create({
        name: "System Admin",
        email: "admin@realestate.com",
        password,
        role: "admin",
      });

      console.log("Admin account created successfully.");
    }

  } catch (error) {
    console.error("Admin setup failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();