import { expect, it } from "vitest";
import { canAccessCustomer, canAccessProject, canSeeVisibility } from "@/lib/portal/security";

const clientA = { role: "CLIENT" as const, customerId: "customer-a" };
const clientB = { role: "CLIENT" as const, customerId: "customer-b" };
const admin = { role: "ADMIN" as const, customerId: null };

it("isolates client users by customer organisation", () => {
  expect(canAccessCustomer(clientA, "customer-a")).toBe(true);
  expect(canAccessCustomer(clientA, "customer-b")).toBe(false);
  expect(canAccessProject(clientB, "customer-a")).toBe(false);
  expect(canAccessProject(admin, "customer-a")).toBe(true);
});

it("hides internal-only portal records from client users", () => {
  expect(canSeeVisibility(clientA, "CLIENT_VISIBLE")).toBe(true);
  expect(canSeeVisibility(clientA, "INTERNAL_ONLY")).toBe(false);
  expect(canSeeVisibility(admin, "INTERNAL_ONLY")).toBe(true);
});


