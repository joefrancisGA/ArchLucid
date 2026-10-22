import { describe, expect, it } from "vitest";

import {
  TEAMS_INTEGRATION_CONNECT_SECTION_LEAD,
  TEAMS_INTEGRATION_DRAFT_NOT_SAVED_HELPER,
  TEAMS_INTEGRATION_SECRET_HELPER,
  TEAMS_INTEGRATION_SECRET_NAME_LABEL,
  TEAMS_INTEGRATION_SECURITY_NOTE,
} from "./teams-integration-page-copy";

describe("teams-integration-page-copy (TB-771)", () => {
  it("labels unsaved Teams forms as draft (TB-1175)", () => {
    expect(TEAMS_INTEGRATION_DRAFT_NOT_SAVED_HELPER).toMatch(/Draft — not saved/i);
  });

  it("uses provider-neutral secret-store language in primary customer strings", () => {
    expect(TEAMS_INTEGRATION_SECRET_NAME_LABEL).toBe("Secret name");
    expect(TEAMS_INTEGRATION_SECURITY_NOTE).toMatch(/approved secret store/i);
    expect(TEAMS_INTEGRATION_CONNECT_SECTION_LEAD).toMatch(/secret that contains your Teams incoming webhook URL/i);
    expect(TEAMS_INTEGRATION_SECRET_HELPER).toMatch(/secret name or reference/i);
    expect(TEAMS_INTEGRATION_SECURITY_NOTE).not.toMatch(/Key Vault/i);
    expect(TEAMS_INTEGRATION_CONNECT_SECTION_LEAD).not.toMatch(/Key Vault/i);
    expect(TEAMS_INTEGRATION_SECRET_HELPER).not.toMatch(/Key Vault/i);
  });
});
