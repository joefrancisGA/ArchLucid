import { describe, expect, it } from "vitest";
import { GUIDED_REVIEW_FINDINGS_TOOLBAR_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/findings/guided-review-findings-toolbar-filter-empty-not-load-failure-copy";
import { DIAGRAM_RECONCILE_STALE_SNAPSHOT_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/diagram-reconcile-stale-snapshot-filter-empty-not-load-failure-copy";
import { OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/operator/operator-home-open-gate-collection-blocker-not-load-failure-copy";
import { REVIEW_PRESENTER_MODE_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/review-presenter-mode-empty-not-load-failure-copy";

describe("score-lift round102 batch honesty", () => {
  it("guided toolbar, presenter, diagram reconcile stale, home open gate", () => {
    expect(GUIDED_REVIEW_FINDINGS_TOOLBAR_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("toolbar filter");
    expect(REVIEW_PRESENTER_MODE_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("Presenter mode");
    expect(DIAGRAM_RECONCILE_STALE_SNAPSHOT_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("pinned snapshot");
    expect(OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE).toContain("Collection");
  });
});
