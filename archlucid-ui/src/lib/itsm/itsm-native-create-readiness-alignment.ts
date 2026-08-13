/** Stable exports for drift guards — ITSM native create default path (assessment Tier 2 #6). */

import { ADMINISTRATION_CONNECTION_STATUS_PATH } from "@/lib/integrations-nav-paths";

export const ITSM_NATIVE_CREATE_ADMIN_HREF = ADMINISTRATION_CONNECTION_STATUS_PATH;

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
