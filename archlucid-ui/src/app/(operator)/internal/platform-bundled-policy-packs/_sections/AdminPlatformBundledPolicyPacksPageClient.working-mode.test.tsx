import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const nav = vi.hoisted(() => ({ callerAuthorityRank: 3 }));
const listPlatformBundledPolicyPacks = vi.hoisted(() => vi.fn());

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => nav.callerAuthorityRank,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: nav.callerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    listPlatformBundledPolicyPacks: (...args: unknown[]) => listPlatformBundledPolicyPacks(...args),
    setPlatformBundledPolicyPackActivation: vi.fn(),
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import {
  PLATFORM_BUNDLED_POLICY_PACKS_CLAIM_DISCIPLINE,
  PLATFORM_BUNDLED_POLICY_PACKS_PRIMARY_CONTENT_ID,
  PLATFORM_BUNDLED_POLICY_PACKS_SKIP_LINK_LABEL,
} from "@/lib/platform-bundled-policy-packs-evidence-copy";
import { AdminPlatformBundledPolicyPacksPageClient } from "./AdminPlatformBundledPolicyPacksPageClient";

describe("AdminPlatformBundledPolicyPacksPageClient working mode", () => {
  beforeEach(() => {
    nav.callerAuthorityRank = 3;
    listPlatformBundledPolicyPacks.mockResolvedValue([
      {
        bundleContentFile: "demo-enterprise-privacy-pack.json",
        displayName: "Enterprise privacy pack",
        isGloballyActive: true,
        updatedUtc: "2026-01-15T12:00:00Z",
      },
    ]);
  });

  it("renders skip link, claim discipline, breadcrumb, and registry table", async () => {
    render(<AdminPlatformBundledPolicyPacksPageClient />);

    expect(screen.getByRole("link", { name: PLATFORM_BUNDLED_POLICY_PACKS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PLATFORM_BUNDLED_POLICY_PACKS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("platform-bundled-policy-packs-claim-discipline")).toHaveTextContent(
      PLATFORM_BUNDLED_POLICY_PACKS_CLAIM_DISCIPLINE,
    );
    await waitFor(() => {
      expect(screen.getByTestId("platform-bundled-policy-packs-primary-content")).toBeInTheDocument();
    });
    expect(screen.getByTestId("platform-bundled-policy-packs-sources")).toBeInTheDocument();
  });
});
