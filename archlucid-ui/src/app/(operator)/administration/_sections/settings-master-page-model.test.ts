import { describe, expect, it } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { settingsMasterAudienceForScope } from "./settings-master-audience";
import { SETTINGS_MASTER_SECTIONS } from "./settings-master-catalog";
import { buildSettingsMasterVisibleSections } from "./settings-master-page-model";
import type { SettingsMasterDestination } from "./settings-master-types";

/**
 * Personal settings are user-scoped rows that are not internal-shell chrome. Internal developer tools are
 * user-scoped but stay in the hub behind `showInternalShell`, so they are excluded here.
 */
function personalDestinationIds(destinations: readonly SettingsMasterDestination[]): string[] {
  return destinations
    .filter((destination) => destination.tier !== "internal")
    .filter((destination) => settingsMasterAudienceForScope(destination.scope) === "self")
    .map((destination) => destination.id);
}

describe("settings-master-page-model", () => {
  it("shows security for read-tier users without advanced or internal sections", () => {
    const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: false,
    });

    const ids = sections.map((section) => section.id);

    expect(ids).toContain("security-trust");
    expect(ids).not.toContain("workspace");
    expect(ids).not.toContain("advanced");
    expect(ids).not.toContain("developer-internal");
  });

  /** TB-1200 retired the destination-less Help section; help now ships as the page-heading contextual help button. */
  it("publishes no destination-less Help section in the hub catalog", () => {
    expect(SETTINGS_MASTER_SECTIONS.some((section) => section.id === "help")).toBe(false);
  });

  it("keeps personal settings out of the hub at every rank", () => {
    const ranks = [AUTHORITY_RANK.ReadAuthority, AUTHORITY_RANK.ExecuteAuthority, AUTHORITY_RANK.AdminAuthority];

    for (const callerAuthorityRank of ranks) {
      const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
        callerAuthorityRank,
        isAuthorityLoading: false,
        showInternalShell: true,
        searchQuery: "",
        showAdvanced: true,
      });

      expect(personalDestinationIds(sections.flatMap((section) => section.destinations))).toEqual([]);
    }
  });

  it("registers no personal setting in the hub catalog — those belong to SELF_SETTINGS_DESTINATIONS", () => {
    expect(personalDestinationIds(SETTINGS_MASTER_SECTIONS.flatMap((section) => section.destinations))).toEqual([]);
  });

  it("keeps internal developer tools in the hub even though they are user-scoped", () => {
    const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
      isAuthorityLoading: false,
      showInternalShell: true,
      searchQuery: "",
      showAdvanced: false,
    });

    const destinationIds = sections.flatMap((section) => section.destinations).map((destination) => destination.id);

    expect(destinationIds).toContain("developer-tools");
  });

  it("hides internal developer tools when the internal shell is off (TB-1899)", () => {
    const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: false,
    });

    const destinationIds = sections.flatMap((section) => section.destinations).map((destination) => destination.id);

    expect(destinationIds).not.toContain("developer-tools");
  });

  it("includes support for execute-tier users but keeps workspace settings admin-only", () => {
    const executeIds = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: false,
    }).map((section) => section.id);

    const adminIds = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: false,
    }).map((section) => section.id);

    expect(executeIds).toContain("support");
    expect(executeIds).not.toContain("workspace");
    expect(adminIds).toContain("workspace");
  });

  it("filters sections by search query", () => {
    const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "billing",
      showAdvanced: false,
    });

    expect(sections).toHaveLength(1);
    expect(sections[0]?.id).toBe("billing");
  });

  it("reveals advanced destinations when advanced toggle is on", () => {
    const hidden = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: false,
    });
    const shown = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: true,
    });

    expect(hidden.some((section) => section.id === "advanced")).toBe(false);
    expect(shown.some((section) => section.id === "advanced")).toBe(true);
  });

  it("hides architecture-review destinations from the Security product settings hub", () => {
    const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
      isAuthorityLoading: false,
      showInternalShell: true,
      searchQuery: "",
      showAdvanced: true,
      productLine: "security",
    });
    const hrefs = sections.flatMap((section) => section.destinations).map((destination) => destination.href);

    expect(hrefs).toContain("/integrations/cloud-connections");
    expect(hrefs).toContain("/administration/users");
    expect(hrefs).toContain("/administration/auth-domains");
    expect(hrefs).toContain("/administration/extract-upload");
    expect(hrefs).not.toContain("/governance/approval-queue");
    expect(hrefs).not.toContain("/governance/policy-packs");
    expect(hrefs).not.toContain("/administration/ai-usage");
    expect(hrefs).not.toContain("/administration/workspace-settings/recycle-bin");
  });
});
