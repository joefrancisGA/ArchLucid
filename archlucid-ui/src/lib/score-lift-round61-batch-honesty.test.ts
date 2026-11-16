import { describe, expect, it } from "vitest";

import { EXTRACT_UPLOAD_ACCEPTED_PARTIAL_CAPTURE_LINE } from "@/lib/extract-upload/extract-upload-partial-capture-honesty-copy";
import { INFRASTRUCTURE_ASK_PARTIAL_CAPTURE_HONESTY_LINE } from "@/lib/infra-evidence/infrastructure-ask-partial-capture-honesty-copy";
import {
  REMEDIATION_WORKBENCH_EXECUTE_PARTIAL_CAPTURE_LINE,
  REMEDIATION_WORKBENCH_PARTIAL_CAPTURE_LINE,
} from "@/lib/infra-evidence/remediation-workbench-partial-capture-honesty-copy";
import { SECURENOW_WORKSPACE_HEALTH_PARTIAL_CAPTURE_LINE } from "@/lib/insights/securenow-workspace-health-partial-capture-copy";
import { SECURENOW_COLLECTION_SECOND_CAPTURE_REMAINING_LINE } from "@/lib/product-line/securenow-collection-second-capture-remaining-copy";
import { SECURENOW_FINDINGS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/product-line/securenow-findings-empty-partial-capture-copy";
import { REMEDIATION_FACTORY_ATTACK_PATH_PARTIAL_RERANK_LINE } from "@/lib/remediation-factory/remediation-factory-attack-path-partial-rerank-copy";

describe("score-lift round61 batch honesty", () => {
  it("round 61 partial-capture copy modules", () => {
    expect(SECURENOW_WORKSPACE_HEALTH_PARTIAL_CAPTURE_LINE).toContain("KPIs");
    expect(EXTRACT_UPLOAD_ACCEPTED_PARTIAL_CAPTURE_LINE).toContain("accepted");
    expect(REMEDIATION_WORKBENCH_PARTIAL_CAPTURE_LINE).toContain("backfill");
    expect(REMEDIATION_WORKBENCH_EXECUTE_PARTIAL_CAPTURE_LINE).toContain("Azure");
    expect(SECURENOW_COLLECTION_SECOND_CAPTURE_REMAINING_LINE).toContain("second");
    expect(INFRASTRUCTURE_ASK_PARTIAL_CAPTURE_HONESTY_LINE).toContain("gaps");
    expect(SECURENOW_FINDINGS_EMPTY_PARTIAL_CAPTURE_LINE).toContain("empty");
    expect(REMEDIATION_FACTORY_ATTACK_PATH_PARTIAL_RERANK_LINE).toContain("re-rank");
  });
});