/**
 * TB-2234 — Scope switcher first-open teaching (tenant → workspace → project).
 *
 * Distinct from WorkspaceScopeEmptyTeaching (TB-2195), which only explains empty
 * hub lists under a specific selection. This coach teaches the hierarchy once
 * when the scope switcher popover first opens.
 */

import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";

export const WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY =
  "archlucid_workspace_switcher_teaching_dismissed_v1" as const;

export type WorkspaceSwitcherTeachingStepId = "tenant" | "workspace" | "project";

export type WorkspaceSwitcherTeachingStep = {
  readonly id: WorkspaceSwitcherTeachingStepId;
  readonly label: string;
  readonly body: string;
};

export type WorkspaceSwitcherTeachingModel = {
  readonly heading: string;
  readonly lead: string;
  readonly steps: readonly WorkspaceSwitcherTeachingStep[];
  readonly dismissLabel: string;
};

export const WORKSPACE_SWITCHER_TEACHING_HEADING = "How scope works" as const;

export function workspaceSwitcherTeachingLead(productLineId: ProductLineId = "architecture"): string {
  return `${productLineDisplayName(productLineId)} organizes work as tenant → workspace → project. This switcher sets which workspace and project you are viewing.`;
}

/** Architecture-shell default lead (legacy imports and tests). */
export const WORKSPACE_SWITCHER_TEACHING_LEAD = workspaceSwitcherTeachingLead("architecture");

export const WORKSPACE_SWITCHER_TEACHING_STEPS: readonly WorkspaceSwitcherTeachingStep[] = [
  {
    id: "tenant",
    label: "Tenant",
    body: "Your organization boundary — identity, billing, and admin settings live here.",
  },
  {
    id: "workspace",
    label: "Workspace",
    body: "A shared area for a team or program that holds architecture packages and reviews.",
  },
  {
    id: "project",
    label: "Project",
    body: "The active slice inside a workspace — lists and reviews follow this selection.",
  },
] as const;

/** Enterprise tone: the scope popover never ships a casual acknowledgement control. */
export const WORKSPACE_SWITCHER_TEACHING_DISMISS_LABEL = "Dismiss" as const;

/** Full first-open coach model (heading, lead, hierarchy steps). */
export function buildWorkspaceSwitcherTeaching(
  productLineId: ProductLineId = "architecture",
): WorkspaceSwitcherTeachingModel {
  return {
    heading: WORKSPACE_SWITCHER_TEACHING_HEADING,
    lead: workspaceSwitcherTeachingLead(productLineId),
    steps: WORKSPACE_SWITCHER_TEACHING_STEPS,
    dismissLabel: WORKSPACE_SWITCHER_TEACHING_DISMISS_LABEL,
  };
}

/** True when the operator has already dismissed the first-open coach. */
export function isWorkspaceSwitcherTeachingDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY) === "1";
  } catch {
    return true;
  }
}

/** Persist dismiss so the coach does not reappear on later opens. */
export function dismissWorkspaceSwitcherTeaching(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}
