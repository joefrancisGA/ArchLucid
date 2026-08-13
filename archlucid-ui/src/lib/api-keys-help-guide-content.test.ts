import { describe, expect, it } from "vitest";

import {
  API_KEYS_HELP_GUIDE_HEADINGS,
  API_KEYS_HELP_PAGE_SUBTITLE,
  API_KEYS_HELP_PRIMARY_ACTIONS,
} from "@/lib/api-keys-help-guide-content";
import { API_KEYS_HELP_SOURCES } from "@/lib/api-keys-help-evidence-copy";
import { API_KEYS_PAGE_SUBTITLE } from "@/lib/api-keys-settings-copy";
import { API_KEYS_SETTINGS_RETIRED_ROUTE_PATH } from "@/lib/api-keys-settings-evidence-copy";

describe("api-keys-help-guide-content", () => {
  it("uses a help-specific subtitle instead of the settings page subtitle", () => {
    expect(API_KEYS_HELP_PAGE_SUBTITLE).not.toBe(API_KEYS_PAGE_SUBTITLE);
    expect(API_KEYS_HELP_PAGE_SUBTITLE.toLowerCase()).not.toContain("manage");
  });

  it("routes primary actions to live destinations", () => {
    expect(API_KEYS_HELP_PRIMARY_ACTIONS.usersAndRoles.href).toBe("/administration/users");
    expect(API_KEYS_HELP_PRIMARY_ACTIONS.cliUsageHelp.href).toBe("/help/cli-usage");
    expect(API_KEYS_HELP_PRIMARY_ACTIONS.audit.href).toBe("/governance/audit");

    const actionHrefs = Object.values(API_KEYS_HELP_PRIMARY_ACTIONS).map((action) => action.href);

    for (const href of actionHrefs) {
      expect(href).not.toBe(API_KEYS_SETTINGS_RETIRED_ROUTE_PATH);
    }
  });

  it("lists four on-page headings so the TOC rail can render", () => {
    expect(API_KEYS_HELP_GUIDE_HEADINGS).toHaveLength(4);
    expect(API_KEYS_HELP_GUIDE_HEADINGS.map((heading) => heading.id)).toEqual([
      "where-to-go-in-this-release",
      "what-api-keys-are-for",
      "what-to-do-instead",
      "where-to-go-next",
    ]);
  });

  it("lists five live Sources without the retired settings route", () => {
    expect(API_KEYS_HELP_SOURCES).toHaveLength(5);
    expect(API_KEYS_HELP_SOURCES.some((link) => link.href === API_KEYS_SETTINGS_RETIRED_ROUTE_PATH)).toBe(false);
  });
});
