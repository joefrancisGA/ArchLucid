import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/access-denied",
  });
});

import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  ACCESS_DENIED_CLAIM_DISCIPLINE,
  ACCESS_DENIED_FOLLOW_UPS_TITLE,
} from "@/lib/access-denied-evidence-copy";
import {
  ACCESS_DENIED_FIRST_VIEWPORT_TEST_ID,
  ACCESS_DENIED_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ACCESS_DENIED_SKIP_LINK_LABEL,
  ACCESS_DENIED_SKIP_TARGET_ID,
} from "@/lib/access-denied-page-copy";

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
  readSignedInDisplayName: () => "jane@contoso.com",
  clearOidcSession: vi.fn(),
  signOutAndRedirectHome: vi.fn(async () => undefined),
}));

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...actual,
    readOperatorScopeFromStorage: () => ({
      tenantId: "tenant-abc",
      workspaceId: "ws-1",
      projectId: "proj-1",
      workspaceLabel: "Contoso Workspace",
      projectLabel: "Default",
    }),
  };
});

vi.mock("@/lib/registration-session", () => ({
  readLastRegistrationPayload: () => null,
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

import { OperatorAccessDeniedPageClient } from "./OperatorAccessDeniedPageClient";

describe("OperatorAccessDeniedPageClient buyer-polished shell", () => {
  it("renders skip link, first-viewport band, and orientation above recovery actions", () => {
    render(<OperatorAccessDeniedPageClient />);

    expect(screen.getByRole("link", { name: ACCESS_DENIED_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ACCESS_DENIED_SKIP_TARGET_ID}`,
    );
    expect(screen.queryByTestId("access-denied-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId(ACCESS_DENIED_HEADER_CLAIM_DISCIPLINE_TEST_ID).textContent).toContain(
      ACCESS_DENIED_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("access-denied-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ACCESS_DENIED_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("access-denied-primary-content");
    const firstViewport = screen.getByTestId(ACCESS_DENIED_FIRST_VIEWPORT_TEST_ID);
    const orientation = screen.getByTestId("access-denied-orientation-top");
    const useDifferentAccount = screen.getByTestId("operator-access-denied-use-different-account");
    const adminDetails = screen.getByTestId("operator-access-denied-admin-details");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(useDifferentAccount) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstViewport.compareDocumentPosition(adminDetails) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
