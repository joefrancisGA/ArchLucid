import { describe, expect, it, beforeEach } from "vitest";

import {
  readSidebarNavGroupExpansionState,
  SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
  SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
  writeSidebarNavGroupExpansionState,
} from "@/lib/sidebar-nav-group-expansion-storage";

describe("sidebar-nav-group-expansion-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults review work expanded and deeper groups collapsed for fresh users", () => {
    expect(readSidebarNavGroupExpansionState()).toEqual(SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION);
  });

  it("persists expanded groups in versioned storage", () => {
    writeSidebarNavGroupExpansionState({
      pilot: true,
      "operate-analysis": true,
      "operate-architect-advanced": false,
      "operate-governance": false,
      "operate-reports": false,
      "operate-integrations": false,
      "operate-platform-ops": false,
      "operator-admin": true,
      "operator-system-admin": false,
    });

    expect(readSidebarNavGroupExpansionState()).toEqual({
      pilot: true,
      "operate-analysis": true,
      "operate-architect-advanced": true,
      "operate-governance": false,
      "operate-reports": false,
      "operate-integrations": false,
      "operate-platform-ops": false,
      "operator-admin": true,
      "operator-system-admin": false,
    });
  });

  it("migrates legacy administration preference without resetting other groups", () => {
    localStorage.setItem("archlucid_nav_show_administration", "1");

    expect(readSidebarNavGroupExpansionState()["operator-admin"]).toBe(true);
    expect(readSidebarNavGroupExpansionState()["operate-analysis"]).toBe(false);
  });

  it("migrates legacy extended/advanced preferences to expanded analysis and governance", () => {
    localStorage.setItem("archlucid_nav_show_extended", "1");
    localStorage.setItem("archlucid_nav_show_advanced", "1");

    const state = readSidebarNavGroupExpansionState();

    expect(state["operate-analysis"]).toBe(true);
    expect(state["operate-governance"]).toBe(true);
    expect(state["operate-reports"]).toBe(true);
    expect(state["operate-integrations"]).toBe(true);
  });

  it("ignores corrupt v2 JSON safely and falls back to defaults when no legacy keys exist", () => {
    localStorage.setItem(SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY, "{not-json");

    expect(readSidebarNavGroupExpansionState()).toEqual(SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION);
  });
});
