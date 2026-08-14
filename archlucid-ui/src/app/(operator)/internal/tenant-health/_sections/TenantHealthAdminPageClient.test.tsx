import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 4,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/tenant-health-admin", () => ({
  fetchAdminTenantHealthList: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { TenantHealthAdminPageClient } from "@/app/(operator)/internal/tenant-health/_sections/TenantHealthAdminPageClient";

describe("TenantHealthAdminPageClient", () => {
  it("renders the claim-discipline orientation strip on the live admin page", async () => {
    render(<TenantHealthAdminPageClient />);

    expect(await screen.findByTestId("tenant-health-admin-page")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-health-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});
