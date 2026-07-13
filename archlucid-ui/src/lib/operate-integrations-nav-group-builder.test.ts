import { Ticket, Workflow } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { OperateIntegrationsNavGroupBuilder } from "@/lib/operate-integrations-nav-group-builder";
import { OperatorAdminNavGroupBuilder } from "@/lib/operator-admin-nav-group-builder";
import { WEBHOOKS_SURFACE_ICON } from "@/lib/webhooks-surface-icon";

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

  it("exposes Webhooks in Integrations nav with shared surface icon and extended tier", () => {
    const group = new OperateIntegrationsNavGroupBuilder().build();
    const webhooksLink = group.links.find((link) => link.href === INTEGRATIONS_WEBHOOKS_PATH);
    const slackIndex = group.links.findIndex((link) => link.href === "/integrations/slack");

    expect(webhooksLink).toBeDefined();
    expect(webhooksLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.webhooks);
    expect(webhooksLink?.icon).toBe(WEBHOOKS_SURFACE_ICON);
    expect(webhooksLink?.tier).toBe("extended");
    expect(group.links.findIndex((link) => link.href === INTEGRATIONS_WEBHOOKS_PATH)).toBeGreaterThan(slackIndex);
  });

  it("lists dedicated integration routes before Webhooks", () => {
    const group = new OperateIntegrationsNavGroupBuilder().build();
    const hrefs = group.links.map((link) => link.href);

    expect(hrefs).toEqual([
      "/integrations/cloud-connections",
      INTEGRATIONS_JIRA_PATH,
      INTEGRATIONS_SERVICENOW_PATH,
      "/integrations/teams",
      "/integrations/slack",
      INTEGRATIONS_WEBHOOKS_PATH,
    ]);
  });
});
