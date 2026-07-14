import "server-only";

export type QuickBooksStatus = {
  enabled: boolean;
  configured: boolean;
  connectionStatus: "Not configured" | "Disabled" | "Ready";
  lastSyncTime?: string;
};

export function quickBooksStatus(settings: Record<string, string | null | undefined> = {}): QuickBooksStatus {
  const enabled = process.env.QUICKBOOKS_ENABLED === "true";
  if (!enabled) return { enabled, configured: false, connectionStatus: "Disabled" };
  const configured = Boolean(settings.quickbooksCompanyId && settings.quickbooksClientId && settings.quickbooksRedirectUri);
  return { enabled, configured, connectionStatus: configured ? "Ready" : "Not configured", lastSyncTime: settings.quickbooksLastSyncTime ?? undefined };
}

export interface QuickBooksIntegration {
  importCustomers(): Promise<never>;
  exportApprovedQuote(quoteId: string): Promise<never>;
  createEstimate(quoteId: string): Promise<never>;
  convertEstimateToInvoice(estimateId: string): Promise<never>;
  syncPaymentStatus(invoiceId: string): Promise<never>;
  syncProductsAndServices(): Promise<never>;
}

export const quickBooksIntegration: QuickBooksIntegration = {
  importCustomers: notConfigured,
  exportApprovedQuote: notConfigured,
  createEstimate: notConfigured,
  convertEstimateToInvoice: notConfigured,
  syncPaymentStatus: notConfigured,
  syncProductsAndServices: notConfigured
};

async function notConfigured(): Promise<never> {
  throw new Error("QuickBooks integration is not configured.");
}
