import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const demoEnv = vi.hoisted(() => ({
  buyerPolished: true,
  demoMode: false,
  productLine: "architecture" as "architecture" | "security",
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnv.buyerPolished,
  isNextPublicDemoMode: () => demoEnv.demoMode,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: demoEnv.productLine }),
}));

vi.mock("@/components/shell/app-shell-workspace-footer-deferred-chunks", () => ({
  DeploymentBuildFingerprintStripDeferred: () => <div data-testid="deployment-build-fingerprint-strip" />,
  SystemHealthStatusStripDeferred: () => <div data-testid="system-health-status-strip" />,
  TrustCenterShellLinkDeferred: () => <div data-testid="trust-center-shell-link" />,
}));

import { AppShellWorkspaceFooter } from "@/components/shell/AppShellWorkspaceFooter";

describe("AppShellWorkspaceFooter", () => {
  beforeEach(() => {
    demoEnv.buyerPolished = true;
    demoEnv.demoMode = false;
    demoEnv.productLine = "architecture";
  });

  it("hides the lone trust footer on governance routes where shell health is already suppressed", () => {
    render(<AppShellWorkspaceFooter hideWorkspaceHealthFooter />);

    expect(screen.queryByRole("contentinfo")).toBeNull();
  });

  it("still renders the trust footer shell on buyer-polished routes that keep workspace chrome", () => {
    render(<AppShellWorkspaceFooter hideWorkspaceHealthFooter={false} />);

    expect(screen.getByRole("contentinfo", { name: "Trust and compliance" })).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-shell-link")).toBeInTheDocument();
  });

  it("hides the Security and trust footer link in the SecureNow shell", () => {
    demoEnv.productLine = "security";

    render(<AppShellWorkspaceFooter hideWorkspaceHealthFooter={false} />);

    expect(screen.getByRole("contentinfo", { name: "Trust and compliance" })).toBeInTheDocument();
    expect(screen.queryByTestId("trust-center-shell-link")).toBeNull();
  });

  it("renders the operator workspace footer when buyer polish is off", () => {
    demoEnv.buyerPolished = false;
    demoEnv.demoMode = false;

    render(<AppShellWorkspaceFooter hideWorkspaceHealthFooter={false} />);

    expect(screen.getByRole("contentinfo", { name: "Workspace footer" })).toBeInTheDocument();
  });
});
