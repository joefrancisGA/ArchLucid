const MISSING_ITEM_NOT_STORED = "Missing item was not stored." as const;
const MISSING_ITEM_STORED_EMPTY = "Missing item was stored empty." as const;
const MISSING_ITEM_GUID_WITHOUT_DISPLAY_NAME =
  "Missing item was a GUID without a display name." as const;

function isArmResourceId(value: string): boolean {
  return (
    value.startsWith("/subscriptions/")
    || value.startsWith("subscriptions/")
  );
}

/** Mirrors clarification prompt honesty for ARM ids and bare GUIDs. */
export function formatClarificationMissingItemDisplay(
  missingItem: string | null | undefined,
): string {
  if (missingItem === null || missingItem === undefined) {
    return MISSING_ITEM_NOT_STORED;
  }

  const trimmed = missingItem.trim();

  if (trimmed.length === 0) {
    return MISSING_ITEM_STORED_EMPTY;
  }

  if (isArmResourceId(trimmed)) {
    return `Resource name was not stored. Stored reference: '${trimmed}'.`;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return `${MISSING_ITEM_GUID_WITHOUT_DISPLAY_NAME} Stored reference: '${trimmed}'.`;
  }

  return trimmed;
}
