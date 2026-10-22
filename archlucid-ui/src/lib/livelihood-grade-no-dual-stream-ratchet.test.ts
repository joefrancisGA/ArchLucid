import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_GRADE_NO_DUAL_STREAM_TRACE_SYNTHESIS_GUARD,
} from "@/lib/livelihood-grade-no-dual-stream-ratchet";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-grade-no dual-stream ratchet (LN-010)", () => {
  it("forbids explanation-trace synthesis paths in quick-decision merge", () => {
    const mergeSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/quick-decision-finding-merge-and-sort.ts"),
      "utf8",
    );
    const resolverSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/quick-decision-finding-stream-resolver.ts"),
      "utf8",
    );

    expect(mergeSource).toContain(LIVELIHOOD_GRADE_NO_DUAL_STREAM_TRACE_SYNTHESIS_GUARD);
    expect(mergeSource).toMatch(/return false/);
    expect(mergeSource).toMatch(/Never synthesizes finding cards from explanation traces/);
    expect(resolverSource).toMatch(/sealed|agent/i);
  });
});
