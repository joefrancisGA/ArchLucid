import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureReviewNewSealedPackageCallout } from "@/app/(operator)/architecture/reviews/new/ArchitectureReviewNewSealedPackageCallout";
import { ArchLucidProcurementTrustStrip } from "@/components/product-line/ArchLucidProcurementTrustStrip";
import { SecureNowPilotDispositionOutcomeRehearsalPanels } from "@/components/product-line/SecureNowPilotDispositionOutcomeRehearsalPanels";

expect.extend(toHaveNoViolations);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("score-lift chrome axe", () => {
  it("sealed-package callout has no serious axe violations", async () => {
    const { container } = render(<ArchitectureReviewNewSealedPackageCallout />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("ArchLucid procurement trust strip has no serious axe violations", async () => {
    const { container } = render(<ArchLucidProcurementTrustStrip />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("Proceed disposition rehearsal panel has no serious axe violations", async () => {
    const { container } = render(
      <SecureNowPilotDispositionOutcomeRehearsalPanels
        outcome="Proceed"
        savedOutcome={null}
        savedRationale={null}
        pathId="fixture-path-01"
        testIdPrefix="axe-proceed"
        stopHandoffTestId="axe-stop-handoff"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
