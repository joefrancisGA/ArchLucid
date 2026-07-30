import { describe, expect, it } from "vitest";

import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";

import {
  ITSM_CONNECTOR_SMOKE_HELP,
  ITSM_CONNECTOR_SMOKE_HELP_BANNED_HREFS,
  ITSM_PRODUCT_SMOKE_VERIFICATION_HREF,
} from "@/lib/itsm-connectors-admin-scope";

describe("itsm-connectors-admin-scope smoke help (TB-1433)", () => {
  it("points admin smoke runbooks at product integration and readiness surfaces", () => {
    expect(ITSM_CONNECTOR_SMOKE_HELP.jira).toBe(INTEGRATIONS_JIRA_PATH);
    expect(ITSM_CONNECTOR_SMOKE_HELP.serviceNow).toBe(INTEGRATIONS_SERVICENOW_PATH);
    expect(ITSM_CONNECTOR_SMOKE_HELP.scaffold).toBe(INTEGRATIONS_READINESS_PATH);
  });

  it("does not use generic customer troubleshooting as smoke destinations", () => {
    const hrefs = [
      ITSM_CONNECTOR_SMOKE_HELP.jira,
      ITSM_CONNECTOR_SMOKE_HELP.serviceNow,
      ITSM_CONNECTOR_SMOKE_HELP.scaffold,
      ITSM_PRODUCT_SMOKE_VERIFICATION_HREF,
    ];

    for (const href of hrefs) {
      for (const banned of ITSM_CONNECTOR_SMOKE_HELP_BANNED_HREFS) {
        expect(href, `smoke href must not be ${banned}`).not.toBe(banned);
      }
    }
  });
});
