import { describe, expect, it } from "vitest";

import { RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE } from "@/lib/bulk-evidence-upload-copy";

describe("bulk-evidence-upload-copy", () => {
  it("exposes the shared Evidence capture section title (TB-1849)", () => {
    expect(RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE).toBe("Add evidence");
  });
});
