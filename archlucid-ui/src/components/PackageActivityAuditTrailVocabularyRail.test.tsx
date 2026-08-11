import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackageActivityAuditTrailVocabularyRail } from "@/components/PackageActivityAuditTrailVocabularyRail";
import {
  PACKAGE_ACTIVITY_AUDIT_TRAIL_AUDIT_LINK,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_COMPACT_LINE,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_HEADING,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_REVIEWS_PEER_LINK,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_WHY_TWO,
  buildPackageActivityAuditTrailVocabulary,
} from "@/lib/vocabulary/package-activity-audit-trail-vocabulary";

describe("PackageActivityAuditTrailVocabularyRail (TB-2305)", () => {
  it("renders package-activity strip with peer link to audit trail", () => {
    const model = buildPackageActivityAuditTrailVocabulary("run-abc");

    render(
      <PackageActivityAuditTrailVocabularyRail
        runId="run-abc"
        currentSurfaceId="package-activity"
      />,
    );

    const strip = screen.getByTestId("package-activity-audit-trail-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "package-activity");
    expect(strip.textContent ?? "").toContain(PACKAGE_ACTIVITY_AUDIT_TRAIL_COMPACT_LINE);

    const peer = screen.getByTestId("package-activity-audit-trail-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PACKAGE_ACTIVITY_AUDIT_TRAIL_AUDIT_LINK.label);
    expect(peer).toHaveAttribute("href", model.auditTrailLink.href);
  });

  it("renders audit-trail strip with Reviews Activity peer", () => {
    render(
      <PackageActivityAuditTrailVocabularyRail currentSurfaceId="audit-trail" />,
    );

    const peer = screen.getByTestId("package-activity-audit-trail-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PACKAGE_ACTIVITY_AUDIT_TRAIL_REVIEWS_PEER_LINK.label);
    expect(peer).toHaveAttribute("href", PACKAGE_ACTIVITY_AUDIT_TRAIL_REVIEWS_PEER_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PackageActivityAuditTrailVocabularyRail
        runId="run-abc"
        currentSurfaceId="package-activity"
        variant="full"
      />,
    );

    expect(screen.getByText(PACKAGE_ACTIVITY_AUDIT_TRAIL_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_ACTIVITY_AUDIT_TRAIL_WHY_TWO)).toBeInTheDocument();
  });
});
