import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const demoEnv = vi.hoisted(() => ({
  buyerPolished: true,
  demoMode: false,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnv.buyerPolished,
  isNextPublicDemoMode: () => demoEnv.demoMode,
}));

vi.mock("@/components/usability/TrustCenterShellLink", () => ({
  TrustCenterShellLink: () => <div data-testid="trust-center-shell-link" />,
}));

import { AppShellWorkspaceFooter } from "@/components/shell/AppShellWorkspaceFooter";

describe("AppShellWorkspaceFooter", () => {
  beforeEach(() => {
    demoEnv.buyerPolished = true;
    demoEnv.demoMode = false;
  });

  it("hides the lone trust footer on governance routes where shell health is already suppressed", () => {
    render(<AppShellWorkspaceFooter hideWorkspaceHealthFooter />);

    expect(screen.queryByRole("contentinfo")).toBeNull();
  });

  it("still renders the trust footer shell on buyer-polished routes that keep workspace chrome", () => {
    render(<AppShellWorkspaceFooter hideWorkspaceHealthFooter={false} />);

    expect(screen.getByRole("contentinfo", { name: "Trust and compliance" })).toBeInTheDocument();
  });

  it("renders the operator workspace footer when buyer polish is off", () => {
    demoEnv.buyerPolished = false;
    demoEnv.demoMode = false;

    render(<AppShellWorkspaceFooter hideWorkspaceHealthFooter={false} />);

    expect(screen.getByRole("contentinfo", { name: "Workspace footer" })).toBeInTheDocument();
  });
});
