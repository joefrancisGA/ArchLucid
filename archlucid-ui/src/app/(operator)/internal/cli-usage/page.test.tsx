import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { CliUsageInternalPageClient } from "./_sections/CliUsageInternalPageClient";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: vi.fn(),
}));

vi.mock("@/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView", () => ({
  HelpCliUsageTechnicalReferenceView: () => <div data-testid="cli-usage-reference-view" />,
}));

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";

const mockUseOperatorNavAuthority = vi.mocked(useOperatorNavAuthority);

describe("CliUsageInternalPage", () => {
  const entry = getProductDocumentationEntry("cli-usage");
  const loaded = tryLoadProductDocumentation("cli-usage");

  it("loads cli-usage documentation for the internal page", () => {
    expect(entry?.slug).toBe("cli-usage");
    expect(loaded).not.toBeNull();
  });

  it("denies non-admin operators", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    mockUseOperatorNavAuthority.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.ArchitectAuthority,
      isAuthorityLoading: false,
    });

    render(<CliUsageInternalPageClient entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("cli-usage-internal-page-denied")).toBeInTheDocument();
    expect(screen.queryByTestId("cli-usage-reference-view")).not.toBeInTheDocument();
  });

  it("renders the technical reference for admins", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected cli-usage documentation to load.");
    }

    mockUseOperatorNavAuthority.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
      isAuthorityLoading: false,
    });

    render(<CliUsageInternalPageClient entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("cli-usage-internal-page")).toBeInTheDocument();
    expect(screen.getByTestId("cli-usage-reference-view")).toBeInTheDocument();
  });
});
