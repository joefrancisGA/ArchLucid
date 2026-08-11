import { describe, expect, it } from "vitest";

import {
  FINDINGS_QUEUE_SEARCH_EVIDENCE_COMPACT_LINE,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_HEADING,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK,
  FINDINGS_QUEUE_SEARCH_EVIDENCE_WHY_TWO,
  buildFindingsQueueSearchEvidenceVocabulary,
  resolveFindingsQueueSearchEvidencePeerLink,
} from "@/lib/vocabulary/findings-queue-search-evidence-vocabulary";
import { GOVERNANCE_FINDINGS_CANONICAL_PATH } from "@/lib/governance-findings-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

describe("findings-queue-search-evidence-vocabulary (TB-2261)", () => {
  it("explains findings triage vs Search review evidence and deep-links both", () => {
    const model = buildFindingsQueueSearchEvidenceVocabulary();

    expect(model.heading).toBe(FINDINGS_QUEUE_SEARCH_EVIDENCE_HEADING);
    expect(model.heading.toLowerCase()).toContain("findings");
    expect(model.heading.toLowerCase()).toContain("search");
    expect(model.whyTwo).toBe(FINDINGS_QUEUE_SEARCH_EVIDENCE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("triage");
    expect(model.whyTwo.toLowerCase()).toContain("evidence trail");
    expect(model.compactLine).toBe(FINDINGS_QUEUE_SEARCH_EVIDENCE_COMPACT_LINE);

    expect(model.findingsQueueLink).toEqual(FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK);
    expect(model.findingsQueueLink.href).toBe(GOVERNANCE_FINDINGS_CANONICAL_PATH);
    expect(model.findingsQueueLink.href).toBe("/governance/findings");

    expect(model.searchEvidenceLink).toEqual(FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK);
    expect(model.searchEvidenceLink.href).toBe(SEARCH_REVIEW_EVIDENCE_PATH);
    expect(model.searchEvidenceLink.href).toBe("/insights/search-review-evidence");
  });

  it("resolves the peer surface from findings queue and search evidence", () => {
    expect(resolveFindingsQueueSearchEvidencePeerLink("findings-queue")).toEqual(
      FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK,
    );

    expect(resolveFindingsQueueSearchEvidencePeerLink("search-evidence")).toEqual(
      FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK,
    );
  });
});
