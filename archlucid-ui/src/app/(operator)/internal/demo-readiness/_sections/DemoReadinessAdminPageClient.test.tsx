import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator-home/BuyerCtoDemoReadinessPanel", () => ({
  BuyerCtoDemoReadinessPanel: () => <div data-testid="buyer-cto-demo-readiness-panel" />,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { DemoReadinessAdminPageClient } from "@/app/(operator)/admin/demo-readiness/_sections/DemoReadinessAdminPageClient";
import { BUYER_CTO_DEMO_READINESS_HEADING } from "@/lib/buyer-polish-copy";

describe("DemoReadinessAdminPageClient", () => {
  it("renders internal demo readiness diagnostics for administrators", () => {
    render(<DemoReadinessAdminPageClient />);

    expect(screen.getByTestId("demo-readiness-admin-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: BUYER_CTO_DEMO_READINESS_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("buyer-cto-demo-readiness-panel")).toBeInTheDocument();
  });
});
