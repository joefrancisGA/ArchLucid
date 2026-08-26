import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  ACCESS_DENIED_CLAIM_DISCIPLINE,
  ACCESS_DENIED_FOLLOW_UPS_TITLE,
} from "@/lib/access-denied-evidence-copy";
import {
  ACCESS_DENIED_PRIMARY_CONTENT_ID,
  ACCESS_DENIED_SKIP_LINK_LABEL,
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
  it("renders skip link, breadcrumb, and orientation above recovery actions", () => {
    render(<OperatorAccessDeniedPageClient />);

    expect(screen.getByRole("link", { name: ACCESS_DENIED_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ACCESS_DENIED_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("access-denied-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("access-denied-claim-discipline").textContent).toContain(
      ACCESS_DENIED_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ACCESS_DENIED_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const orientation = screen.getByTestId("access-denied-orientation-top");
    const useDifferentAccount = screen.getByTestId("operator-access-denied-use-different-account");

    expect(orientation.compareDocumentPosition(useDifferentAccount) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByTestId("access-denied-primary-content")).toContainElement(orientation);
  });
});
