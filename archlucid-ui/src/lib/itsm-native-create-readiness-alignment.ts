/** Stable exports for drift guards — ITSM native create default path (assessment Tier 2 #6). */

export const ITSM_NATIVE_CREATE_ADMIN_HREF = "/integrations/readiness";

export const ITSM_NATIVE_CREATE_REQUIRED_UI_TEST_IDS = [
  "finding-itsm-native-default-panel",
  "finding-itsm-export-panel",
  "admin-itsm-onboarding-wizard",
] as const;

export const ITSM_NATIVE_CREATE_REQUIRED_COMPONENTS = [
  "FindingItsmExportPanel",
  "AdminItsmConnectorOnboardingWizard",
  "ItsmOutboundCreateIssueDialog",
  "ItsmOutboundQuickActions",
] as const;
