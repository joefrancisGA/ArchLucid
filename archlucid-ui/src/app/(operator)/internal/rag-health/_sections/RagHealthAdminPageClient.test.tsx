import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RagHealthAdminPageClient } from "@/app/(operator)/internal/rag-health/_sections/RagHealthAdminPageClient";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const authMock = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => authMock,
}));

vi.mock("@/lib/rag-health-admin", () => ({
  fetchAdminRagHealth: vi.fn().mockResolvedValue({
    embeddingModelId: "text-embedding-3-small",
    corpora: [],
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("RagHealthAdminPageClient — evidence orientation", () => {
  it("renders the claim-discipline orientation strip on the live admin page", async () => {
    authMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    authMock.isAuthorityLoading = false;

    render(<RagHealthAdminPageClient />);

    expect(await screen.findByTestId("rag-health-admin-page")).toBeInTheDocument();
    expect(screen.getByTestId("rag-health-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});

describe("RagHealthAdminPageClient — unauthorized navigation", () => {
  it("blocks direct navigation for callers without administrator access", () => {
    authMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;
    authMock.isAuthorityLoading = false;

    render(<RagHealthAdminPageClient />);

    expect(screen.getByRole("alert")).toHaveTextContent(/requires tenant administrator access/i);
    expect(screen.queryByTestId("rag-health-admin-page")).toBeNull();
  });
});
