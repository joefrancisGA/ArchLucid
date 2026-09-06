import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/access-denied",
  });
});

import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const mocks = vi.hoisted(() => ({
  signOutAndRedirectHome: vi.fn(async () => undefined),
  clearOidcSession: vi.fn(),
  readSignedInDisplayName: vi.fn(() => "jane@contoso.com"),
  readOperatorScopeFromStorage: vi.fn(() => ({
    tenantId: "tenant-abc",
    workspaceId: "ws-1",
    projectId: "proj-1",
    workspaceLabel: "Contoso Workspace",
    projectLabel: "Default",
  })),
  readLastRegistrationPayload: vi.fn(() => null as { adminEmail?: string } | null),
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
  readSignedInDisplayName: mocks.readSignedInDisplayName,
  clearOidcSession: mocks.clearOidcSession,
  signOutAndRedirectHome: mocks.signOutAndRedirectHome,
}));

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...actual,
    readOperatorScopeFromStorage: mocks.readOperatorScopeFromStorage,
  };
});

vi.mock("@/lib/registration-session", () => ({
  readLastRegistrationPayload: mocks.readLastRegistrationPayload,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me",
      name: "jane@contoso.com",
      roleClaimValues: [],
      primaryAppRole: null,
      maxAuthority: "ReadAuthority",
      authorityRank: AUTHORITY_RANK.ReadAuthority,
      hasEnterpriseOperatorSurfaces: false,
      hasCommittedArchitectureReview: false,
      hasRecognizedArchLucidRole: false,
      permissionClaimValues: [],
    } satisfies CurrentPrincipal,
    callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
    isAuthorityLoading: false,
  }),
}));

import { OperatorAccessDeniedPageClient } from "@/components/operator/OperatorAccessDeniedPageClient";

describe("OperatorAccessDeniedPageClient", () => {
  it("shows buyer-facing copy, actions, and support metadata without exposing token internals", () => {
    render(<OperatorAccessDeniedPageClient />);

    expect(screen.getByTestId("operator-access-denied-heading")).toHaveTextContent(
      "You don't have access to ArchLucid yet",
    );
    expect(
      screen.getByText(
        /your account has not been assigned an ArchLucid app role for this tenant/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("operator-access-denied-supplement")).toHaveTextContent(
      /No ArchLucid app role was found/i,
    );
    expect(screen.getByRole("button", { name: /Use a different account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Return to sign-in/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Contact administrator/i })).toBeNull();
    expect(screen.getByTestId("operator-access-denied-support-details")).toHaveTextContent("jane@contoso.com");
    expect(screen.getByTestId("operator-access-denied-support-details")).toHaveTextContent("Contoso Workspace");
    expect(screen.getByText(/Support details: Request ID/i)).toBeInTheDocument();
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("operator-access-denied-jwt-role-callout")).not.toBeVisible();
  });

  it("wires auth-jwt-insufficient-scope Report Problem on JwtBearer 403 without wrong-tenant supplement", () => {
    render(<OperatorAccessDeniedPageClient />);

    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.queryByText(/wrong tenant/i)).not.toBeInTheDocument();
  });

  it("keeps JWT role-mapping guidance inside the administrator disclosure", () => {
    render(<OperatorAccessDeniedPageClient />);

    fireEvent.click(screen.getByText(/Details for administrators/i));

    expect(screen.getByTestId("operator-access-denied-jwt-role-callout")).toBeInTheDocument();
    expect(screen.getByText(/Required roles: Admin, Operator, Reader, or Auditor/i)).toBeInTheDocument();
  });

  it("routes primary and secondary actions to account recovery flows", () => {
    render(<OperatorAccessDeniedPageClient />);

    fireEvent.click(screen.getByRole("button", { name: /Use a different account/i }));
    expect(mocks.signOutAndRedirectHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Return to sign-in/i }));
    expect(mocks.clearOidcSession).toHaveBeenCalledTimes(1);
  });

  it("shows the administrator contact link only when configured", () => {
    mocks.readLastRegistrationPayload.mockReturnValueOnce({ adminEmail: "admin@contoso.com" });

    render(<OperatorAccessDeniedPageClient />);

    expect(screen.getByRole("link", { name: /Contact administrator/i })).toHaveAttribute(
      "href",
      "mailto:admin@contoso.com?subject=ArchLucid%20access%20request",
    );
  });
});
