import { describe, expect, it } from "vitest";

import {
  TEAMS_INTEGRATION_CONNECT_SECTION_LEAD,
  TEAMS_INTEGRATION_HOSTED_SECRET_STORE_FOOTNOTE,
  TEAMS_INTEGRATION_SECRET_HELPER,
  TEAMS_INTEGRATION_SECRET_NAME_LABEL,
  TEAMS_INTEGRATION_SECURITY_NOTE,
} from "./teams-integration-page-copy";

describe("teams-integration-page-copy (TB-771)", () => {
  it("uses provider-neutral secret-store language in primary customer strings", () => {
    expect(TEAMS_INTEGRATION_SECRET_NAME_LABEL).toBe("Secret name");
    expect(TEAMS_INTEGRATION_SECURITY_NOTE).toMatch(/approved secret store/i);
    expect(TEAMS_INTEGRATION_CONNECT_SECTION_LEAD).toMatch(/secret that contains your Teams incoming webhook URL/i);
    expect(TEAMS_INTEGRATION_SECRET_HELPER).toMatch(/secret name or reference/i);
    expect(TEAMS_INTEGRATION_SECURITY_NOTE).not.toMatch(/Key Vault/i);
    expect(TEAMS_INTEGRATION_CONNECT_SECTION_LEAD).not.toMatch(/Key Vault/i);
    expect(TEAMS_INTEGRATION_SECRET_HELPER).not.toMatch(/Key Vault/i);
  });

  it("mentions Azure Key Vault only in the hosted-deployment footnote", () => {
    expect(TEAMS_INTEGRATION_HOSTED_SECRET_STORE_FOOTNOTE).toMatch(/Azure Key Vault/i);
    expect(TEAMS_INTEGRATION_HOSTED_SECRET_STORE_FOOTNOTE).toMatch(/AWS Secrets Manager/i);
    expect(TEAMS_INTEGRATION_HOSTED_SECRET_STORE_FOOTNOTE).toMatch(/Google Secret Manager/i);
  });
});
