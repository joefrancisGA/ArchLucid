import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EXTRACT_UPLOAD_SETTINGS_TRAFFIC_NOTE,
  EXTRACT_UPLOAD_SETTINGS_TRAFFIC_PATH,
  EXTRACT_UPLOAD_SETTINGS_TRAFFIC_ROW_ID,
  EXTRACT_UPLOAD_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-extract-upload-settings";

describe("ui-route-traffic-extract-upload-settings (ADX)", () => {
  it("tracks Extract and Upload settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, EXTRACT_UPLOAD_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(EXTRACT_UPLOAD_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(EXTRACT_UPLOAD_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(EXTRACT_UPLOAD_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ExtractUploadSettingsPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
