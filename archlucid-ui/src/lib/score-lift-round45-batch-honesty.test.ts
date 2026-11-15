import { describe, expect, it } from "vitest";

import {
  ARCH_FIRST_REVIEW_PLATFORM_HEALTH_BLOCKER_DESCRIPTION,
} from "@/lib/architecture/architecture-first-review-platform-health-copy";
import { FIRST_REVIEW_OPEN_GATE_STARTER_FOCUS_LINE } from "@/lib/architecture/first-review-open-gate-focus-copy";
import { FIRST_REVIEW_SAMPLE_EXPORT_BADGE_LINE } from "@/lib/architecture/first-review-sample-export-badge-copy";
import {
  REVIEW_COMMIT_EVIDENCE_BEFORE_SEAL_LINE,
  REVIEW_SHARE_PACKAGE_COMMIT_DISABLED_LINE,
} from "@/lib/reviews/review-commit-evidence-before-seal-copy";
import { ARCH_WORKSPACE_WARN_ONLY_FINALIZE_SHORT } from "@/lib/reviews/architecture-warn-only-finalize-copy";
import { formatSecureNowPilotDispositionTenantAuditRecordedLine } from "@/lib/product-line/securenow-pilot-disposition-tenant-audit-copy";

describe("score-lift round45 batch honesty", () => {
  it("first-review and commit discipline copy", () => {
    expect(ARCH_FIRST_REVIEW_PLATFORM_HEALTH_BLOCKER_DESCRIPTION).toContain("self-hosted");
    expect(FIRST_REVIEW_OPEN_GATE_STARTER_FOCUS_LINE).toContain("spine");
    expect(FIRST_REVIEW_SAMPLE_EXPORT_BADGE_LINE).toContain("Sample review");
    expect(REVIEW_COMMIT_EVIDENCE_BEFORE_SEAL_LINE).toContain("Finalize");
    expect(REVIEW_SHARE_PACKAGE_COMMIT_DISABLED_LINE).toContain("finalized");
    expect(ARCH_WORKSPACE_WARN_ONLY_FINALIZE_SHORT).toContain("Warn-only");
  });

  it("sponsor audit load line formatter", () => {
    expect(formatSecureNowPilotDispositionTenantAuditRecordedLine("2026-11-14T12:00:00.000Z")).toContain(
      "Tenant audit recorded",
    );
  });
});