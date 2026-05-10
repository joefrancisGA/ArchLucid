import { describe, expect, it } from "vitest";

import {
  classifyArtifactView,
  getArtifactFormatLabel,
  getArtifactTypeDescription,
  getArtifactTypeLabel,
  prepareArtifactBodyText,
  sponsorArtifactAudienceBucket,
  sponsorArtifactAudienceLine,
  sponsorArtifactDownloadActionLabel,
  sponsorArtifactOpenActionLabel,
  sponsorArtifactSecondaryCaption,
  stripArtifactFilenameExtension,
} from "./artifact-review-helpers";

describe("sponsorArtifactOpenActionLabel", () => {
  it("uses sponsor verbs for MarkdownReport", () => {
    expect(sponsorArtifactOpenActionLabel("MarkdownReport")).toBe("Open sponsor brief");
  });

  it("falls back for unknown types", () => {
    expect(sponsorArtifactOpenActionLabel("UnknownSynthetic")).toBe("Open output");
  });
});

describe("sponsorArtifactDownloadActionLabel", () => {
  it("pairs EvidenceBundle with audit wording", () => {
    expect(sponsorArtifactDownloadActionLabel("EvidenceBundle")).toBe("Download audit evidence");
  });

  it("falls back for unknown types", () => {
    expect(sponsorArtifactDownloadActionLabel("UnknownSynthetic")).toBe("Download");
  });
});

describe("sponsorArtifactAudienceBucket", () => {
  it("classifies sponsor-only lines", () => {
    expect(sponsorArtifactAudienceBucket("MarkdownReport")).toBe("sponsor");
  });

  it("classifies audit-oriented lines", () => {
    expect(sponsorArtifactAudienceBucket("EvidenceBundle")).toBe("audit");
  });

  it("classifies mixed sponsor/architect copy into shared", () => {
    expect(sponsorArtifactAudienceBucket("CostSummary")).toBe("shared");
  });

  it("returns other when no audience hint exists", () => {
    expect(sponsorArtifactAudienceBucket("UnknownSyntheticType")).toBe("other");
  });
});

describe("sponsorArtifactAudienceLine", () => {
  it("returns sponsor-oriented line for MarkdownReport", () => {
    expect(sponsorArtifactAudienceLine("MarkdownReport")).toContain("sponsor");
  });

  it("returns audit-oriented line for EvidenceBundle", () => {
    expect(sponsorArtifactAudienceLine("EvidenceBundle")).toContain("audit");
  });

  it("returns null for unknown artifact types", () => {
    expect(sponsorArtifactAudienceLine("UnknownSyntheticType")).toBeNull();
  });
});

describe("classifyArtifactView", () => {
  it("classifies markdown", () => {
    expect(classifyArtifactView("markdown", "X")).toBe("markdown");
  });

  it("classifies mermaid", () => {
    expect(classifyArtifactView("mermaid", "MermaidDiagram")).toBe("mermaid");
  });

  it("classifies json format", () => {
    expect(classifyArtifactView("json", "CostSummary")).toBe("json");
  });

  it("classifies DiagramAst by type", () => {
    expect(classifyArtifactView("txt", "DiagramAst")).toBe("json");
  });
});

describe("getArtifactFormatLabel", () => {
  it("returns Markdown for markdown format", () => {
    expect(getArtifactFormatLabel("markdown")).toBe("Markdown");
  });

  it("returns JSON for json format", () => {
    expect(getArtifactFormatLabel("json")).toBe("JSON");
  });

  it("returns Diagram source for mermaid", () => {
    expect(getArtifactFormatLabel("mermaid")).toBe("Diagram source");
  });

  it("passes through unknown formats unchanged", () => {
    expect(getArtifactFormatLabel("xlsx")).toBe("xlsx");
  });
});

describe("getArtifactTypeLabel", () => {
  it("returns friendly label for known type", () => {
    expect(getArtifactTypeLabel("CostSummary")).toContain("Cost");
  });

  it("splits unknown PascalCase", () => {
    expect(getArtifactTypeLabel("FooBar")).toBe("Foo Bar");
  });
});

describe("getArtifactTypeDescription", () => {
  it("returns non-empty for known type", () => {
    expect(getArtifactTypeDescription("Inventory").length).toBeGreaterThan(20);
  });
});

describe("sponsorArtifactSecondaryCaption", () => {
  it("returns null when the filename stem extends the business label", () => {
    expect(
      sponsorArtifactSecondaryCaption(
        "Sponsor briefing — Claims Intake Modernization.md",
        "Sponsor briefing",
      ),
    ).toBeNull();
  });

  it("returns null when stem equals label case-insensitively", () => {
    expect(sponsorArtifactSecondaryCaption("Sponsor briefing.pdf", "Sponsor briefing")).toBeNull();
  });

  it("returns stem when it adds distinct context", () => {
    expect(sponsorArtifactSecondaryCaption("Intake modernization context diagram.mmd", "Intake context diagram")).toBe(
      "Intake modernization context diagram",
    );
  });
});

describe("stripArtifactFilenameExtension", () => {
  it("removes common trailing extensions for marketing captions", () => {
    expect(stripArtifactFilenameExtension("Sponsor briefing — Claims Intake Modernization.md")).toBe(
      "Sponsor briefing — Claims Intake Modernization",
    );

    expect(stripArtifactFilenameExtension("decisions.bundle.json")).toBe("decisions.bundle");

    expect(stripArtifactFilenameExtension("flow.mmd")).toBe("flow");
  });
});

describe("prepareArtifactBodyText", () => {
  it("pretty-prints JSON", () => {
    const result = prepareArtifactBodyText('{"a":1}', "json", "CostSummary");

    expect(result.jsonPrettyFailed).toBe(false);
    expect(result.readableText).toContain("\n");
  });

  it("marks json failure when invalid", () => {
    const result = prepareArtifactBodyText("{", "json", "CostSummary");

    expect(result.jsonPrettyFailed).toBe(true);
  });
});
