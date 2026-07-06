import { describe, expect, it } from "vitest";

import { PIPELINE_STATUS_BUYER_DISPLAY_LABELS, PIPELINE_STATUS_TOOLTIPS } from "@/lib/i18n";
import { PIPELINE_STATUS_BUYER_LABEL_BANNED_PATTERNS } from "@/lib/pipeline-status-label-surfaces";

const PIPELINE_BUYER_COPY_OBJECTS: ReadonlyArray<Record<string, string>> = [
  PIPELINE_STATUS_BUYER_DISPLAY_LABELS,
  PIPELINE_STATUS_TOOLTIPS,
];

describe("pipeline status label guard (TB-651)", () => {
  it("keeps buyer pipeline labels and tooltips free of engineering jargon", () => {
    for (const labels of PIPELINE_BUYER_COPY_OBJECTS) {
      const text = JSON.stringify(labels).toLowerCase();

      for (const pattern of PIPELINE_STATUS_BUYER_LABEL_BANNED_PATTERNS) {
        expect(text, `pipeline copy should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });
});
