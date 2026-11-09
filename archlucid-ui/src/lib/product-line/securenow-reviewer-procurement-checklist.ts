export const SECURENOW_REVIEWER_PROCUREMENT_CHECKLIST_ITEMS = [
  { id: "quote-cover", label: "Quote cover" },
  { id: "controlled-pilot", label: "Controlled pilot proposal" },
  { id: "security-one-pager", label: "Security one-pager and procurement index" },
  { id: "dpa", label: "Data-processing schedule" },
  { id: "support-commitment", label: "Support commitment" },
  { id: "order-form", label: "Order form and measurement log templates" },
] as const;

export type SecureNowReviewerProcurementChecklistItemId =
  (typeof SECURENOW_REVIEWER_PROCUREMENT_CHECKLIST_ITEMS)[number]["id"];

const STORAGE_PREFIX = "securenow-reviewer-procurement-checklist:" as const;

function storageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId.trim()}`;
}

export function readSecureNowReviewerProcurementChecklist(
  workspaceId: string,
): Readonly<Record<SecureNowReviewerProcurementChecklistItemId, boolean>> {
  const defaults = Object.fromEntries(
    SECURENOW_REVIEWER_PROCUREMENT_CHECKLIST_ITEMS.map((item) => [item.id, false]),
  ) as Record<SecureNowReviewerProcurementChecklistItemId, boolean>;

  if (typeof window === "undefined" || workspaceId.trim().length === 0) {
    return defaults;
  }

  const raw = window.localStorage.getItem(storageKey(workspaceId));

  if (raw === null) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;

    for (const item of SECURENOW_REVIEWER_PROCUREMENT_CHECKLIST_ITEMS) {
      if (typeof parsed[item.id] === "boolean") {
        defaults[item.id] = parsed[item.id];
      }
    }
  } catch {
    return defaults;
  }

  return defaults;
}

export function writeSecureNowReviewerProcurementChecklist(
  workspaceId: string,
  state: Readonly<Record<SecureNowReviewerProcurementChecklistItemId, boolean>>,
): void {
  if (typeof window === "undefined" || workspaceId.trim().length === 0) {
    return;
  }

  window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(state));
}
