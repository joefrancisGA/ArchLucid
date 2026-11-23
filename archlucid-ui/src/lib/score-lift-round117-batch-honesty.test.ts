import { describe, expect, it } from "vitest";
import { RESOURCE_HUB_DIAGRAM_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-diagram-partial-capture-not-load-failure-copy";
import { RESOURCE_HUB_CONFIG_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-config-partial-capture-not-load-failure-copy";
import { RESOURCE_HUB_DRIFT_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-drift-partial-capture-not-load-failure-copy";
import { GOLDEN_MANIFEST_LINEAGE_VERIFY_HTTP_FAILURE_LINE } from "@/lib/exports/golden-manifest-lineage-verify-http-failure-copy";

describe("score-lift round117 batch honesty", () => {
  it("hub diagram config drift partial and lineage http", () => {
    expect(RESOURCE_HUB_DIAGRAM_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_HUB_CONFIG_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_HUB_DRIFT_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(GOLDEN_MANIFEST_LINEAGE_VERIFY_HTTP_FAILURE_LINE).toContain("not");
  });
});
