// Friendly label and explanatory copy per canonical trigger event type. The keys must mirror
// `ArchLucid.Core.Notifications.Teams.TeamsNotificationTriggerCatalog.All` (server-side source of truth).
const TRIGGER_DESCRIPTIONS: Record<string, { label: string; helpText: string }> = {
  "com.archlucid.authority.run.completed": {
    label: "Review finalized",
    helpText: "An architecture review produced a finalized manifest (operator UI: review detail).",
  },
  "com.archlucid.governance.approval.submitted": {
    label: "Governance approval requested",
    helpText: "A governance approval request was raised and awaits review (operator UI: approvals).",
  },
  "com.archlucid.alert.fired": {
    label: "Alert fired",
    helpText: "An alert rule matched and an alert record was opened (operator UI: alerts).",
  },
  "com.archlucid.compliance.drift.escalated": {
    label: "Compliance drift escalated",
    helpText: "A compliance drift breached its threshold and was escalated (operator UI: compliance).",
  },
  "com.archlucid.advisory.scan.completed": {
    label: "Advisory scan completed",
    helpText: "An advisory finding scan persisted a fresh result (operator UI: advisory findings).",
  },
  "com.archlucid.seat.reservation.released": {
    label: "Trial seat released",
    helpText: "A trial seat reservation expired or was released, freeing capacity (operator UI: trial seats).",
  },
};

/** Canonical trigger label, or raw event type when the server added a trigger before the UI shipped a label. */
export function describeTeamsNotificationTrigger(eventType: string): { label: string; helpText: string } {
  return (
    TRIGGER_DESCRIPTIONS[eventType] ?? {
      label: eventType,
      helpText: `Custom or newly added trigger (${eventType}).`,
    }
  );
}
