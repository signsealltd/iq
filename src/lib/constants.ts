export const jobCategories = [
  "Vehicle Graphics",
  "Vehicle Wraps",
  "Printed Infill Wraps",
  "Cut Vinyl Lettering",
  "ACM Signs",
  "Tray Signs",
  "Built-Up Letters",
  "Illuminated Signs",
  "Banners",
  "Window Graphics",
  "Wall Graphics",
  "Health and Safety Signs",
  "Design Only",
  "Supply Only",
  "Installation Only",
  "Outsourced Manufacture",
  "Other"
] as const;

export const overrideReasons = [
  "Returning customer",
  "Strategic customer",
  "Competitive quote",
  "Bundle pricing",
  "Goodwill",
  "Promotional price",
  "Price match",
  "Director discretion",
  "Other"
] as const;

export const roles = ["ADMIN", "DIRECTOR", "ESTIMATOR", "PRODUCTION", "INSTALLER", "READ_ONLY"] as const;

export const quoteStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED_TO_JOB"] as const;
