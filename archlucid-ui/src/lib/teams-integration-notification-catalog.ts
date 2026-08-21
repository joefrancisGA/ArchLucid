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
        eventType: "com.archlucid.manifest.finalized.v1",
        label: "Finalized review record committed",
        description: "The authoritative architecture package was committed as the finalized review record.",
      },
      {
        eventType: "com.archlucid.authority.run.failed",
        label: "Review failed",
        description: "A review did not complete successfully during execution.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.authority.run.quality-gate.rejected",
        label: "Quality gate rejected",
        description: "Review output did not meet the configured quality bar.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.findings.high-severity.captured.v1",
        label: "High-severity findings captured",
        description: "One notification summarizing high-severity findings from a completed review.",
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
        eventType: "com.archlucid.governance.approval.approved",
        label: "Approval approved",
        description: "A resolve outcomes request was approved.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.governance.approval.rejected",
        label: "Approval rejected",
        description: "A resolve outcomes request was rejected or returned.",
      },
      {
        eventType: "com.archlucid.governance.promotion.activated",
        label: "Governance promotion activated",
        description: "An approved review was authorized to advance in an approved environment.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.alert.fired",
        label: "Governance alert created",
        description: "A rule detected a condition that needs attention.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.alert.acknowledged",
        label: "Governance alert acknowledged",
        description: "An authorized user acknowledged a governance alert.",
      },
      {
        eventType: "com.archlucid.alert.resolved",
        label: "Governance alert resolved",
        description: "A governance alert was marked resolved.",
        recommended: true,
      },
      {
        eventType: "com.archlucid.compliance.drift.escalated",
        label: "Compliance drift escalated",
        description: "A compliance issue exceeded its configured threshold.",
      },
      {
        eventType: "com.archlucid.governance.policy-pack.published.v1",
        label: "Policy pack activated",
        description: "A policy pack version was published and is available for finalized reviews.",
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
