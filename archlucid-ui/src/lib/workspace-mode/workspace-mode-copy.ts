import type { WorkspaceModeId } from "@/lib/workspace-mode/workspace-mode";

export const WORKSPACE_MODE_GUIDED_LABEL = "Guided";

export const WORKSPACE_MODE_WORKING_LABEL = "Working";

export const WORKSPACE_MODE_PREFERENCE_HEADING = "Workspace mode";

export const WORKSPACE_MODE_PREFERENCE_LEAD =
  "Guided adds teaching for your first review. Working hides teaching so daily work stays out of the way. Both modes use live architecture packages — not sample data.";

export const WORKSPACE_MODE_GUIDED_DESCRIPTION =
  "Teaching chrome on; live reviews and findings.";

export const WORKSPACE_MODE_WORKING_DESCRIPTION =
  "Split workbench, full shell density, longer idle timeout, and teaching chrome off.";

export const WORKSPACE_MODE_PREFERENCE_HELPER =
  "You can switch back anytime. This does not change your packages, findings, or audit trail.";

export const WORKSPACE_MODE_GRADUATION_TITLE = "You can work without the teaching layer now.";

export const WORKSPACE_MODE_GRADUATION_LEAD =
  "You have a sealed architecture package. Working mode hides teaching chrome so you can triage and decide faster.";

export const WORKSPACE_MODE_GRADUATION_CHANGES = [
  "Home leads with your work queue.",
  "Architecture, findings, and evidence stay on screen in the workbench.",
  "Full architect workspace density without a deploy flag.",
  "Getting started moves out of the main navigation (still in Help).",
  "Teaching strips and tour prompts stay hidden.",
] as const;

export const WORKSPACE_MODE_GRADUATION_UNCHANGED =
  "Your packages, findings, and audit trail do not change.";

export const WORKSPACE_MODE_GRADUATION_SWITCH_CTA = "Switch to Working";

export const WORKSPACE_MODE_GRADUATION_KEEP_GUIDED_CTA = "Keep Guided";

export const WORKSPACE_MODE_GRADUATION_REMIND_CTA = "Remind me after my next review";

export const WORKSPACE_MODE_GUIDED_TEACHING_OFFER_TITLE = "Need guided mode?";

export const WORKSPACE_MODE_GUIDED_TEACHING_OFFER_LEAD =
  "You are in Working mode. Guided mode restores teaching strips, tours, and first-session navigation hints.";

export const WORKSPACE_MODE_GUIDED_TEACHING_OFFER_SWITCH_CTA = "Switch to Guided";

export const WORKSPACE_MODE_GUIDED_TEACHING_OFFER_KEEP_WORKING_CTA = "Keep Working";

export const WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_LABEL = "Guided mode";

export const WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_DETAIL =
  "Teaching strips, tours, and first-session navigation hints are on.";

export const WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_TITLE = "Switch to Working mode?";

export const WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_LEAD =
  "Working mode hides teaching chrome so you can triage and decide faster.";

export const WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_STAY_CTA = "Stay in Guided";

export const WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_SWITCH_CTA = "Switch to Working";

export const WORKSPACE_MODE_SWITCHED_TO_WORKING_TOAST =
  "Switched to Working mode. Turn Guided mode back on anytime in Personal preferences.";

export function workspaceModeLabel(mode: WorkspaceModeId): string {
  if (mode === "working") {
    return WORKSPACE_MODE_WORKING_LABEL;
  }

  return WORKSPACE_MODE_GUIDED_LABEL;
}
