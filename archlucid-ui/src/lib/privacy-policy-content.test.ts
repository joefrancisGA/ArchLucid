import { describe, expect, it } from "vitest";

import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import {
  parsePrivacyPolicyEffectiveDate,
  parsePrivacyPolicyMetadata,
  preparePrivacyPolicyBodyMarkdown,
  PRIVACY_POLICY_CONTROLLED_SOURCE_PATH,
  resolvePrivacyPolicyQuickNavLinks,
  stripPrivacyPolicyRelatedDocumentsSection,
} from "@/lib/privacy-policy-content";
import { readPrivacyPolicyMarkdown } from "@/lib/privacy-policy-marketing";

const SAMPLE_MARKDOWN = `> scope

<!-- PRIVACY_POLICY_LAST_REVIEWED_UTC:2026-05-10 -->

# ArchLucid Privacy Policy

**Effective date:** 2026-04-26

**Last reviewed (UTC):** 2026-05-10

---

## 1. Who we are

Body one.

## 2. What personal information we collect

Body two.

## 13. Contact us

Contact body.

## Related documents

| Doc | Use |
|-----|-----|
| [Trust Center](trust-center.md) | Index |
`;

describe("privacy-policy-content", () => {
  it("reads controlled metadata from the canonical markdown source", () => {
    const markdown = readPrivacyPolicyMarkdown();
    const metadata = parsePrivacyPolicyMetadata(markdown);

    expect(metadata.sourcePath).toBe(PRIVACY_POLICY_CONTROLLED_SOURCE_PATH);
    expect(metadata.effectiveDate).toBe("2026-04-26");
    expect(metadata.lastReviewedUtc).toBe("2026-07-25");
    expect(metadata.documentVersion).toBe("2026-07-25");
  });

  it("parses effective and reviewed dates from sample markdown", () => {
    expect(parsePrivacyPolicyEffectiveDate(SAMPLE_MARKDOWN)).toBe("2026-04-26");
    expect(parsePrivacyPolicyMetadata(SAMPLE_MARKDOWN).lastReviewedUtc).toBe("2026-05-10");
  });

  it("strips page chrome and related-documents section without changing operative sections", () => {
    const body = preparePrivacyPolicyBodyMarkdown(SAMPLE_MARKDOWN);

    expect(body).toContain("## 1. Who we are");
    expect(body).toContain("## 2. What personal information we collect");
    expect(body).toContain("## 13. Contact us");
    expect(body).not.toContain("# ArchLucid Privacy Policy");
    expect(body).not.toContain("## Related documents");
    expect(body).not.toMatch(/^---$/m);
    expect(stripPrivacyPolicyRelatedDocumentsSection(body)).toBe(body);
  });

  it("rewrites public body links away from repo .md paths", () => {
    const body = preparePrivacyPolicyBodyMarkdown(readPrivacyPolicyMarkdown());

    expect(body).not.toMatch(/\.md\b/i);
    expect(body).not.toContain("PRIVACY_NOTE");
    expect(body).not.toContain("SYSTEM_THREAT_MODEL");
    expect(body).not.toContain("git history");
    // Filename-shaped labels resolve to the registry title, so the DPA link renders "(template)".
    expect(body).toContain("[Data Processing Agreement (template)](/help/dpa-template)");
    expect(body).toContain("[subprocessors list](/help/subprocessors)");
    expect(body).toContain("[Trust Center](/trust)");
    expect(body).toContain("[Assurance status](/security-trust)");
  });

  it("resolves quick navigation anchors from numbered headings", () => {
    const headings = extractHelpMarkdownHeadings(preparePrivacyPolicyBodyMarkdown(SAMPLE_MARKDOWN));
    const quickNav = resolvePrivacyPolicyQuickNavLinks(headings);

    expect(quickNav.map((item) => item.label)).toEqual(["Information we collect", "Contact us"]);
    expect(quickNav.find((item) => item.label === "Information we collect")?.href).toBe(
      "#2-what-personal-information-we-collect",
    );
    expect(quickNav.find((item) => item.label === "Contact us")?.href).toBe("#13-contact-us");
  });
});
