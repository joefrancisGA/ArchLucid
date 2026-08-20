import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  TRUST_CENTER_CANONICAL_MARKDOWN_RELATIVE_PATH,
  readTrustCenterMarkdown,
} from "@/lib/trust-center-marketing";
import {
  TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
  TRUST_CENTER_RELATED_HELP_LINKS,
  TRUST_PUBLIC_ASSURANCE_ARTIFACTS,
} from "@/lib/trust-center-public-assurance";

const TRUST_CENTER_POINTER_PATHS = [
  "docs/trust-center.md",
  "docs/security/trust-center.md",
  "docs/go-to-market/TRUST_CENTER.md",
] as const;

describe("trust-center-marketing (TB-737)", () => {
  it("reads canonical markdown from docs/go-to-market/trust-center.md", () => {
    const markdown = readTrustCenterMarkdown();

    expect(markdown).toContain("ArchLucid Trust Center");
    expect(markdown).toContain("TRUST_CENTER_LAST_REVIEWED_UTC");
    expect(existsSync(join(process.cwd(), "..", TRUST_CENTER_CANONICAL_MARKDOWN_RELATIVE_PATH))).toBe(true);
  });

  it("does not keep duplicate trust-center markdown stubs", () => {
    for (const relativePath of TRUST_CENTER_POINTER_PATHS) {
      const monorepoPath = join(process.cwd(), "..", relativePath);
      const cwdPath = join(process.cwd(), relativePath);

      expect(existsSync(monorepoPath)).toBe(false);
      expect(existsSync(cwdPath)).toBe(false);
    }
  });

  it("routes evidence-pack ZIP through the same-origin marketing proxy as other public downloads", () => {
    expect(TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF).toBe(
      "/api/proxy/v1/marketing/trust-center/evidence-pack.zip",
    );
  });

  it("lists public assurance artifact hrefs that do not require sign-in", () => {
    const hrefs = TRUST_PUBLIC_ASSURANCE_ARTIFACTS.map((artifact) => artifact.href);

    expect(hrefs).toContain(TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF);
    expect(hrefs).toContain("/help/soc2-self-assessment");
    expect(hrefs).toContain("/help/caiq-sig-response");
    expect(hrefs).toContain("/help/procurement");

    for (const href of hrefs) {
      expect(href.startsWith("/auth")).toBe(false);
      expect(href.startsWith("/administration")).toBe(false);
    }
  });

  it("links Trust Center questionnaire pre-fills to the CAIQ/SIG specialty help guide (TB-1635)", () => {
    const caiqLite = TRUST_PUBLIC_ASSURANCE_ARTIFACTS.find((artifact) => artifact.id === "caiq-lite");
    const sigCore = TRUST_PUBLIC_ASSURANCE_ARTIFACTS.find((artifact) => artifact.id === "sig-core");
    const relatedHelp = TRUST_CENTER_RELATED_HELP_LINKS.find((link) => link.id === "caiq-sig-response");

    expect(caiqLite?.href).toBe("/help/caiq-sig-response");
    expect(sigCore?.href).toBe("/help/caiq-sig-response");
    expect(relatedHelp?.label).toMatch(/pre-fill drafts/i);
    expect(relatedHelp?.href).toBe("/help/caiq-sig-response");
  });
});
