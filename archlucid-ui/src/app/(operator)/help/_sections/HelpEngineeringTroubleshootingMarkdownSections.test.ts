import { describe, expect, it } from "vitest";

import { splitEngineeringTroubleshootingMarkdownSections } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingMarkdownSections";

describe("splitEngineeringTroubleshootingMarkdownSections", () => {
  it("splits markdown into h2-bound sections with stable ids and keeps preamble", () => {
    const markdown = [
      "# Title",
      "",
      "**Goal:** Faster triage.",
      "",
      "## First section",
      "Body one",
      "",
      "## Second section",
      "Body two",
    ].join("\n");

    const { preamble, sections } = splitEngineeringTroubleshootingMarkdownSections(markdown);

    expect(preamble).toContain("# Title");
    expect(preamble).toContain("**Goal:** Faster triage.");
    expect(sections).toHaveLength(2);
    expect(sections[0]?.title).toBe("First section");
    expect(sections[0]?.body).toContain("Body one");
    expect(sections[1]?.title).toBe("Second section");
    expect(sections[1]?.body).toContain("Body two");
    expect(sections[0]?.id).toMatch(/^first-section/);
  });

  it("returns empty preamble when markdown starts at the first h2", () => {
    const markdown = ["## Only section", "Body"].join("\n");

    const { preamble, sections } = splitEngineeringTroubleshootingMarkdownSections(markdown);

    expect(preamble).toBe("");
    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe("Only section");
  });
});
