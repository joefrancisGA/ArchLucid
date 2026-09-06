import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";

const WORKING_PRIMARY_NAV_BUILDER_IDS = ["pilot", "operate-analysis", "operate-governance", "operate-policy"] as const;

const WORKING_PRIMARY_NAV_BANNED_PATTERNS = [
  "fleet llm cogs",
  "service bus",
  "packager",
  "extractor zip",
  "integration dlq",
  "trial funnel",
  "rag health",
] as const;

describe("working primary nav chrome guard (LI-10)", () => {
  it("keeps ops implementation labels off review-workflow nav groups", () => {
    const violations: string[] = [];

    for (const groupId of WORKING_PRIMARY_NAV_BUILDER_IDS) {
      const group = NAV_GROUPS.find((candidate) => candidate.id === groupId);

      expect(group, groupId).toBeDefined();

      for (const link of group!.links) {
        const haystack = `${link.label} ${link.title ?? ""}`.toLowerCase();

        for (const pattern of WORKING_PRIMARY_NAV_BANNED_PATTERNS) {
          if (haystack.includes(pattern)) {
            violations.push(`${groupId} ${link.href}: "${pattern}"`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps shortcut registry Alt+N copy architecture-first on Working (CA-33)", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/shortcut-registry.ts"), "utf8");

    expect(source).toContain("WORKING_ALT_N_SHORTCUT_DESCRIPTION");
    expect(source).toContain("last architecture");
    expect(source).not.toMatch(/open the draft editor/i);
  });
});
