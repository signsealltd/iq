export const defaultProjectStages = [
  "Initial enquiry",
  "Site survey",
  "Quotation",
  "Artwork",
  "Client approval",
  "Production",
  "Installation scheduled",
  "Installed",
  "Complete"
];

export function formatPortalStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function progressFromStages(stages: { enabled: boolean; completedAt: Date | null }[]) {
  const enabled = stages.filter((stage) => stage.enabled);
  if (!enabled.length) return 0;
  return Math.round((enabled.filter((stage) => stage.completedAt).length / enabled.length) * 100);
}
