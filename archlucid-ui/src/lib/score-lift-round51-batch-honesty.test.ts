import { describe, expect, it } from "vitest";

import { ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE } from "@/lib/architecture/compare-second-sealed-review-honesty-copy";
import { EXTRACT_UPLOAD_ACCEPTED_NOT_EVALUATION_COMPLETE_LINE } from "@/lib/extract-upload/extract-upload-accepted-evaluation-honesty-copy";
import { DIAGRAM_RECONCILE_PINNED_NOT_LATEST_CAPTURE_LINE } from "@/lib/infra-evidence/diagram-reconcile-pinned-snapshot-honesty-copy";
import { formatResourceHubFindingsStoredEmptyLine } from "@/lib/infra-evidence/resource-hub-findings-empty-honesty-copy";
import { POLICY_PACKS_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/policy/policy-packs-catalog-empty-honesty-copy";
import { REMEDIATION_FACTORY_CORE_READ_RETRY_RANK_UNCHANGED_LINE } from "@/lib/remediation-factory/remediation-factory-core-read-honesty-copy";

describe("score-lift round51 batch honesty", () => {
  it("compare, extract upload, and resource hub", () => {
    expect(ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE).toContain("sealed");
    expect(EXTRACT_UPLOAD_ACCEPTED_NOT_EVALUATION_COMPLETE_LINE).toContain("snapshot");
    expect(formatResourceHubFindingsStoredEmptyLine("snap-abc-123")).toContain("not a load failure");
  });

  it("policy catalog empty and remediation core read", () => {
    expect(POLICY_PACKS_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed load");
    expect(REMEDIATION_FACTORY_CORE_READ_RETRY_RANK_UNCHANGED_LINE).toContain("rank");
  });

  it("diagram reconcile pinned snapshot", () => {
    expect(DIAGRAM_RECONCILE_PINNED_NOT_LATEST_CAPTURE_LINE).toContain("pinned");
  });
});