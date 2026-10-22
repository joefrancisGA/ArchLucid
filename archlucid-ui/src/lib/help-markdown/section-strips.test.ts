import { describe, expect, it } from "vitest";

import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";

const SOURCE = [
  "Intro paragraph.",
  "",
  "## Keep this",
  "",
  "Buyer copy.",
  "",
  "## Contributor notes",
  "",
  "Internal detail.",
  "",
  "## Keep this too",
  "",
  "More buyer copy.",
].join("\n");

describe("stripMarkdownSectionsByTitlePrefix", () => {
  it("drops only the sections whose H2 title starts with an omitted prefix", () => {
    const stripped = stripMarkdownSectionsByTitlePrefix(SOURCE, ["contributor notes"]);

    expect(stripped).toContain("## Keep this");
    expect(stripped).toContain("## Keep this too");
    expect(stripped).not.toContain("## Contributor notes");
    expect(stripped).not.toContain("Internal detail.");
  });

  it("keeps preamble copy that precedes the first heading", () => {
    const stripped = stripMarkdownSectionsByTitlePrefix(SOURCE, ["keep this"]);

    expect(stripped).toContain("Intro paragraph.");
  });

  it("returns the markdown unchanged when no title matches", () => {
    expect(stripMarkdownSectionsByTitlePrefix(SOURCE, ["nothing here"])).toBe(SOURCE);
  });

  it("matches titles case-insensitively and ignores a trailing anchor", () => {
    const markdown = ["## Contributor Notes {#contributor-notes}", "", "Internal detail."].join("\n");

    expect(stripMarkdownSectionsByTitlePrefix(markdown, ["contributor notes"])).toBe("");
  });

  it("leaves deeper headings inside a kept section alone by default", () => {
    const markdown = ["## Keep this", "", "### Contributor notes", "", "Internal detail."].join("\n");

    expect(stripMarkdownSectionsByTitlePrefix(markdown, ["contributor notes"])).toBe(markdown);
  });

  it("drops H3 sections when the caller opts into deeper heading levels", () => {
    const markdown = [
      "## Keep this",
      "",
      "### Contributor notes",
      "",
      "Internal detail.",
      "",
      "### Buyer subsection",
      "",
      "Buyer copy.",
    ].join("\n");

    const stripped = stripMarkdownSectionsByTitlePrefix(markdown, ["contributor notes"], {
      headingLevels: [2, 3],
    });

    expect(stripped).toContain("### Buyer subsection");
    expect(stripped).not.toContain("### Contributor notes");
    expect(stripped).not.toContain("Internal detail.");
  });

  it("keeps allowlisted lines that sit inside an omitted section", () => {
    const markdown = [
      "## Contributor notes",
      "",
      "Internal detail.",
      "See [readiness](/help/integration-readiness).",
    ].join("\n");

    const stripped = stripMarkdownSectionsByTitlePrefix(markdown, ["contributor notes"], {
      keepLinesContaining: ["/help/integration-readiness"],
    });

    expect(stripped).toContain("/help/integration-readiness");
    expect(stripped).not.toContain("Internal detail.");
  });

  it("drops prefixed lines everywhere, including inside kept sections", () => {
    const markdown = ["## Keep this", "", "**Out of scope for V1.**", "Buyer copy."].join("\n");

    const stripped = stripMarkdownSectionsByTitlePrefix(markdown, ["contributor notes"], {
      dropLinesStartingWith: ["**Out of scope"],
    });

    expect(stripped).toContain("Buyer copy.");
    expect(stripped).not.toContain("Out of scope");
  });

  it("collapses blank-line runs and trims the tail when asked", () => {
    const markdown = ["## Keep this", "", "Buyer copy.", "", "", "## Contributor notes", ""].join("\n");

    expect(
      stripMarkdownSectionsByTitlePrefix(markdown, ["contributor notes"], { collapseBlankLines: true }),
    ).toBe("## Keep this\n\nBuyer copy.");
  });

  it("leaves the blank lines left behind by the removal in place by default", () => {
    const markdown = ["## Keep this", "", "Buyer copy.", "", "", "## Contributor notes", ""].join("\n");

    expect(stripMarkdownSectionsByTitlePrefix(markdown, ["contributor notes"])).toBe(
      "## Keep this\n\nBuyer copy.\n\n",
    );
  });

  it("returns an empty string for empty input", () => {
    expect(stripMarkdownSectionsByTitlePrefix("", ["contributor notes"])).toBe("");
  });
});
