import { Ticket, Workflow } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";
import { OperateIntegrationsNavGroupBuilder } from "@/lib/operate-integrations-nav-group-builder";
import { OperatorAdminNavGroupBuilder } from "@/lib/operator-admin-nav-group-builder";

describe("OperateIntegrationsNavGroupBuilder", () => {
  it("omits connector readiness from Integrations — surfaced in Administration (TB-647)", () => {
    const group = new OperateIntegrationsNavGroupBuilder().build();

    expect(group.links.some((link) => link.href === "/integrations/readiness")).toBe(false);
  });

  it("labels integration readiness nav as Connection status in Administration (TB-530)", () => {
    const group = new OperatorAdminNavGroupBuilder().build();
    const readinessLink = group.links.find((link) => link.href === "/integrations/readiness");

    expect(readinessLink?.label).toBe("Connection status");
  });

  it("assigns distinct icons to Jira and ServiceNow integration nav links", () => {
    const group = new OperateIntegrationsNavGroupBuilder().build();
    const jiraLink = group.links.find((link) => link.href === INTEGRATIONS_JIRA_PATH);
    const serviceNowLink = group.links.find((link) => link.href === INTEGRATIONS_SERVICENOW_PATH);

    expect(jiraLink?.icon).toBe(Ticket);
    expect(serviceNowLink?.icon).toBe(Workflow);
    expect(jiraLink?.icon).not.toBe(serviceNowLink?.icon);
  });
});
