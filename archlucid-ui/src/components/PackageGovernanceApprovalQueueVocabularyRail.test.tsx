import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackageGovernanceApprovalQueueVocabularyRail } from "@/components/PackageGovernanceApprovalQueueVocabularyRail";
import {
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_HEADING,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO,
  buildPackageGovernanceApprovalQueueVocabulary,
} from "@/lib/vocabulary/package-governance-approval-queue-vocabulary";

describe("PackageGovernanceApprovalQueueVocabularyRail (TB-2304)", () => {
  it("renders package-governance strip with peer link to approval queue", () => {
    const model = buildPackageGovernanceApprovalQueueVocabulary("run-abc");

    render(
      <PackageGovernanceApprovalQueueVocabularyRail
        runId="run-abc"
        currentSurfaceId="package-governance"
      />,
    );

    const strip = screen.getByTestId("package-governance-approval-queue-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "package-governance");
    expect(strip.textContent ?? "").toContain(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE);

    const peer = screen.getByTestId("package-governance-approval-queue-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK.label);
    expect(peer).toHaveAttribute("href", model.approvalQueueLink.href);
  });

  it("renders approval-queue strip with Reviews Governance peer", () => {
    render(
      <PackageGovernanceApprovalQueueVocabularyRail currentSurfaceId="approval-queue" />,
    );

    const peer = screen.getByTestId("package-governance-approval-queue-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK.label);
    expect(peer).toHaveAttribute("href", PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PackageGovernanceApprovalQueueVocabularyRail
        runId="run-abc"
        currentSurfaceId="package-governance"
        variant="full"
      />,
    );

    expect(screen.getByText(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO)).toBeInTheDocument();
  });
});
