import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const demoOperatorToolingForced = vi.hoisted(() => ({ on: true as boolean }));

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoOperatorToolingEnv: () => demoOperatorToolingForced.on,
}));

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

import { DemoReadinessAdminPageClient } from "@/app/(operator)/internal/demo-readiness/_sections/DemoReadinessAdminPageClient";
import { BUYER_CTO_DEMO_READINESS_HEADING } from "@/lib/buyer-polish-copy";
import {
  INTERNAL_DEMO_READINESS_PAGE_TITLE,
  INTERNAL_DEMO_READINESS_TOOLING_DISABLED_DIAGNOSTICS_CTA,
  INTERNAL_DEMO_READINESS_TOOLING_DISABLED_SYSTEM_HEALTH_CTA,
  INTERNAL_DEMO_READINESS_TOOLING_DISABLED_TITLE,
  INTERNAL_OPERATIONS_NAV_EYEBROW,
} from "@/lib/demo-readiness-evidence-copy";

describe("DemoReadinessAdminPageClient", () => {
  beforeEach(() => {
    demoOperatorToolingForced.on = true;
  });

  it("renders a single PageHeading with Internal Operations wayfinding and no duplicate panel title", () => {
    render(<DemoReadinessAdminPageClient />);

    expect(screen.getByTestId("demo-readiness-admin-page")).toBeInTheDocument();
    expect(screen.getByTestId("demo-readiness-admin-page-heading")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: INTERNAL_DEMO_READINESS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("demo-readiness-admin-ops-eyebrow")).toHaveTextContent(INTERNAL_OPERATIONS_NAV_EYEBROW);
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("buyer-cto-demo-readiness-panel")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: BUYER_CTO_DEMO_READINESS_HEADING })).toBeNull();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("shows oriented next-step links when demo-operator tooling is disabled", () => {
    demoOperatorToolingForced.on = false;

    render(<DemoReadinessAdminPageClient />);

    expect(screen.getByTestId("demo-readiness-tooling-disabled-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: INTERNAL_DEMO_READINESS_TOOLING_DISABLED_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("buyer-cto-demo-readiness-panel")).toBeNull();
    expect(screen.getByRole("link", { name: INTERNAL_DEMO_READINESS_TOOLING_DISABLED_DIAGNOSTICS_CTA })).toHaveAttribute(
      "href",
      "/internal/health",
    );
    expect(screen.getByRole("link", { name: INTERNAL_DEMO_READINESS_TOOLING_DISABLED_SYSTEM_HEALTH_CTA })).toHaveAttribute(
      "href",
      "/administration/system-health",
    );
  });
});
