import type { EmptyStateGettingStarted } from "@/components/EmptyState";

/** Inbox empty panel — operator can configure rules and routing. */
export const alertsInboxGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "How alerts land here",
  steps: [
    "Finish architecture reviews so findings exist for rules to evaluate.",
    "Open the Rules tab and create at least one enabled rule (thresholds use those findings).",
    "Optional: use Routing to notify email or webhooks when a rule fires.",
    "Pick All statuses or refresh — rows appear after evaluations run and dedupe allows them.",
  ],
};

/** Inbox empty panel — read tier; inspection-first. */
export const alertsInboxGettingStartedReader: EmptyStateGettingStarted = {
  heading: "How alerts land here",
  steps: [
    "Alerts appear when automated checks evaluate findings from completed reviews.",
    "Operators configure rules and routing on the Rules and Routing tabs (writes need Execute+ on the API).",
    "Try All statuses or another filter — triage actions stay API-gated at your rank.",
  ],
};

export const alertRulesEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Create your first rule",
  steps: [
    "Pick a rule type and severity that matches the risk you care about (threshold uses recent findings).",
    "Set a threshold value — start conservative; tune after you see traffic in the inbox.",
    "Click Create rule, then open the Inbox tab after runs complete to confirm firings.",
  ],
};

export const alertRulesEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What rules do",
  steps: [
    "Rules watch findings from completed reviews and raise alerts when thresholds breach.",
    "Creating or editing rules requires Execute+ on the API — inspect definitions below.",
    "Ask an operator to add a rule if this tenant should notify on architecture drift.",
  ],
};

export const alertRoutingEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Wire notifications",
  steps: [
    "Subscriptions fan out alerts that passed rules — pick channel, destination, and minimum severity.",
    "Create a subscription below, then use delivery attempts on each row to verify sends.",
    "Pair with Rules so only meaningful signals reach operators.",
  ],
};

export const alertRoutingEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What routing does",
  steps: [
    "Each subscription sends firing alerts to email or a webhook based on severity.",
    "Creating subscriptions needs Execute+ — review destinations operators configured.",
    "Delivery attempts on each row show recent send history for troubleshooting.",
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
    "They join several signals before firing — useful for nuanced governance thresholds.",
    "Authoring requires Execute+ — inspect existing definitions until an operator adds one.",
    "Simulation tab helps operators validate logic before traffic hits the inbox.",
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
