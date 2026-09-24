import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/infrastructure/diagrams",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
}));

vi.mock("@/hooks/use-tenant-branding-presentation-query", () => ({
  useTenantBrandingPresentationQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 50, hasMore: false })),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { DiagramsWorkbenchClient } from "./DiagramsWorkbenchClient";

describe("DiagramsWorkbenchClient working mode", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it("renders skip link, claim discipline, and breadcrumb without header controls", () => {
    render(<DiagramsWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-diagrams-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("infra-diagrams-breadcrumb")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-scope-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-page-shortcuts")).not.toBeInTheDocument();
  });
});
