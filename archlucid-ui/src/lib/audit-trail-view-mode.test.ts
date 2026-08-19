import { afterEach, describe, expect, it } from "vitest";

import {
  AUDIT_TRAIL_VIEW_MODE_STORAGE_KEY,
  AUDIT_TRAIL_VIEW_STORY_INTRO,
  AUDIT_TRAIL_VIEW_STORY_LABEL,
  AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL,
  AUDIT_TRAIL_VIEW_TABLE_INTRO,
  AUDIT_TRAIL_VIEW_TABLE_LABEL,
  defaultAuditTrailViewMode,
  isAuditTrailViewMode,
  parseAuditTrailViewMode,
  readAuditTrailViewModeFromStorage,
  resolveAuditTrailViewMode,
  writeAuditTrailViewModeToStorage,
} from "@/lib/audit-trail-view-mode";

describe("audit-trail-view-mode", () => {
  afterEach(() => {
    window.localStorage.removeItem(AUDIT_TRAIL_VIEW_MODE_STORAGE_KEY);
  });

  it("exposes story and table labels plus switcher group label", () => {
    expect(AUDIT_TRAIL_VIEW_STORY_LABEL).toBe("Story");
    expect(AUDIT_TRAIL_VIEW_TABLE_LABEL).toBe("Table");
    expect(AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL).toBe("Audit trail view");
    expect(AUDIT_TRAIL_VIEW_STORY_INTRO.toLowerCase()).toContain("architecture package");
    expect(AUDIT_TRAIL_VIEW_TABLE_INTRO.toLowerCase()).toContain("architecture package");
  });

  it("defaults story for buyer-polished shell and table for full operator", () => {
    expect(defaultAuditTrailViewMode(true)).toBe("story");
    expect(defaultAuditTrailViewMode(false)).toBe("table");
  });

  it("narrows valid modes and rejects unknown values", () => {
    expect(isAuditTrailViewMode("story")).toBe(true);
    expect(isAuditTrailViewMode("table")).toBe(true);
    expect(isAuditTrailViewMode("timeline")).toBe(false);
    expect(isAuditTrailViewMode("")).toBe(false);
    expect(isAuditTrailViewMode(null)).toBe(false);
  });

  it("parses stored raw strings with trim", () => {
    expect(parseAuditTrailViewMode("story")).toBe("story");
    expect(parseAuditTrailViewMode(" table ")).toBe("table");
    expect(parseAuditTrailViewMode("cards")).toBeNull();
    expect(parseAuditTrailViewMode(null)).toBeNull();
  });

  it("resolves stored preference over shell default", () => {
    expect(
      resolveAuditTrailViewMode({ buyerPolishedShell: true, storedMode: "table" }),
    ).toBe("table");
    expect(
      resolveAuditTrailViewMode({ buyerPolishedShell: false, storedMode: "story" }),
    ).toBe("story");
    expect(
      resolveAuditTrailViewMode({ buyerPolishedShell: true, storedMode: null }),
    ).toBe("story");
    expect(
      resolveAuditTrailViewMode({ buyerPolishedShell: false, storedMode: null }),
    ).toBe("table");
  });

  it("persists and reads view mode from localStorage", () => {
    expect(readAuditTrailViewModeFromStorage()).toBeNull();

    writeAuditTrailViewModeToStorage("story");

    expect(window.localStorage.getItem(AUDIT_TRAIL_VIEW_MODE_STORAGE_KEY)).toBe("story");
    expect(readAuditTrailViewModeFromStorage()).toBe("story");

    writeAuditTrailViewModeToStorage("table");

    expect(readAuditTrailViewModeFromStorage()).toBe("table");
  });

  it("ignores corrupt localStorage values", () => {
    window.localStorage.setItem(AUDIT_TRAIL_VIEW_MODE_STORAGE_KEY, "not-a-mode");

    expect(readAuditTrailViewModeFromStorage()).toBeNull();
  });
});
