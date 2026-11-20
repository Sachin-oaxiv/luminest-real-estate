
import mongoose from "mongoose";

const whatsappIntegrationConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["meta_whatsapp_cloud_api"],
      default: "meta_whatsapp_cloud_api",
    },

    mode: {
      type: String,
      enum: ["simulation", "live"],
      default: "simulation",
    },

    isEnabled: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const WhatsAppIntegrationConfig = mongoose.model(
  "WhatsAppIntegrationConfig",
  whatsappIntegrationConfigSchema
);

export default WhatsAppIntegrationConfig;
