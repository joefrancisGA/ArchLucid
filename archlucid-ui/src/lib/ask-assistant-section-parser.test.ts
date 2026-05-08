import { describe, expect, it } from "vitest";

import { parseAskAssistantStructuredSections } from "./ask-assistant-section-parser";

describe("parseAskAssistantStructuredSections", () => {
  it("returns null when there are no section headers", () => {
    expect(parseAskAssistantStructuredSections("Plain answer only.")).toBeNull();
  });

  it("parses four blocks with blank lines after headers", () => {
    const raw =
      "Here is the structured summary.\n\n" +
      "Risk:\n\n" +
      "PHI may be over-retained at intake.\n\n" +
      "Evidence:\n\n" +
      "Manifest §4 and finding F-01.\n\n" +
      "Mitigation:\n\n" +
      "Minimize fields at the adapter.\n\n" +
      "Validation:\n\n" +
      "Re-run checklist C-12 before go-live.";

    const parsed = parseAskAssistantStructuredSections(raw);

    expect(parsed).not.toBeNull();
    expect(parsed!.preamble).toBe("Here is the structured summary.");
    expect(parsed!.sections).toHaveLength(4);
    expect(parsed!.sections[0].key).toBe("risk");
    expect(parsed!.sections[0].body).toContain("over-retained");
    expect(parsed!.sections[3].key).toBe("validation");
  });

  it("accepts markdown heading for the first section", () => {
    const raw = "### Risk:\n\nBody one.\n\nEvidence:\n\nBody two.";

    const parsed = parseAskAssistantStructuredSections(raw);

    expect(parsed).not.toBeNull();
    expect(parsed!.sections).toHaveLength(2);
    expect(parsed!.sections[0].title).toBe("Risk");
    expect(parsed!.sections[1].body).toContain("Body two");
  });
});
