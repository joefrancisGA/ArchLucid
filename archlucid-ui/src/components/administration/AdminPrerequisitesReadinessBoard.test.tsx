import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminPrerequisitesReadinessBoard } from "@/components/administration/AdminPrerequisitesReadinessBoard";

const useAdminPrerequisitesReadiness = vi.fn();

vi.mock("@/hooks/use-admin-prerequisites-readiness", () => ({
  useAdminPrerequisitesReadiness: (...args: unknown[]) => useAdminPrerequisitesReadiness(...args),
}));

describe("AdminPrerequisitesReadinessBoard (TB-2156)", () => {
  it("renders nothing when the board is disabled", () => {
    useAdminPrerequisitesReadiness.mockReturnValue({
      phase: "ready",
      rows: [],
      allReady: true,
    });

    const { container } = render(<AdminPrerequisitesReadinessBoard enabled={false} />);

    expect(container).toBeEmptyDOMElement();
    expect(useAdminPrerequisitesReadiness).toHaveBeenCalledWith(false);
  });

  it("renders compact ready state when mandatory prerequisites are satisfied", () => {
    useAdminPrerequisitesReadiness.mockReturnValue({
      phase: "ready",
      rows: [],
      allReady: true,
    });

    render(<AdminPrerequisitesReadinessBoard enabled />);

    expect(screen.getByTestId("admin-prerequisites-readiness-board")).toBeInTheDocument();
    expect(screen.getByText("Ready to run reviews")).toBeInTheDocument();
  });

  it("renders ordered unmet prerequisite rows with actions", () => {
    useAdminPrerequisitesReadiness.mockReturnValue({
      phase: "ready",
      allReady: false,
      rows: [
        {
          id: "production-config",
          label: "Production-like configuration",
          status: "blocked",
          summary: "1 blocking config-lint finding(s)",
          href: "/internal/health",
          cta: "Open config lint",
          sortOrder: 20,
        },
        {
          id: "corporate-sign-in",
          label: "Corporate sign-in (OIDC / SAML)",
          status: "attention",
          summary: "Configure production sign-in",
          href: "/administration/identity/sso-wizard",
          cta: "Open SSO wizard",
          sortOrder: 40,
        },
      ],
    });

    render(<AdminPrerequisitesReadinessBoard enabled />);

    expect(screen.getByTestId("admin-prerequisite-row-production-config")).toBeInTheDocument();
    expect(screen.getByTestId("admin-prerequisite-row-corporate-sign-in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open SSO wizard" })).toHaveAttribute(
      "href",
      "/administration/identity/sso-wizard",
    );
  });
});
