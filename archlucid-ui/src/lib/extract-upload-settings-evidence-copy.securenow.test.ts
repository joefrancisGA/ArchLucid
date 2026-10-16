import { describe, expect, it } from "vitest";

import {
  EXTRACT_UPLOAD_SETTINGS_SECURENOW_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES,
  extractUploadSettingsSources,
  extractUploadSettingsSourcesIntro,
} from "@/lib/extract-upload-settings-evidence-copy";

describe("extract-upload-settings-evidence-copy SecureNow", () => {
  it("uses inventory workbench follow-ups without architecture review intake", () => {
    const sources = extractUploadSettingsSources("security");
    const hrefs = sources.map((source) => source.href);

    expect(hrefs).not.toContain("/architecture/reviews/new");
    expect(hrefs).not.toContain("/help/evidence-intake");
    expect(hrefs).toContain("/infrastructure/resources");
    expect(hrefs).toContain("/compliance/policy-packs");
    expect(extractUploadSettingsSourcesIntro("security")).not.toMatch(/review run/i);
    expect(EXTRACT_UPLOAD_SETTINGS_SOURCES.map((source) => source.href)).toContain("/architecture/reviews/new");
    expect(EXTRACT_UPLOAD_SETTINGS_SECURENOW_SOURCES.map((source) => source.label)).not.toContain(
      "Evidence intake help",
    );
  });
});
