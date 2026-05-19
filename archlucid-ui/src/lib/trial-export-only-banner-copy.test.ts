import { describe, expect, it } from "vitest";

import { formatTrialExportOnlyPurgeHeadline } from "./trial-export-only-banner-copy";

describe("formatTrialExportOnlyPurgeHeadline", () => {
  it("formats purge countdown copy", () => {
    expect(formatTrialExportOnlyPurgeHeadline(12)).toBe("12 days until hard purge removes this workspace");
    expect(formatTrialExportOnlyPurgeHeadline(1)).toBe("1 day until hard purge removes this workspace");
    expect(formatTrialExportOnlyPurgeHeadline(0)).toBe("Hard purge is imminent — download your data now");
  });
});
