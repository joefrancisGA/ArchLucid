import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureReviewNewSealedPackageCallout } from "@/app/(operator)/architecture/reviews/new/ArchitectureReviewNewSealedPackageCallout";
import { ArchLucidProcurementTrustStrip } from "@/components/product-line/ArchLucidProcurementTrustStrip";
import { ProcurementHelpDiligenceCtaSection } from "@/components/help/ProcurementHelpDiligenceCtaSection";
import { FirstReviewGuideBuyerChrome } from "@/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideBuyerChrome";
import { MarketingPricingQuotePanel } from "@/components/marketing/MarketingPricingQuotePanel";
import { SecureNowDriftPostCaptureNextStep } from "@/components/product-line/SecureNowDriftPostCaptureNextStep";
import { SecureNowDriftSecureNowCollectionPanel } from "@/components/product-line/SecureNowDriftSecureNowCollectionPanel";
import { SecureNowInvestigationEffortScopeLine } from "@/components/product-line/SecureNowInvestigationEffortScopeLine";
import { SecureNowPilotDispositionOutcomeRehearsalPanels } from "@/components/product-line/SecureNowPilotDispositionOutcomeRehearsalPanels";

expect.extend(toHaveNoViolations);

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({ tenantId: "t", workspaceId: "w", projectId: "p" }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
  useProductionDeskChrome: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: () => ({
    collectionInput: {
      hasConfiguredProvider: true,
      azureSubscriptionIdsPresent: true,
      hasSuccessfulPull: true,
    },
    isPending: false,
  }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");

  return {
    ...actual,
    useQuery: () => ({
      isPending: false,
      data: { items: [{ pathId: "fixture-path-01" }] },
    }),
  };
});

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

  it("drift collection panel has no serious axe violations", async () => {
    const { container } = render(<SecureNowDriftSecureNowCollectionPanel selectedSnapshotId="snap-1" />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("drift post-capture next step has no serious axe violations", async () => {
    const { container } = render(<SecureNowDriftPostCaptureNextStep selectedSnapshotId="snap-1" />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("pricing AL-EVAL anchor has no serious axe violations", async () => {
    const { container } = render(<MarketingPricingQuotePanel />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("investigation effort scope line has no serious axe violations", async () => {
    const { container } = render(<SecureNowInvestigationEffortScopeLine />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("procurement help diligence CTAs have no serious axe violations", async () => {
    const { container } = render(<ProcurementHelpDiligenceCtaSection />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("first-review guide buyer chrome has no serious axe violations", async () => {
    const { container } = render(<FirstReviewGuideBuyerChrome />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
