import { describe, expect, it } from "vitest";

import {
  AZURE_PERMISSIONS_COST_OPTIONAL_NOTE,
  AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_INTRO,
} from "@/lib/azure-cloud-connection-permissions-copy";
import {
  AZURE_PERMISSIONS_HELP_BANNED_PRIMARY_CHROME_COPY,
  formatAzurePermissionsHelpRequirementsReviewedLine,
} from "@/lib/azure-permissions-help-evidence-copy";

describe("azure-permissions-help-chrome-honesty (TB-1628)", () => {
  it("keeps buyer-facing permission copy free of eng tier jargon", () => {
    const buyerFacingCopy = [
      AZURE_PERMISSIONS_COST_OPTIONAL_NOTE,
      AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_INTRO,
      formatAzurePermissionsHelpRequirementsReviewedLine("2026-07-13"),
    ];

    for (const line of buyerFacingCopy) {
      for (const banned of AZURE_PERMISSIONS_HELP_BANNED_PRIMARY_CHROME_COPY) {
        expect(line).not.toContain(banned);
      }
    }
  });

  it("formats reviewed disclosure without release-contract theater", () => {
    expect(formatAzurePermissionsHelpRequirementsReviewedLine("2026-07-13")).toBe(
      "Permission requirements last reviewed on 2026-07-13.",
    );
    expect(formatAzurePermissionsHelpRequirementsReviewedLine("2026-07-13")).not.toMatch(/release contract/i);
  });
});
