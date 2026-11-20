import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const checkPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const admin = await User.findOne({
      email: "admin@realestate.com",
    });

    if (!admin) {
      console.log("Admin account not found.");
      return;
    }

    const result = await bcrypt.compare(
      process.env.ADMIN_INITIAL_PASSWORD,
      admin.password
    );

    console.log("Admin found:", Boolean(admin));
    console.log("Password matches:", result);
    console.log("Hash starts with:", admin.password.slice(0, 7));

  } catch (error) {
    console.error("Check failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

checkPassword();