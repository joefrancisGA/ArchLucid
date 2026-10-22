import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FinishSetupWizardPanel } from "@/components/FinishSetupWizardPanel";

const useFinishSetupReadinessContext = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => useFinishSetupReadinessContext(),
}));

describe("FinishSetupWizardPanel", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSelfHosted = process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;

  beforeEach(() => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: false,
        healthLoadFailed: true,
        principalAdmin: true,
      },
      readyCount: 1,
      totalCount: 2,
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSelfHosted === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = originalSelfHosted;
    }

    window.localStorage.clear();
  });

  it("does not link to /internal/health on managed SaaS onboarding", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;

    render(<FinishSetupWizardPanel variant="optional" />);

    expect(screen.queryByRole("link", { name: /Open system health/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /admin health/i })).toBeNull();
    expect(document.querySelector('a[href="/internal/health"]')).toBeNull();
  });

  it("uses secret-store language in the required setup description", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;

    render(<FinishSetupWizardPanel />);

    expect(
      screen.getByText(
        /without manual secret-store configuration/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Key Vault/i)).toBeNull();
  });

  it("links self-hosted health confirmation to /health", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = "true";

    render(<FinishSetupWizardPanel variant="optional" />);

    expect(screen.getByRole("link", { name: /Open system health/i })).toHaveAttribute("href", "/administration/system-health");
  });
});
