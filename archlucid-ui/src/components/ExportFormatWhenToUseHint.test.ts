import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EXPORT_FORMAT_MARKDOWN } from "@/lib/export-format-when-to-use";

describe("ExportFormatWhenToUseHint (TB-2202)", () => {
  const source = readFileSync(join(import.meta.dirname, "ExportFormatWhenToUseHint.tsx"), "utf8");

  it("renders whenToUse from the export-format SoT", () => {
    expect(source).toContain("getExportFormatWhenToUse");
    expect(source).toContain("export-format-when-to-use-${props.format}");
    expect(EXPORT_FORMAT_MARKDOWN.whenToUse.length).toBeGreaterThan(20);
  });
});