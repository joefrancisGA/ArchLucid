import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AdminEvidenceProposalsPageClient } from "@/app/(operator)/internal/evidence-proposals/_sections/AdminEvidenceProposalsPageClient";

describe("AdminEvidenceProposalsPageClient", () => {
  it("renders the claim-discipline orientation strip on the live admin page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );

    render(<AdminEvidenceProposalsPageClient />);

    expect(await screen.findByTestId("admin-evidence-proposals-page")).toBeInTheDocument();
    expect(screen.queryByTestId("evidence-proposals-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});
