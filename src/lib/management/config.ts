export type FieldType = "text" | "textarea" | "number" | "boolean" | "select" | "date";

export type LookupOption = { label: string; value: string };

export type ManagementField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: LookupOption[];
  step?: string;
  showInTable?: boolean;
};

export type ManagementResource = {
  key: string;
  title: string;
  description: string;
  searchable: string[];
  filters: { key: string; label: string; options: LookupOption[] }[];
  fields: ManagementField[];
};

const yesNo = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" }
];

export const managementResources: Record<string, ManagementResource> = {
  "pricing-matrix": {
    key: "pricing-matrix",
    title: "Pricing Matrix",
    description: "Editable pricing defaults by category and subtype.",
    searchable: ["jobCategory", "jobSubtype", "unit", "notes"],
    filters: [{ key: "active", label: "Status", options: yesNo }],
    fields: [
      { key: "jobCategory", label: "Category", type: "text", required: true, showInTable: true },
      { key: "jobSubtype", label: "Subtype", type: "text", required: true, showInTable: true },
      { key: "unit", label: "Unit", type: "text", required: true, showInTable: true },
      { key: "minimumPrice", label: "Minimum", type: "number", step: "0.01", showInTable: true },
      { key: "targetPrice", label: "Target", type: "number", step: "0.01", showInTable: true },
      { key: "premiumPrice", label: "Premium", type: "number", step: "0.01", showInTable: true },
      { key: "targetMargin", label: "Target Margin", type: "number", step: "0.01", showInTable: true },
      { key: "minimumMargin", label: "Minimum Margin", type: "number", step: "0.01" },
      { key: "typicalMaterialCost", label: "Typical Material Cost", type: "number", step: "0.01" },
      { key: "defaultDesignHours", label: "Default Design Hours", type: "number", step: "0.25" },
      { key: "defaultProductionHours", label: "Default Production Hours", type: "number", step: "0.25" },
      { key: "defaultInstallationHours", label: "Default Installation Hours", type: "number", step: "0.25" },
      { key: "defaultTravelHours", label: "Default Travel Hours", type: "number", step: "0.25" },
      { key: "wastePercentage", label: "Waste Percentage", type: "number", step: "0.01" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "active", label: "Active", type: "boolean", showInTable: true }
    ]
  },
  materials: {
    key: "materials",
    title: "Materials",
    description: "Materials database with supplier, roll and cost-per-square-metre details.",
    searchable: ["name", "sku", "category", "unit", "supplierName"],
    filters: [{ key: "active", label: "Status", options: yesNo }],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "sku", label: "SKU", type: "text", showInTable: true },
      { key: "category", label: "Category", type: "text", showInTable: true },
      { key: "supplierId", label: "Supplier", type: "select" },
      { key: "unit", label: "Unit", type: "text", required: true, showInTable: true },
      { key: "unitCost", label: "Cost per Unit", type: "number", step: "0.01", showInTable: true },
      { key: "rollWidthMm", label: "Roll Width mm", type: "number", step: "0.01" },
      { key: "rollLengthM", label: "Roll Length m", type: "number", step: "0.01" },
      { key: "costPerSqm", label: "Cost per sqm", type: "number", step: "0.01", showInTable: true },
      { key: "defaultMarkup", label: "Default Markup", type: "number", step: "0.01" },
      { key: "active", label: "Active", type: "boolean", showInTable: true }
    ]
  },
  "labour-rates": {
    key: "labour-rates",
    title: "Labour Rates",
    description: "Hourly rates, minimum charges and billing increments by labour type.",
    searchable: ["name"],
    filters: [{ key: "active", label: "Status", options: yesNo }],
    fields: [
      { key: "name", label: "Labour Type", type: "text", required: true, showInTable: true },
      { key: "internalCostRate", label: "Internal Hourly Cost", type: "number", step: "0.01", showInTable: true },
      { key: "customerChargeRate", label: "Customer Hourly Rate", type: "number", step: "0.01", showInTable: true },
      { key: "minimumCharge", label: "Minimum Charge", type: "number", step: "0.01", showInTable: true },
      { key: "chargeIncrementMinutes", label: "Charge Increment Minutes", type: "number", step: "1", showInTable: true },
      { key: "active", label: "Active", type: "boolean", showInTable: true }
    ]
  },
  suppliers: {
    key: "suppliers",
    title: "Suppliers",
    description: "Supplier contact details, lead times, discounts and linked material counts.",
    searchable: ["name", "contactName", "email", "phone", "notes"],
    filters: [{ key: "active", label: "Status", options: yesNo }],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "contactName", label: "Contact", type: "text", showInTable: true },
      { key: "email", label: "Email", type: "text", showInTable: true },
      { key: "phone", label: "Phone", type: "text", showInTable: true },
      { key: "address", label: "Address", type: "textarea" },
      { key: "leadTimeDays", label: "Lead Time Days", type: "number", step: "1", showInTable: true },
      { key: "defaultDiscount", label: "Default Discount", type: "number", step: "0.01" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "active", label: "Active", type: "boolean", showInTable: true }
    ]
  },
  customers: {
    key: "customers",
    title: "Customers",
    description: "Customer records, commercial history, pricing profile and notes.",
    searchable: ["company", "contactName", "email", "phone", "pricingNotes", "notes"],
    filters: [{ key: "customerType", label: "Type", options: ["RETAIL", "TRADE", "FLEET", "COMMERCIAL", "PUBLIC_SECTOR", "INTERNAL"].map((value) => ({ label: value.replaceAll("_", " "), value })) }],
    fields: [
      { key: "company", label: "Company", type: "text", required: true, showInTable: true },
      { key: "contactName", label: "Contact", type: "text", showInTable: true },
      { key: "email", label: "Email", type: "text", showInTable: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "customerType", label: "Type", type: "select", options: ["RETAIL", "TRADE", "FLEET", "COMMERCIAL", "PUBLIC_SECTOR", "INTERNAL"].map((value) => ({ label: value.replaceAll("_", " "), value })), showInTable: true },
      { key: "billingAddress", label: "Billing Address", type: "textarea" },
      { key: "vatNumber", label: "VAT Number", type: "text" },
      { key: "customerSpecificDiscount", label: "Discount", type: "number", step: "0.01" },
      { key: "discountLevel", label: "Discount Level", type: "text" },
      { key: "preferredPricingProfile", label: "Preferred Pricing Profile", type: "text", showInTable: true },
      { key: "pricingNotes", label: "Pricing Notes", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  jobs: {
    key: "jobs",
    title: "Jobs",
    description: "Production workflow from approved quote through artwork, production, installation, invoice and completion.",
    searchable: ["customerName", "quoteNumber", "notes", "workflowStatus", "invoiceStatus"],
    filters: [{ key: "workflowStatus", label: "Workflow", options: ["QUOTE", "APPROVED", "ARTWORK", "AWAITING_APPROVAL", "PRODUCTION", "INSTALLATION", "INVOICE", "COMPLETED"].map((value) => ({ label: value.replaceAll("_", " "), value })) }],
    fields: [
      { key: "customerId", label: "Customer", type: "select", required: true },
      { key: "workflowStatus", label: "Workflow", type: "select", options: ["QUOTE", "APPROVED", "ARTWORK", "AWAITING_APPROVAL", "PRODUCTION", "INSTALLATION", "INVOICE", "COMPLETED"].map((value) => ({ label: value.replaceAll("_", " "), value })), showInTable: true },
      { key: "invoiceStatus", label: "Invoice Status", type: "select", options: ["NOT_CREATED", "ESTIMATE_CREATED", "INVOICED", "PART_PAID", "PAID", "VOID"].map((value) => ({ label: value.replaceAll("_", " "), value })), showInTable: true },
      { key: "quotedPrice", label: "Quoted Price", type: "number", step: "0.01", showInTable: true },
      { key: "estimatedCosts", label: "Estimated Costs", type: "number", step: "0.01" },
      { key: "actualCosts", label: "Actual Costs", type: "number", step: "0.01" },
      { key: "estimatedHours", label: "Estimated Hours", type: "number", step: "0.25", showInTable: true },
      { key: "actualHours", label: "Actual Hours", type: "number", step: "0.25", showInTable: true },
      { key: "installationDate", label: "Installation Date", type: "date" },
      { key: "completionDate", label: "Completion Date", type: "date" },
      { key: "quickBooksEstimateId", label: "QuickBooks Estimate ID", type: "text" },
      { key: "quickBooksInvoiceId", label: "QuickBooks Invoice ID", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  }
};

