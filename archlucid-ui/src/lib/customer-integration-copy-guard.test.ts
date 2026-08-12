import { describe, expect, it } from "vitest";

import {
  CUSTOMER_INTEGRATION_BANNED_PHRASES,
  listCustomerIntegrationCopyViolations,
} from "@/lib/customer-integration-copy-guard";
import {
  ITSM_INTEGRATION_READINESS_AFTER_LINK,
  ITSM_INTEGRATION_READINESS_HELPER,
  ITSM_NATIVE_CREATE_READY_MESSAGE,
  ITSM_NOT_CONFIGURED_ADMIN_LEAD,
  ITSM_NOT_CONFIGURED_OPERATOR_LEAD,
  ITSM_NOT_CONFIGURED_READINESS_CTA,
  ITSM_PLATFORM_OPERATOR_NOTES_BODY,
  ITSM_PLATFORM_OPERATOR_NOTES_SUMMARY,
  ITSM_PRODUCT_PAGE_COPY,
} from "@/lib/itsm-product-integration-page-copy";
import {
  TEAMS_INTEGRATION_CONNECT_SECTION_LEAD,
  TEAMS_INTEGRATION_CONNECT_SECTION_TITLE,
  TEAMS_INTEGRATION_DEMO_CAPABILITY_DESCRIPTION,
  TEAMS_INTEGRATION_DISABLE_CONFIRM,
  TEAMS_INTEGRATION_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_PAGE_TITLE,
  TEAMS_INTEGRATION_REMOVE_CONFIRM,
  TEAMS_INTEGRATION_SAVE_SUCCESS,
  TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
  TEAMS_INTEGRATION_SECRET_EXAMPLE,
  TEAMS_INTEGRATION_SECRET_HELPER,
  TEAMS_INTEGRATION_SECRET_NAME_LABEL,
  TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE,
  TEAMS_INTEGRATION_SECRET_NAME_REQUIRED_MESSAGE,
  TEAMS_INTEGRATION_SECURITY_NOTE,
  TEAMS_INTEGRATION_TEST_FAILURE,
  TEAMS_INTEGRATION_TEST_SUCCESS,
  TEAMS_INTEGRATION_TRIGGER_REQUIRED,
} from "@/lib/teams-integration-page-copy";

function buildTeamsIntegrationCopySurfaces(): Record<string, string> {
  return {
    pageTitle: TEAMS_INTEGRATION_PAGE_TITLE,
    pageSubtitle: TEAMS_INTEGRATION_PAGE_SUBTITLE,
    securityNote: TEAMS_INTEGRATION_SECURITY_NOTE,
    connectSectionTitle: TEAMS_INTEGRATION_CONNECT_SECTION_TITLE,
    connectSectionLead: TEAMS_INTEGRATION_CONNECT_SECTION_LEAD,
    secretNameLabel: TEAMS_INTEGRATION_SECRET_NAME_LABEL,
    secretHelper: TEAMS_INTEGRATION_SECRET_HELPER,
    secretExample: TEAMS_INTEGRATION_SECRET_EXAMPLE,
    saveSuccess: TEAMS_INTEGRATION_SAVE_SUCCESS,
    removeConfirm: TEAMS_INTEGRATION_REMOVE_CONFIRM,
    disableConfirm: TEAMS_INTEGRATION_DISABLE_CONFIRM,
    testSuccess: TEAMS_INTEGRATION_TEST_SUCCESS,
    testFailure: TEAMS_INTEGRATION_TEST_FAILURE,
    triggerRequired: TEAMS_INTEGRATION_TRIGGER_REQUIRED,
    demoCapabilityDescription: TEAMS_INTEGRATION_DEMO_CAPABILITY_DESCRIPTION,
    secretNameRequiredMessage: TEAMS_INTEGRATION_SECRET_NAME_REQUIRED_MESSAGE,
    secretNameNotUrlMessage: TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE,
    secretAccessFailureMessage: TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
  };
}

function buildItsmProductIntegrationCopySurfaces(): Record<string, string> {
  const surfaces: Record<string, string> = {
    readinessAfterLink: ITSM_INTEGRATION_READINESS_AFTER_LINK,
    readinessHelper: ITSM_INTEGRATION_READINESS_HELPER,
    platformOperatorNotesSummary: ITSM_PLATFORM_OPERATOR_NOTES_SUMMARY,
    platformOperatorNotesBody: ITSM_PLATFORM_OPERATOR_NOTES_BODY,
    nativeCreateReadyMessage: ITSM_NATIVE_CREATE_READY_MESSAGE,
    notConfiguredAdminLead: ITSM_NOT_CONFIGURED_ADMIN_LEAD,
    notConfiguredOperatorLead: ITSM_NOT_CONFIGURED_OPERATOR_LEAD,
    notConfiguredReadinessCta: ITSM_NOT_CONFIGURED_READINESS_CTA,
  };

  for (const [productId, copy] of Object.entries(ITSM_PRODUCT_PAGE_COPY)) {
    surfaces[`${productId}.pageTitle`] = copy.pageTitle;
    surfaces[`${productId}.summary`] = copy.summary;
    surfaces[`${productId}.connectionTestLead`] = copy.connectionTestLead;
    surfaces[`${productId}.smokeHelpLabel`] = copy.smokeHelpLabel;
  }

  return surfaces;
}

describe("customer-integration-copy-guard (TB-776)", () => {
  it("defines the expected banned deployment-operator phrases", () => {
    expect(CUSTOMER_INTEGRATION_BANNED_PHRASES).toEqual([
      "host configuration",
      "tenant sql",
      "key vault materialization",
      "integrations:itsm",
      "vendor probe",
      "smoke checklist",
    ]);
  });

  it("detects banned phrases in arbitrary surfaces", () => {
    const violations = listCustomerIntegrationCopyViolations({
      leaky: "Integrations:ItsmOutbound:Enabled requires host configuration",
    });

    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.includes("integrations:itsm"))).toBe(true);
    expect(violations.some((v) => v.includes("host configuration"))).toBe(true);
  });

  it("keeps Teams integration copy constants free of banned deployment-operator phrases", () => {
    expect(listCustomerIntegrationCopyViolations(buildTeamsIntegrationCopySurfaces())).toEqual([]);
  });

  it("keeps ITSM product integration copy constants free of banned deployment-operator phrases", () => {
    expect(listCustomerIntegrationCopyViolations(buildItsmProductIntegrationCopySurfaces())).toEqual([]);
  });
});
