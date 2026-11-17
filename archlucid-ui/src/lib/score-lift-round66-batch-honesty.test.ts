import { describe, expect, it } from "vitest";

import { COMPARE_FINDING_CORRELATION_PARTIAL_EMPTY_LINE } from "@/lib/compare-finding-correlation-partial-empty-copy";
import { DECLARED_CONNECTIONS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/declared-connections-empty-partial-capture-copy";
import { RISK_EXCEPTIONS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/risk-exceptions-empty-partial-capture-copy";
import { SIGNED_RECORDS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-empty-partial-capture-copy";
import { IMPACT_PREVIEW_PARTIAL_CAPTURE_EMPTY_LINE } from "@/lib/impact-preview-partial-capture-empty-copy";
import {
  RESOURCE_HUB_DIAGRAM_TAB_PARTIAL_CAPTURE_LINE,
  RESOURCE_HUB_OVERVIEW_PARTIAL_CAPTURE_LINE,
  RESOURCE_HUB_TERRAFORM_TAB_PARTIAL_CAPTURE_LINE,
} from "@/lib/infra-evidence/resource-hub-tab-partial-capture-copy";
import { REMEDIATION_FACTORY_SIMULATOR_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-simulator-partial-capture-copy";

describe("score-lift round66 batch honesty", () => {
  it("hub tabs, declared connections, compare, impact, signed records, risk, simulator", () => {
    expect(RESOURCE_HUB_OVERVIEW_PARTIAL_CAPTURE_LINE).toContain("Partial");
    expect(RESOURCE_HUB_DIAGRAM_TAB_PARTIAL_CAPTURE_LINE).toContain("snapshot");
    expect(RESOURCE_HUB_TERRAFORM_TAB_PARTIAL_CAPTURE_LINE).toContain("snapshot");
    expect(DECLARED_CONNECTIONS_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(COMPARE_FINDING_CORRELATION_PARTIAL_EMPTY_LINE).toContain("partial");
    expect(IMPACT_PREVIEW_PARTIAL_CAPTURE_EMPTY_LINE).toContain("gaps");
    expect(SIGNED_RECORDS_EMPTY_PARTIAL_CAPTURE_LINE).toContain("sealed");
    expect(RISK_EXCEPTIONS_EMPTY_PARTIAL_CAPTURE_LINE).toContain("partial");
    expect(REMEDIATION_FACTORY_SIMULATOR_PARTIAL_CAPTURE_LINE).toContain("Partial");
  });
});