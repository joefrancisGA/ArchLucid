import { describe, expect, it } from "vitest";

import {
  SECURENOW_COMPLIANCE_HOME_ROWS,
  SECURENOW_COMPLIANCE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-compliance-home-copy";
import {
  SECURENOW_INFRASTRUCTURE_HOME_ROWS,
  SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-infrastructure-home-copy";
import {
  secureNowCloudConnectionsHelpSubtitle,
  secureNowCloudConnectionsHubContextualLead,
  secureNowCloudConnectionsSummary,
  secureNowCloudInventoryEvidenceSummary,
} from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  SECURENOW_SECURITY_HOME_ROWS,
  SECURENOW_SECURITY_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-security-home-copy";

const SECURENOW_EXCLUDED_HYPERSCALER_PATTERN = /\bAWS\b|\bGCP\b|Google Cloud/i;

describe("SecureNow home copy hyperscaler guard", () => {
  const homeDestinationRows = [
    ...SECURENOW_SECURITY_HOME_ROWS,
    ...SECURENOW_COMPLIANCE_HOME_ROWS,
    ...SECURENOW_INFRASTRUCTURE_HOME_ROWS,
  ];

  const homeSectionLeads = [
    SECURENOW_SECURITY_HOME_SECTION_LEAD,
    SECURENOW_COMPLIANCE_HOME_SECTION_LEAD,
    SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD,
  ];

  const secureNowCloudConnectionCopy = [
    secureNowCloudConnectionsSummary(),
    secureNowCloudConnectionsHelpSubtitle(),
    secureNowCloudConnectionsHubContextualLead(),
    secureNowCloudInventoryEvidenceSummary(),
  ];

  it("keeps AWS and GCP out of SecureNow home destination rows", () => {
    for (const row of homeDestinationRows) {
      expect(row.label).not.toMatch(SECURENOW_EXCLUDED_HYPERSCALER_PATTERN);
      expect(row.summary).not.toMatch(SECURENOW_EXCLUDED_HYPERSCALER_PATTERN);
    }
  });

  it("keeps AWS and GCP out of SecureNow home section leads", () => {
    for (const lead of homeSectionLeads) {
      expect(lead).not.toMatch(SECURENOW_EXCLUDED_HYPERSCALER_PATTERN);
    }
  });

  it("keeps AWS and GCP out of SecureNow cloud connection copy helpers", () => {
    for (const copy of secureNowCloudConnectionCopy) {
      expect(copy).not.toMatch(SECURENOW_EXCLUDED_HYPERSCALER_PATTERN);
    }
  });
});
