import { describe, expect, it } from "vitest";

import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { suggestFramingAnswersFromOverview } from "@/lib/architecture/architecture-intelligence-framing-suggest";

describe("architecture-intelligence-framing-suggest", () => {
  it("infers business outcome and architecture kind from overview text", () => {
    const suggestions = suggestFramingAnswersFromOverview(
      [
        { questionId: "business-outcome", prompt: "Outcome?" },
        { questionId: "architecture-kind", prompt: "Kind?" },
      ],
      {
        combinedSourceText: "This is a migration from monolith to services.",
        businessOutcome: "Process claims faster",
      },
    );

    expect(suggestions).toEqual({
      "business-outcome": "Process claims faster",
      "architecture-kind": "Migration",
    });
  });

  it("uses confirmed constraints for fixed-decisions suggestions", () => {
    const brief = emptyArchitectureDraftStructuredBrief();
    const structuredBrief = {
      ...brief,
      confirmedConstraints: ["Azure-only deployment"],
    };

    const suggestions = suggestFramingAnswersFromOverview(
      [{ questionId: "fixed-decisions", prompt: "Fixed?" }],
      {
        combinedSourceText: "Overview only",
        structuredBrief,
      },
    );

    expect(suggestions).toEqual({
      "fixed-decisions": "Azure-only deployment",
    });
  });
});
