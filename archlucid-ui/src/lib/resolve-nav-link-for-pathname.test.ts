import { CloudCog, Hash, ListOrdered, Ticket, Users, Workflow } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";
import { TEAMS_SURFACE_ICON } from "@/lib/teams-surface-icon";
import { WEBHOOKS_SURFACE_ICON } from "@/lib/webhooks-surface-icon";

import { resolveNavIconForHref, resolveNavLinkForPathname } from "./resolve-nav-link-for-pathname";

describe("resolveNavLinkForPathname", () => {
  it("maps one canonical route to one nav icon", () => {
    expect(resolveNavIconForHref(INTEGRATIONS_WEBHOOKS_PATH)).toBe(WEBHOOKS_SURFACE_ICON);
    expect(resolveNavIconForHref(INTEGRATIONS_JIRA_PATH)).toBe(Ticket);
    expect(resolveNavIconForHref(INTEGRATIONS_SERVICENOW_PATH)).toBe(Workflow);
    expect(resolveNavIconForHref(INTEGRATIONS_TEAMS_PATH)).toBe(TEAMS_SURFACE_ICON);
    expect(resolveNavIconForHref(INTEGRATIONS_SLACK_PATH)).toBe(Hash);
    expect(resolveNavIconForHref(CLOUD_CONNECTIONS_PATH)).toBe(CloudCog);
  });

  it("uses longest-prefix match for nested integration routes", () => {
    expect(resolveNavLinkForPathname("/integrations/cloud-connections/azure")?.icon).toBe(CloudCog);
    expect(resolveNavLinkForPathname("/integrations/jira/settings")?.href).toBe(INTEGRATIONS_JIRA_PATH);
  });

  it("does not assign nav icons to help guide articles", () => {
    expect(resolveNavIconForHref("/help/getting-started")).toBeUndefined();
    expect(resolveNavIconForHref("/help/billing-and-plans")).toBeUndefined();
  });

  it("assigns the reviews nav icon to nested review detail routes", () => {
    expect(resolveNavIconForHref("/architecture/reviews/runs/00000000-0000-0000-0000-000000000001")).toBe(
      ListOrdered,
    );
  });

  it("keeps Microsoft Teams distinct from Users & roles", () => {
    expect(resolveNavIconForHref(INTEGRATIONS_TEAMS_PATH)).toBe(TEAMS_SURFACE_ICON);
    expect(resolveNavIconForHref("/administration/users")).toBe(Users);
    expect(resolveNavIconForHref(INTEGRATIONS_TEAMS_PATH)).not.toBe(resolveNavIconForHref("/administration/users"));
  });

  it("does not duplicate route identity for the same href", () => {
    const first = resolveNavLinkForPathname(INTEGRATIONS_WEBHOOKS_PATH);
    const second = resolveNavLinkForPathname(INTEGRATIONS_WEBHOOKS_PATH);

    expect(first).toBe(second);
    expect(first?.icon).toBe(WEBHOOKS_SURFACE_ICON);
  });
});
