import { describe, expect, it } from "vitest";

import {
  RUN_FINDING_EXPLAINABILITY_EVIDENCE_LINK_OMITTED,
  RUN_FINDING_EXPLAINABILITY_TITLE_OMITTED,
} from "@/components/runs/RunFindingExplainabilityTable";
import { formatFindingExplainabilityPolicyRuleDisplay } from "@/lib/findings/finding-explainability-summary";

describe("RunFindingExplainabilityTable omission copy (P-03–P-05)", () => {
  it("uses not-stored sentences for policy rule, evidence link, and title gaps", () => {
    expect(formatFindingExplainabilityPolicyRuleDisplay("")).toBe("Policy rule was not stored.");
    expect(RUN_FINDING_EXPLAINABILITY_EVIDENCE_LINK_OMITTED).toBe("Evidence link was not stored.");
    expect(RUN_FINDING_EXPLAINABILITY_TITLE_OMITTED).toBe("Finding title was not stored.");
  });
});
