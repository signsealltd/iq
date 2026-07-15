export type PortalFieldType = "text" | "textarea" | "number" | "boolean" | "select" | "date";
export type PortalOption = { label: string; value: string };
export type PortalField = { key: string; label: string; type: PortalFieldType; required?: boolean; options?: PortalOption[]; showInTable?: boolean; readOnly?: boolean };
export type PortalResource = { key: string; title: string; description: string; searchable: string[]; fields: PortalField[]; filters?: { key: string; label: string; options: PortalOption[] }[]; canAdd?: boolean; canArchive?: boolean; canDelete?: boolean };

const yesNo = [{ label: "Yes", value: "true" }, { label: "No", value: "false" }];
const programmeStatuses = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const projectStatuses = ["INITIAL_ENQUIRY", "SITE_SURVEY", "QUOTATION", "ARTWORK", "CLIENT_APPROVAL", "PRODUCTION", "INSTALLATION_SCHEDULED", "INSTALLED", "COMPLETE", "ON_HOLD"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const quoteStatuses = ["NOT_STARTED", "DRAFT", "SENT", "ACCEPTED", "CHANGES_REQUESTED"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const artworkStatuses = ["NOT_STARTED", "IN_PROGRESS", "PROOF_SENT", "APPROVED", "AMENDMENTS_REQUESTED"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const productionStatuses = ["NOT_STARTED", "READY", "IN_PROGRESS", "COMPLETE"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const installationStatuses = ["NOT_SCHEDULED", "SCHEDULED", "IN_PROGRESS", "INSTALLED", "COMPLETE"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const actionStatuses = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const templateEvents = ["CLIENT_INVITATION", "CLIENT_VISIBLE_MESSAGE", "NEW_ARTWORK_PROOF", "APPROVAL_REQUESTED", "AMENDMENT_REQUESTED", "DOCUMENT_UPLOADED", "INSTALLATION_DATE_CONFIRMED", "CLIENT_ACTION_REQUEST_ASSIGNED"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const notificationStatuses = ["QUEUED", "SENT", "FAILED", "SUPPRESSED"].map((value) => ({ label: value.replaceAll("_", " "), value }));

export const portalResources: Record<string, PortalResource> = {
  clients: {
    key: "clients",
    title: "Clients",
    description: "Portal-enabled customer organisations.",
    searchable: ["company", "contactName", "email", "phone"],
    filters: [{ key: "portalEnabled", label: "Portal", options: yesNo }],
    fields: [
      { key: "company", label: "Client name", type: "text", required: true, showInTable: true },
      { key: "contactName", label: "Main contact", type: "text", showInTable: true },
      { key: "email", label: "Contact email", type: "text", showInTable: true },
      { key: "phone", label: "Telephone", type: "text" },
      { key: "billingAddress", label: "Billing details", type: "textarea" },
      { key: "notes", label: "Internal notes", type: "textarea" },
      { key: "portalEnabled", label: "Portal enabled", type: "boolean", showInTable: true }
    ]
  },
  programmes: {
    key: "programmes",
    title: "Programmes",
    description: "Programmes grouping multiple client projects.",
    searchable: ["name", "clientName", "summary"],
    filters: [{ key: "status", label: "Status", options: programmeStatuses }],
    fields: [
      { key: "customerId", label: "Client", type: "select", required: true, showInTable: true },
      { key: "name", label: "Programme name", type: "text", required: true, showInTable: true },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: programmeStatuses, showInTable: true },
      { key: "targetCompletionDate", label: "Target completion", type: "date", showInTable: true }
    ]
  },
  projects: {
    key: "projects",
    title: "Projects",
    description: "Projects within programmes. Each project can contain multiple sites.",
    searchable: ["name", "programmeName", "clientName", "description"],
    filters: [{ key: "status", label: "Status", options: projectStatuses }],
    fields: [
      { key: "programmeId", label: "Programme", type: "select", required: true, showInTable: true },
      { key: "name", label: "Project name", type: "text", required: true, showInTable: true },
      { key: "status", label: "Status", type: "select", options: projectStatuses, showInTable: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "surveyDate", label: "Survey date", type: "date" },
      { key: "targetDate", label: "Target date", type: "date", showInTable: true },
      { key: "quoteStatus", label: "Quote status", type: "select", options: quoteStatuses },
      { key: "artworkStatus", label: "Artwork status", type: "select", options: artworkStatuses },
      { key: "productionStatus", label: "Production status", type: "select", options: productionStatuses },
      { key: "installationStatus", label: "Installation status", type: "select", options: installationStatuses },
      { key: "notes", label: "Client-visible notes", type: "textarea" },
      { key: "internalNotes", label: "Internal notes", type: "textarea" }
    ]
  },
  sites: {
    key: "sites",
    title: "Sites",
    description: "Site-level progress, notes, approvals, files, messages and timelines.",
    searchable: ["name", "projectName", "clientName", "address", "notes"],
    filters: [{ key: "status", label: "Status", options: projectStatuses }],
    fields: [
      { key: "projectId", label: "Project", type: "select", required: true, showInTable: true },
      { key: "name", label: "Site name", type: "text", required: true, showInTable: true },
      { key: "status", label: "Status", type: "select", options: projectStatuses, showInTable: true },
      { key: "progress", label: "Progress %", type: "number", showInTable: true },
      { key: "address", label: "Site address", type: "textarea" },
      { key: "contactName", label: "Site contact", type: "text" },
      { key: "contactEmail", label: "Contact email", type: "text" },
      { key: "contactPhone", label: "Contact phone", type: "text" },
      { key: "notes", label: "Client-visible notes", type: "textarea" },
      { key: "internalNotes", label: "Internal notes", type: "textarea" }
    ]
  },
  users: {
    key: "users",
    title: "Client Users",
    description: "Invite client contacts by email and manage portal access.",
    searchable: ["name", "email", "clientName"],
    filters: [{ key: "active", label: "Active", options: yesNo }],
    fields: [
      { key: "customerId", label: "Client", type: "select", required: true, showInTable: true },
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "email", label: "Email", type: "text", required: true, showInTable: true },
      { key: "active", label: "Active", type: "boolean", showInTable: true }
    ]
  },
  "action-requests": {
    key: "action-requests",
    title: "Action Requests",
    description: "Client tasks such as approvals, dimensions, PO numbers and access confirmation.",
    searchable: ["title", "description", "projectName", "siteName"],
    filters: [{ key: "status", label: "Status", options: actionStatuses }],
    fields: [
      { key: "projectId", label: "Project", type: "select", required: true, showInTable: true },
      { key: "siteId", label: "Site", type: "select" },
      { key: "assignedUserId", label: "Assigned client contact", type: "select" },
      { key: "title", label: "Title", type: "text", required: true, showInTable: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "dueDate", label: "Due date", type: "date", showInTable: true },
      { key: "status", label: "Status", type: "select", options: actionStatuses, showInTable: true }
    ]
  },
  activity: {
    key: "activity",
    title: "Portal Activity",
    description: "Notification/audit style portal activity. Client users cannot see internal-only portal records.",
    searchable: ["event", "status", "clientName", "projectName"],
    filters: [{ key: "status", label: "Status", options: notificationStatuses }],
    canAdd: false,
    fields: [
      { key: "event", label: "Event", type: "select", options: templateEvents, showInTable: true },
      { key: "status", label: "Status", type: "select", options: notificationStatuses, showInTable: true },
      { key: "clientName", label: "Client", type: "text", readOnly: true, showInTable: true },
      { key: "projectName", label: "Project", type: "text", readOnly: true, showInTable: true },
      { key: "error", label: "Error", type: "textarea" }
    ]
  },
  "email-templates": {
    key: "email-templates",
    title: "Email Templates",
    description: "Configurable wording for portal invitations and notifications.",
    searchable: ["event", "subject", "body"],
    filters: [{ key: "active", label: "Active", options: yesNo }],
    fields: [
      { key: "event", label: "Event", type: "select", options: templateEvents, required: true, showInTable: true },
      { key: "subject", label: "Subject", type: "text", required: true, showInTable: true },
      { key: "body", label: "Body", type: "textarea" },
      { key: "active", label: "Active", type: "boolean", showInTable: true }
    ]
  }
};
