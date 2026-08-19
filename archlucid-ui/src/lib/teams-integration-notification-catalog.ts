export type TeamsNotificationCategory = {
  readonly id: string;
  readonly title: string;
  readonly defaultCollapsed?: boolean;
  readonly items: readonly TeamsNotificationItem[];
};

export type TeamsNotificationItem = {
  readonly eventType: string;
  readonly label: string;
  readonly description: string;
  readonly recommended?: boolean;
};

/** Customer-facing notification categories mapped to canonical integration event types. */
export const TEAMS_NOTIFICATION_CATEGORIES: readonly TeamsNotificationCategory[] = [
  {
    id: "architecture-and-review",
    title: "Architecture and review",
    items: [
      {
        eventType: "com.archlucid.authority.run.completed",
        label: "Review completed",
        description: "A review has been finalized and its results are ready.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.advisory.scan.completed",
        label: "Advisory scan completed",
        description: "An advisory scan produced updated findings.",
      },
    ],
  },
  {
    id: "governance-and-risk",
    title: "Governance and risk",
    items: [
      {
        eventType: "com.archlucid.governance.approval.submitted",
        label: "Approval requested",
        description: "A governance decision requires review or approval.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.alert.fired",
        label: "Governance alert created",
        description: "A rule detected a condition that needs attention.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.compliance.drift.escalated",
        label: "Compliance drift escalated",
        description: "A compliance issue exceeded its configured threshold.",
      },
    ],
  },
  {
    id: "workspace-administration",
    title: "Workspace administration",
    defaultCollapsed: true,
    items: [
      {
        eventType: "com.archlucid.seat.reservation.released",
        label: "Trial capacity released",
        description: "A trial reservation expired or released capacity.",
      },
    ],
  },
] as const;

export const TEAMS_RECOMMENDED_EVENT_TYPES: readonly string[] = TEAMS_NOTIFICATION_CATEGORIES.flatMap((category) =>
  category.items.filter((item) => item.recommended === true).map((item) => item.eventType),
);

export const TEAMS_NOTIFICATION_EVENT_TYPES: readonly string[] = TEAMS_NOTIFICATION_CATEGORIES.flatMap((category) =>
  category.items.map((item) => item.eventType),
);

export function labelForTeamsNotificationEventType(eventType: string): string {
  for (const category of TEAMS_NOTIFICATION_CATEGORIES) {
    const match = category.items.find((item) => item.eventType === eventType);

    if (match !== undefined) {
      return match.label;
    }
  }

  return eventType;
}
