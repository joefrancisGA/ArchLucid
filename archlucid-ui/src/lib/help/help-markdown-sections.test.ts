import { describe, expect, it } from "vitest";

import { extractMarkdownSectionsByAnchor, omitMarkdownSectionsByAnchor } from "@/lib/help/help-markdown-sections";

const SAMPLE = `# Cloud connections

Optional intro paragraph.

---

## Connect Azure securely {#connect-azure-securely}

Azure body.

### Security model

- Federation

---

## Workload identity federation {#workload-identity-federation}

Federation body.

---

## Related topics {#related-topics}

Links.
`;

describe("extractMarkdownSectionsByAnchor", () => {
  it("returns only requested anchor sections", () => {
    const result = extractMarkdownSectionsByAnchor(SAMPLE, ["connect-azure-securely"]);

    expect(result).toContain("Connect Azure securely");
    expect(result).toContain("Azure body.");
    expect(result).not.toContain("Optional intro paragraph.");
    expect(result).not.toContain("Federation body.");
  });

  it("includes intro when requested", () => {
    const result = extractMarkdownSectionsByAnchor(SAMPLE, ["connect-azure-securely"], true);

    expect(result).toContain("Optional intro paragraph.");
    expect(result).toContain("Azure body.");
  });

  it("returns full markdown when no anchors are requested", () => {
    expect(extractMarkdownSectionsByAnchor(SAMPLE, [])).toBe(SAMPLE);
  });

  it("omits requested anchor sections while keeping intro and other sections", () => {
    const result = omitMarkdownSectionsByAnchor(SAMPLE, ["related-topics"]);

    expect(result).toContain("Optional intro paragraph.");
    expect(result).toContain("Azure body.");
    expect(result).not.toContain("Related topics");
    expect(result).not.toContain("Links.");
  });
});
