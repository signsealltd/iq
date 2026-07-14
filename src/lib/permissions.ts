import type { Role } from "@prisma/client";

export function can(role: Role, action: "writePricing" | "manageUsers" | "convertQuote" | "viewReports") {
  const matrix: Record<typeof action, Role[]> = {
    writePricing: ["ADMIN", "DIRECTOR", "ESTIMATOR"],
    manageUsers: ["ADMIN"],
    convertQuote: ["ADMIN", "DIRECTOR", "ESTIMATOR"],
    viewReports: ["ADMIN", "DIRECTOR", "ESTIMATOR", "READ_ONLY"]
  };
  return matrix[action].includes(role);
}
