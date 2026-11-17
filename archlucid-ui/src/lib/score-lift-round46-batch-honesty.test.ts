import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_TENANT_REVIEW_EVIDENCE_SEAL_LINE } from "@/lib/architecture/first-review-tenant-review-seal-discipline-copy";
import { CONNECTOR_CONFIGURED_STATUS_HONESTY_LINE } from "@/lib/integrations/connector-configured-status-honesty-copy";
import { DECLARED_CONNECTIONS_EXPIRY_HONESTY_LINE } from "@/lib/governance/declared-connections-expiry-honesty-copy";
import { formatSecureNowPilotDispositionTenantAuditRecordedLine } from "@/lib/product-line/securenow-pilot-disposition-tenant-audit-copy";
import { findReportProblemSurfaceById } from "@/lib/report-problem-surfaces";

describe("score-lift round46 batch honesty", () => {
  it("connector configured and declared connection expiry discipline", () => {
    expect(CONNECTOR_CONFIGURED_STATUS_HONESTY_LINE).toContain("Configured");
    expect(CONNECTOR_CONFIGURED_STATUS_HONESTY_LINE).toContain("sealed");
    expect(DECLARED_CONNECTIONS_EXPIRY_HONESTY_LINE).toContain("expire");
  });

  it("first-review tenant seal line", () => {
    expect(FIRST_REVIEW_TENANT_REVIEW_EVIDENCE_SEAL_LINE).toContain("Finalize");
    expect(FIRST_REVIEW_TENANT_REVIEW_EVIDENCE_SEAL_LINE).toContain("sealed");
  });

  it("pilot disposition audit formatter and connection status report problem", () => {
    expect(formatSecureNowPilotDispositionTenantAuditRecordedLine("2026-11-15T00:00:00.000Z")).toContain(
      "Tenant audit recorded",
    );
    expect(findReportProblemSurfaceById("administration-connection-status-hard-failure")).toBeDefined();
  });
});