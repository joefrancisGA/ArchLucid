import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/governance/infrastructure/ask",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({
    hub: null,
    loading: false,
    loadError: null,
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_ASK_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_ACTION,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { InfrastructureAskClient } from "./InfrastructureAskClient";

describe("InfrastructureAskClient buyer-polished chrome", () => {
  it("renders skip link, unscoped panel, simulator disclosure, and sources strip", () => {
    render(<InfrastructureAskClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_ASK_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_ASK_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-ask-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-unscoped-panel")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-simulator-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-ask-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_ACTION })).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    );
  });
});
