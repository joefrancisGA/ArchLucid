import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailPackageStatusStrip } from "@/components/runs/RunDetailPackageStatusStrip";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => false,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("RunDetailPackageStatusStrip (P-11)", () => {
  it("shows plain omission copy when approval status was not stored", () => {
    render(
      <RunDetailPackageStatusStrip
        manifestId={null}
        hasGoldenManifest={false}
        findingCountDisplay={null}
        warningCountDisplay={null}
        aggregateRiskPosture={null}
        artifactCount={0}
        governanceGateLabel={null}
        authorityLifecyclePhase={null}
        showcasePolicyPackStrip={null}
      />,
    );

    expect(screen.getByText("Approval status was not stored.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Approval status:/)).not.toBeInTheDocument();
    expect(screen.getByText("Finalized review record was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("In progress")).not.toBeInTheDocument();
  });

  it("labels blank and low risk posture when findings are present (P-11)", () => {
    render(
      <RunDetailPackageStatusStrip
        manifestId={null}
        hasGoldenManifest={false}
        findingCountDisplay={2}
        warningCountDisplay={null}
        aggregateRiskPosture={null}
        artifactCount={0}
        governanceGateLabel="Approved"
        authorityLifecyclePhase={null}
        showcasePolicyPackStrip={null}
      />,
    );

    expect(screen.getByText("Risk posture was not stored.")).toBeInTheDocument();
  });

  it("labels zero deliverables honestly (P-12)", () => {
    render(
      <RunDetailPackageStatusStrip
        manifestId="manifest-1"
        hasGoldenManifest={true}
        findingCountDisplay={0}
        warningCountDisplay={null}
        aggregateRiskPosture={null}
        artifactCount={0}
        governanceGateLabel="Approved"
        authorityLifecyclePhase={null}
        showcasePolicyPackStrip={null}
      />,
    );

    expect(screen.getByText("No export-ready deliverables were stored yet.")).toBeInTheDocument();
  });

  it("shows stored aggregate risk posture without paraphrase", () => {
    render(
      <RunDetailPackageStatusStrip
        manifestId={null}
        hasGoldenManifest={false}
        findingCountDisplay={1}
        warningCountDisplay={null}
        aggregateRiskPosture="accepted"
        artifactCount={0}
        governanceGateLabel="Approved"
        authorityLifecyclePhase={null}
        showcasePolicyPackStrip={null}
      />,
    );

    expect(screen.getByText("accepted")).toBeInTheDocument();
    expect(screen.queryByText(/Residual risk accepted/)).not.toBeInTheDocument();
  });
});
