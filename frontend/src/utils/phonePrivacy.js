export const maskPhoneNumber = (phone) => {
  if (!phone) return "Not available";
  const digits = String(phone).trim().replace(/\D/g, "");
  return digits.length <= 4 ? "••••" : `••••••${digits.slice(-4)}`;
};

export const getTelephoneHref = (phone) => {
  if (!phone) return undefined;
  const value = String(phone).trim().replace(/[^\d+]/g, "");
  return value ? `tel:${value}` : undefined;
};
