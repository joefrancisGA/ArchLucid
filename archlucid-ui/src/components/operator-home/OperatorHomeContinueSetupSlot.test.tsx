import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const useFinishSetupReadinessContext = vi.fn();
const useNavCommittedArchitectureReview = vi.fn();

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => useFinishSetupReadinessContext(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => useNavCommittedArchitectureReview(),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 3,
      hasCommittedArchitectureReview: useNavCommittedArchitectureReview,
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

import { OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER } from "@/lib/buyer/buyer-polish-copy";

import { OperatorHomeContinueSetupSlot } from "./OperatorHomeContinueSetupSlot";

describe("OperatorHomeContinueSetupSlot", () => {
  it("renders readiness prominently for first-run tenants with a blocker", () => {
    useNavCommittedArchitectureReview.mockReturnValue(false);
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
      readyCount: 1,
      totalCount: 4,
    });

    render(<OperatorHomeContinueSetupSlot placement="prominent" />);

    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-readiness-blocker")).toHaveTextContent(
      OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
    );
    expect(screen.queryByText(/of \d+ complete/i)).not.toBeInTheDocument();
  });

  it("stays silent when required access is ready and only optional setup remains", () => {
    useNavCommittedArchitectureReview.mockReturnValue(false);
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      readyCount: 4,
      totalCount: 4,
    });

    render(<OperatorHomeContinueSetupSlot placement="prominent" />);

    expect(screen.queryByTestId("home-block-continue-setup")).not.toBeInTheDocument();
  });

  it("stays silent while readiness is still loading", () => {
    useNavCommittedArchitectureReview.mockReturnValue(false);
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "loading",
      context: null,
      readyCount: 0,
      totalCount: 4,
    });

    render(<OperatorHomeContinueSetupSlot placement="prominent" />);

    expect(screen.queryByTestId("home-block-continue-setup")).not.toBeInTheDocument();
  });

  it("hides readiness after the tenant has committed workspace activity", () => {
    useNavCommittedArchitectureReview.mockReturnValue(true);
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
      readyCount: 1,
      totalCount: 4,
    });

    render(<OperatorHomeContinueSetupSlot placement="prominent" />);

    expect(screen.queryByTestId("home-block-continue-setup")).not.toBeInTheDocument();
  });
});