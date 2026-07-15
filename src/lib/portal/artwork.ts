export type ArtworkApprovalInput = {
  status: "APPROVED" | "AMENDMENTS_REQUESTED";
  approverName: string;
  checksConfirmed: boolean;
  comments?: string | null;
};

export function validateArtworkApproval(input: ArtworkApprovalInput) {
  const approverName = input.approverName.trim();
  if (!approverName) return { ok: false as const, error: "Approver name is required." };
  if (input.status === "APPROVED" && !input.checksConfirmed) {
    return { ok: false as const, error: "Artwork cannot be approved until spelling, contact details, colours, sizing and content are confirmed." };
  }
  if (input.status === "AMENDMENTS_REQUESTED" && !input.comments?.trim()) {
    return { ok: false as const, error: "Please add amendment comments before requesting changes." };
  }
  return { ok: true as const, value: { ...input, approverName } };
}

export function nextProofVersion(existingVersions: number[]) {
  return existingVersions.length ? Math.max(...existingVersions) + 1 : 1;
}
