import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  TRUST_CENTER_CANONICAL_MARKDOWN_RELATIVE_PATH,
  readTrustCenterMarkdown,
} from "@/lib/trust-center-marketing";
import {
  TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
  TRUST_PUBLIC_ASSURANCE_ARTIFACTS,
} from "@/lib/trust-center-public-assurance";

const TRUST_CENTER_POINTER_PATHS = [
  "docs/trust-center.md",
  "docs/security/trust-center.md",
  "docs/go-to-market/TRUST_CENTER.md",
] as const;

const POINTER_MARKERS = [/Trust Center \(moved\)/i, /canonical.*trust-center\.md/i];

function readRepoFile(relativePath: string): string {
  const monorepoPath = join(process.cwd(), "..", relativePath);
  const cwdPath = join(process.cwd(), relativePath);

  if (existsSync(monorepoPath)) {
    return readFileSync(monorepoPath, "utf8");
  }

  if (existsSync(cwdPath)) {
    return readFileSync(cwdPath, "utf8");
  }

  throw new Error(`Missing repo file: ${relativePath}`);
}

describe("trust-center-marketing (TB-737)", () => {
  it("reads canonical markdown from docs/go-to-market/trust-center.md", () => {
    const markdown = readTrustCenterMarkdown();

    expect(markdown).toContain("ArchLucid Trust Center");
    expect(markdown).toContain("TRUST_CENTER_LAST_REVIEWED_UTC");
    expect(existsSync(join(process.cwd(), "..", TRUST_CENTER_CANONICAL_MARKDOWN_RELATIVE_PATH))).toBe(true);
  });

  it("keeps duplicate trust-center copies as short pointer stubs", () => {
    for (const relativePath of TRUST_CENTER_POINTER_PATHS) {
      const text = readRepoFile(relativePath);
      const lineCount = text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;

      expect(lineCount).toBeLessThan(15);
      expect(POINTER_MARKERS.some((pattern) => pattern.test(text))).toBe(true);
      expect(text.toLowerCase()).toContain("trust-center.md");
    }
  });

  it("lists public assurance artifact hrefs that do not require sign-in", () => {
    const hrefs = TRUST_PUBLIC_ASSURANCE_ARTIFACTS.map((artifact) => artifact.href);

    expect(hrefs).toContain(TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF);
    expect(hrefs).toContain("/help/soc2-self-assessment");
    expect(hrefs).toContain("/help/caiq-sig-response");
    expect(hrefs).toContain("/help/procurement");

    for (const href of hrefs) {
      expect(href.startsWith("/auth")).toBe(false);
      expect(href.startsWith("/settings")).toBe(false);
    }
  });
});
