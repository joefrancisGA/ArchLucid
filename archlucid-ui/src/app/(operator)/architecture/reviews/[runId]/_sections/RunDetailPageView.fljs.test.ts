import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const viewSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

describe("RunDetailPageView FLJS (wave 15 item 4)", () => {
  it("defers run-detail-workspace-derive via dynamic import", () => {
    expect(viewSource).toContain("await import(\"@/lib/run-detail-workspace-derive\")");
    expect(viewSource).not.toMatch(/from\s+["']@\/lib\/run-detail-workspace-derive["']/);
  });
});
