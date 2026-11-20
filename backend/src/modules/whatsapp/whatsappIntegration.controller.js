
import {
  getWhatsAppConfig,
  updateWhatsAppConfig,
} from "./whatsappIntegration.service.js";

const formatConfig = (config) => ({
  provider: config.provider,
  mode: config.mode,
  isEnabled: config.isEnabled,
  updatedAt: config.updatedAt,
});

export const getWhatsAppIntegrationSettings = async (req, res, next) => {
  try {
    const config = await getWhatsAppConfig();

    return res.status(200).json({
      success: true,
      config: formatConfig(config),
    });
  } catch (error) {
    next(error);
  }
};

export const updateWhatsAppIntegrationSettings = async (req, res, next) => {
  try {
    const { mode, isEnabled } = req.body;

    if (
      mode === undefined &&
      isEnabled === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a setting to update.",
      });
    }

    if (
      isEnabled !== undefined &&
      typeof isEnabled !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isEnabled must be true or false.",
      });
    }

    const config = await updateWhatsAppConfig({
      mode,
      isEnabled,
      updatedBy: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp integration settings updated successfully.",
      config: formatConfig(config),
    });
  } catch (error) {
    next(error);
  }
};
