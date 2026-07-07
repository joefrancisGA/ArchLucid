import { describe, expect, it } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { SETTINGS_MASTER_SECTIONS } from "./settings-master-catalog";
import { buildSettingsMasterVisibleSections } from "./settings-master-page-model";

describe("settings-master-page-model", () => {
  it("shows general and security for read-tier users without advanced or internal sections", () => {
    const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: false,
    });

    const ids = sections.map((section) => section.id);

    expect(ids).toContain("general");
    expect(ids).toContain("security-trust");
    expect(ids).not.toContain("workspace");
    expect(ids).not.toContain("advanced");
    expect(ids).not.toContain("developer-internal");
  });

  it("includes workspace and support for execute-tier users", () => {
    const sections = buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
      callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
      isAuthorityLoading: false,
      showInternalShell: false,
      searchQuery: "",
      showAdvanced: false,
    });

    const ids = sections.map((section) => section.id);

    expect(ids).toContain("workspace");
    expect(ids).toContain("support");
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
});
