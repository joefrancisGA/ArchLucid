import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round83 mounted contract", () => {
  it("digest scoped versus subscription, golden disabled and finalize, compare partial inventory", () => {
    expect(readUiSource("components/digests/DigestsBrowseContent.tsx")).toContain(
      'data-testid="digests-browse-scoped-and-subscription-filter-empty"',
    );
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      'data-testid="golden-manifest-export-disabled-and-finalize"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPanel.tsx")).toContain(
      "CompareQualityDeltaPartialInventoryFootnote",
    );
  });
});
