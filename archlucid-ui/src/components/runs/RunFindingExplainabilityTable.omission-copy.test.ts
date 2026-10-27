import { describe, expect, it } from "vitest";

import {
  RUN_FINDING_EXPLAINABILITY_EVIDENCE_LINK_OMITTED,
  RUN_FINDING_EXPLAINABILITY_GAPS_NOT_STORED,
  RUN_FINDING_EXPLAINABILITY_GAPS_STORED_EMPTY,
  RUN_FINDING_EXPLAINABILITY_TITLE_OMITTED,
  RUN_FINDING_EXPLAINABILITY_TRACE_LABEL_OMITTED,
} from "@/components/runs/RunFindingExplainabilityTable";
import { formatFindingExplainabilityPolicyRuleDisplay } from "@/lib/findings/finding-explainability-summary";

export const RUN_FINDING_EXPLAINABILITY_TRACE_COMPLETENESS_OMITTED =
  "Trace completeness was not stored." as const;

export const RUN_FINDING_EXPLAINABILITY_CONFIDENCE_OMITTED = "Confidence was not stored." as const;

describe("RunFindingExplainabilityTable omission copy (P-07, P-19)", () => {
  it("uses not-stored sentences for policy rule, evidence link, and title gaps", () => {
    expect(formatFindingExplainabilityPolicyRuleDisplay("")).toBe("Policy rule was not stored.");
    expect(RUN_FINDING_EXPLAINABILITY_EVIDENCE_LINK_OMITTED).toBe("Evidence link was not stored.");
    expect(RUN_FINDING_EXPLAINABILITY_TITLE_OMITTED).toBe("Finding title was not stored.");
    expect(RUN_FINDING_EXPLAINABILITY_TRACE_LABEL_OMITTED).toBe("Trace label was not stored.");
    expect(RUN_FINDING_EXPLAINABILITY_TRACE_COMPLETENESS_OMITTED).toBe(
      "Trace completeness was not stored.",
    );
    expect(RUN_FINDING_EXPLAINABILITY_CONFIDENCE_OMITTED).toBe("Confidence was not stored.");
    expect(RUN_FINDING_EXPLAINABILITY_GAPS_NOT_STORED).toBe("Gaps were not stored");
    expect(RUN_FINDING_EXPLAINABILITY_GAPS_STORED_EMPTY).toBe("Gaps were stored empty.");
  });
});
