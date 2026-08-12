import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  IDENTITY_PROVIDERS_SAML_TRAFFIC_NOTE,
  IDENTITY_PROVIDERS_SAML_TRAFFIC_PATH,
  IDENTITY_PROVIDERS_SAML_TRAFFIC_ROW_ID,
  IDENTITY_PROVIDERS_SAML_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-identity-providers-saml";

describe("ui-route-traffic-identity-providers-saml (ASA)", () => {
  it("tracks SAML settings under Settings with honest access-hub notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, IDENTITY_PROVIDERS_SAML_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(IDENTITY_PROVIDERS_SAML_TRAFFIC_PATH);
    expect(row?.section).toBe(IDENTITY_PROVIDERS_SAML_TRAFFIC_SECTION);
    expect(row?.notes).toBe(IDENTITY_PROVIDERS_SAML_TRAFFIC_NOTE);
    expect(row?.notes).toContain("IdentityProvidersSamlPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
