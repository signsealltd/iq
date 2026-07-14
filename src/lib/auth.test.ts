import { describe, expect, it } from "vitest";
import { can } from "@/lib/permissions";

describe("permissions", () => {
  it("restricts user management to admins", () => {
    expect(can("ADMIN", "manageUsers")).toBe(true);
    expect(can("ESTIMATOR", "manageUsers")).toBe(false);
  });

  it("allows estimators to write pricing", () => {
    expect(can("ESTIMATOR", "writePricing")).toBe(true);
    expect(can("READ_ONLY", "writePricing")).toBe(false);
  });
});
