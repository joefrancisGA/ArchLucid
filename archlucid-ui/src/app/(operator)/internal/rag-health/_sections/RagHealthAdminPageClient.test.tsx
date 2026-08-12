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
  fetchAdminRagHealth: vi.fn(),
}));

describe("RagHealthAdminPageClient — unauthorized navigation", () => {
  it("blocks direct navigation for callers without administrator access", () => {
    authMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;
    authMock.isAuthorityLoading = false;

    render(<RagHealthAdminPageClient />);

    expect(screen.getByRole("alert")).toHaveTextContent(/requires tenant administrator access/i);
    expect(screen.queryByTestId("rag-health-admin-page")).toBeNull();
  });
});
