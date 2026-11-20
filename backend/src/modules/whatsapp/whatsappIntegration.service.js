
import WhatsAppIntegrationConfig from "../../models/WhatsAppIntegrationConfig.js";

export const getWhatsAppConfig = async () => {
  let config = await WhatsAppIntegrationConfig.findOne({
    provider: "meta_whatsapp_cloud_api",
  });

  if (!config) {
    config = await WhatsAppIntegrationConfig.create({
      provider: "meta_whatsapp_cloud_api",
      mode: "simulation",
      isEnabled: true,
    });
  }

  return config;
};

export const updateWhatsAppConfig = async ({
  mode,
  isEnabled,
  updatedBy,
}) => {
  const config = await getWhatsAppConfig();

  if (mode !== undefined) {
    if (!["simulation", "live"].includes(mode)) {
      const error = new Error("Invalid WhatsApp integration mode");
      error.statusCode = 400;
      throw error;
    }

    if (mode === "live") {
      const error = new Error(
        "Live WhatsApp mode is not available until Meta credentials and API integration are configured."
      );
      error.statusCode = 400;
      throw error;
    }

    config.mode = mode;
  }

  if (isEnabled !== undefined) {
    config.isEnabled = Boolean(isEnabled);
  }

  if (updatedBy) {
    config.updatedBy = updatedBy;
  }

  await config.save();

  return config;
};
