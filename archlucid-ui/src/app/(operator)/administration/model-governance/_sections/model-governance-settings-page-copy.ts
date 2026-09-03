import {
  AI_MODELS_SETTINGS_PAGE_SUBTITLE,
} from "@/lib/model-governance-settings-evidence-copy";

export const MODEL_GOVERNANCE_SETTINGS_PRIMARY_CONTENT_ID = "model-governance-settings-primary-content" as const;

export const MODEL_GOVERNANCE_SETTINGS_FIRST_VIEWPORT_ID = "model-governance-settings-first-viewport" as const;

export const MODEL_GOVERNANCE_SETTINGS_SKIP_TARGET_ID = MODEL_GOVERNANCE_SETTINGS_FIRST_VIEWPORT_ID;

export const MODEL_GOVERNANCE_SETTINGS_SKIP_LINK_LABEL = "Skip to AI models workspace" as const;

export const AI_MODELS_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Review which models run each review task and manage the workspace execution profile and allowed models." as const;

export function modelGovernanceSettingsPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? AI_MODELS_SETTINGS_PAGE_SUBTITLE_BUYER : AI_MODELS_SETTINGS_PAGE_SUBTITLE;
}
