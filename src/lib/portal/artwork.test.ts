import { describe, expect, it } from "vitest";
import { nextProofVersion, validateArtworkApproval } from "@/lib/portal/artwork";

describe("artwork approval validation", () => {
  it("requires confirmation checks before approval", () => {
    expect(validateArtworkApproval({ status: "APPROVED", approverName: "Alex", checksConfirmed: false }).ok).toBe(false);
    expect(validateArtworkApproval({ status: "APPROVED", approverName: "Alex", checksConfirmed: true }).ok).toBe(true);
  });

  it("requires comments for amendment requests and preserves version increments", () => {
    expect(validateArtworkApproval({ status: "AMENDMENTS_REQUESTED", approverName: "Alex", checksConfirmed: false }).ok).toBe(false);
    expect(validateArtworkApproval({ status: "AMENDMENTS_REQUESTED", approverName: "Alex", checksConfirmed: false, comments: "Logo is too small." }).ok).toBe(true);
    expect(nextProofVersion([1, 2, 5])).toBe(6);
  });
});
