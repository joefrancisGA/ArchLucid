import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { accessibilityPolicyMarkdownCandidatePaths } from "@/lib/accessibility-marketing-policy";

describe("accessibilityPolicyMarkdownCandidatePaths", () => {
  it("includes Docker, monorepo, and Next standalone layouts", () => {
    const cwd = "/app/.next/standalone";
    const paths = accessibilityPolicyMarkdownCandidatePaths(cwd);

    expect(paths).toContain(join(cwd, "go-to-market-samples", "ACCESSIBILITY.md"));
    expect(paths).toContain(join(cwd, "..", "ACCESSIBILITY.md"));
    expect(paths).toContain(join(cwd, "..", "..", "ACCESSIBILITY.md"));
    expect(paths).toContain(join(cwd, "ACCESSIBILITY.md"));
  });
});
