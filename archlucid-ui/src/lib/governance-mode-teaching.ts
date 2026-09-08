/**
 * TB-2392 — Approval view mode toggle first-use teaching.
 */

import { GOVERNANCE_MODE_COPY } from "@/lib/vocabulary/governance-mode-vocabulary";

export const GOVERNANCE_MODE_TEACHING_DISMISS_KEY =
  "archlucid_governance_mode_teaching_dismissed_v1" as const;

export type GovernanceModeTeachingStepId = "labels" | "routes" | "revert";

export type GovernanceModeTeachingStep = {
  readonly id: GovernanceModeTeachingStepId;
  readonly label: string;
  readonly body: string;
};

export type GovernanceModeTeachingModel = {
  readonly heading: string;
  readonly lead: string;
  readonly steps: readonly GovernanceModeTeachingStep[];
  readonly dismissLabel: string;
  readonly reminderLine: string;
};

export const GOVERNANCE_MODE_TEACHING_HEADING = "Approval view is on" as const;

export const GOVERNANCE_MODE_TEACHING_LEAD =
  "Navigation labels and panels now use enterprise approval terminology. Your permissions and routes did not change." as const;

export const GOVERNANCE_MODE_TEACHING_STEPS: readonly GovernanceModeTeachingStep[] = [
  {
    id: "labels",
    label: "Labels only",
    body: `Sidebar groups and review chrome use ${GOVERNANCE_MODE_COPY.toggleLabel.toLowerCase()} vocabulary — for example Finalized review record instead of approved design.`,
  },
  {
    id: "routes",
    label: "Routes unchanged",
    body: "Every page URL and API path stays the same. Nothing was removed from your workspace.",
  },
  {
    id: "revert",
    label: "How to revert",
    body: `Turn off ${GOVERNANCE_MODE_COPY.toggleLabel} in the shell sidebar to return to pilot-friendly labels.`,
  },
] as const;

export const GOVERNANCE_MODE_TEACHING_DISMISS_LABEL = "Dismiss" as const;

export const GOVERNANCE_MODE_TEACHING_REMINDER_LINE =
  "Approval view changes labels only — routes and permissions are unchanged." as const;

export function buildGovernanceModeTeaching(): GovernanceModeTeachingModel {
  return {
    heading: GOVERNANCE_MODE_TEACHING_HEADING,
    lead: GOVERNANCE_MODE_TEACHING_LEAD,
    steps: GOVERNANCE_MODE_TEACHING_STEPS,
    dismissLabel: GOVERNANCE_MODE_TEACHING_DISMISS_LABEL,
    reminderLine: GOVERNANCE_MODE_TEACHING_REMINDER_LINE,
  };
}

export function isGovernanceModeTeachingDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(GOVERNANCE_MODE_TEACHING_DISMISS_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissGovernanceModeTeaching(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(GOVERNANCE_MODE_TEACHING_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}
