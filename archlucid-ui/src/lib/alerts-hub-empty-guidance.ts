import type { EmptyStateGettingStarted } from "@/components/EmptyState";

/** Inbox empty panel — operator can configure rules and routing. */
export const alertsInboxGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "How alerts land here",
  steps: [
    "Finish architecture reviews so findings exist for rules to evaluate.",
    "Open Alerts and create at least one enabled condition (thresholds use those findings).",
    "Optional: use Notifications on the Alerts workspace to notify email or webhooks when a condition fires.",
    "Pick All statuses or refresh — rows appear after evaluations run and dedupe allows them.",
  ],
};

/** Inbox empty panel — read tier; inspection-first. */
export const alertsInboxGettingStartedReader: EmptyStateGettingStarted = {
  heading: "How alerts land here",
  steps: [
    "Alerts appear when automated checks evaluate findings from completed reviews.",
    "Architects configure conditions and notification delivery on the Alerts workspace (`/governance/alert-rules`).",
    "Try All statuses or another filter — triage actions stay API-gated at your rank.",
  ],
};

export const alertRulesEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Create your first rule",
  steps: [
    "Pick a rule type and severity that matches the risk you care about (threshold uses recent findings).",
    "Set a threshold value — start conservative; tune after you see traffic in the inbox.",
    "Click Create rule, then open Alerts after runs complete to confirm firings.",
  ],
};

export const alertRulesEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What rules do",
  steps: [
    "Rules watch findings from completed reviews and raise alerts when thresholds breach.",
    "Creating or editing rules requires Execute+ on the API — inspect definitions below.",
    "Ask an architect to add a rule if this tenant should notify on architecture drift.",
  ],
};

export const alertRoutingEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Set up alert delivery",
  steps: [
    "Choose a notification channel and destination for this workspace.",
    "Set minimum severity to High so High and Critical findings notify your team by default.",
    "Optionally filter by finding category or review label, then create the destination.",
    "Send a test notification for webhook channels or review outcomes on the",
  ],
};

export const alertRoutingEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "How notification delivery works",
  steps: [
    "Each destination sends qualifying alerts to email or a webhook when conditions are met.",
    "Creating destinations requires Execute+ permission — inspect configured rows above.",
    "Delivery history and test actions show whether notifications reached the destination.",
  ],
};

export const compositeRulesEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Build a composite rule",
  steps: [
    "Composite rules combine multiple metrics with AND/OR — use them when a single threshold is too noisy.",
    "Add conditions, set suppression and cooldown, then create and verify in Simulation & Tuning.",
    "Check the Inbox after evaluations to see combined-rule firings.",
  ],
};

export const compositeRulesEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What composite rules do",
  steps: [
    "Combine multiple checks (for example severity and category) before sending an alert.",
    "Authoring requires Execute+ — inspect existing definitions until an architect adds one.",
    "Simulation tab helps architects validate logic before traffic hits the inbox.",
  ],
};

/** Simulation outcome table — no rows yet after a run. */
export const alertSimulationOutcomesEmptyGettingStarted: EmptyStateGettingStarted = {
  heading: "Get simulation results",
  steps: [
    "Pick Simple or Composite, enter a review ID that has finalized findings.",
    "Adjust thresholds if needed, then run Simulate — per-run outcomes explain match, suppression, and dedupe.",
    "Use Compare to diff two rule variants before promoting changes.",
  ],
};
