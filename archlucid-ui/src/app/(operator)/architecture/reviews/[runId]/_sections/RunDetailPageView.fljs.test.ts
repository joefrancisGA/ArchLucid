import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function sectionSource(fileName: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), fileName), "utf8");
}

const viewSource = sectionSource("RunDetailPageView.tsx");
const presentationSource = sectionSource("run-detail-page-presentation.ts");

describe("RunDetailPageView FLJS (wave 15 item 4)", () => {
  it("defers run-detail-workspace-derive via dynamic import", () => {
    expect(presentationSource).toContain("await import(\"@/lib/run-detail-workspace-derive\")");
    // A value import would pull the derive module into the route's initial server chunk.
    expect(presentationSource).not.toMatch(/^import\s+\{[^}]*\}\s+from\s+["']@\/lib\/run-detail-workspace-derive["']/m);
    expect(viewSource).not.toMatch(/from\s+["']@\/lib\/run-detail-workspace-derive["']/);
  });
});
