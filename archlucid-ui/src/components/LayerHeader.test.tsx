import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { layerHeaderEnterpriseOperatorRankLine } from "@/lib/enterprise-controls-context-copy";
import { LAYER_PAGE_GUIDANCE, type LayerGuidancePageKey } from "@/lib/layer-guidance";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

/** Default Admin rank for tests — literal `3` because `vi.hoisted` runs before `AUTHORITY_RANK` is available. */
const navCallerAuthorityRank = vi.hoisted(() => ({ current: 3 }));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: (): number => navCallerAuthorityRank.current,
  /** Matches `composeNavSurface(..., hasCommittedArchitectureReview = true)` — LayerHeader ignores nav links from the surface. */
  useNavCommittedArchitectureReview: (): boolean => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { LayerHeader } from "./LayerHeader";

describe("LayerHeader", () => {
  beforeEach(() => {
    navCallerAuthorityRank.current = AUTHORITY_RANK.AdminAuthority;
  });

  afterEach(() => {
    navCallerAuthorityRank.current = AUTHORITY_RANK.AdminAuthority;
  });

  it("renders compare guidance (analysis slice)", () => {
    render(<LayerHeader pageKey="compare" />);

    expect(screen.getByText("Compare two reviews")).toBeInTheDocument();
    expect(screen.getByText(/what changed between two finalized reviews/i)).toBeInTheDocument();
  });

  it("explains review and evidence trail relationship", () => {
    render(<LayerHeader pageKey="compare" />);

    expect(screen.getByTestId("layer-header-review-vocabulary")).toHaveTextContent(/Review and evidence trail/i);
    expect(screen.getByTestId("layer-header-review-vocabulary")).toHaveTextContent(/finalized review record/i);
  });

  it("renders Approval responsibility footnote on audit", () => {
    render(<LayerHeader pageKey="audit" />);

    expect(screen.getByText("Approval")).toBeInTheDocument();
    expect(screen.getByText(/Tenant audit trail — who did what, when/i)).toBeInTheDocument();
  });

  /**
   * Discoverability: `LayerHeader` puts badge + headline in `aria-label` on the `<aside>` (implicit `complementary`).
   */
  it("exposes Governance audit strip accessible name from badge and headline", () => {
    render(<LayerHeader pageKey="audit" />);

    expect(
      screen.getByRole("complementary", { name: /Governance:.*Tenant audit trail — who did what, when/i }),
    ).toBeInTheDocument();
  });

  it("renders governance resolution Governance footnote", () => {
    render(<LayerHeader pageKey="governance-resolution" />);

    expect(screen.getByText(/Read-only diagnostic; edits on Policy packs or Resolve outcomes workflow\./i)).toBeInTheDocument();
  });

  it("renders Execute+ rank cue on Governance audit when caller rank is Execute+", () => {
    navCallerAuthorityRank.current = AUTHORITY_RANK.ExecuteAuthority;
    render(<LayerHeader pageKey="audit" />);

    expect(screen.getByTestId("layer-header-operate-execute-rank-cue")).toHaveTextContent(
      layerHeaderEnterpriseOperatorRankLine,
    );
  });

  it("does not render Execute+ rank cue on Governance audit when caller is Read", () => {
    navCallerAuthorityRank.current = AUTHORITY_RANK.ReadAuthority;
    render(<LayerHeader pageKey="audit" />);

    expect(screen.queryByTestId("layer-header-operate-execute-rank-cue")).toBeNull();
  });

  /** Below numeric Read (e.g. unset rank): no Execute strip on governance pages. */
  it("does not render Execute+ rank cue when caller rank is below Execute", () => {
    navCallerAuthorityRank.current = 0;
    render(<LayerHeader pageKey="audit" />);

    expect(screen.queryByTestId("layer-header-operate-execute-rank-cue")).toBeNull();
  });

  it("wraps guidance in a collapsed details panel when collapsibleGuidance is set", () => {
    render(<LayerHeader pageKey="compare" collapsibleGuidance="How compare works" />);

    expect(screen.getByTestId("layer-header-collapsible-guidance")).toBeInTheDocument();
    expect(screen.getByText("How compare works")).toBeInTheDocument();
    expect(screen.queryByText(/Review and evidence trail/i)).not.toBeVisible();
  });

  it("renders optional collapsibleChildren below guidance in the details panel", () => {
    render(
      <LayerHeader
        pageKey="compare"
        collapsibleGuidance="How compare works"
        collapsibleChildren={<p data-testid="layer-header-child">Extra guidance</p>}
      />,
    );

    expect(screen.getByTestId("layer-header-child")).toBeInTheDocument();
  });

  it("omits review vocabulary on integration readiness pages", () => {
    render(<LayerHeader pageKey="integrations-operations" />);

    expect(screen.getByText("Integration readiness")).toBeInTheDocument();
    expect(screen.queryByTestId("layer-header-review-vocabulary")).toBeNull();
    expect(screen.getByText(/verify connector readiness/i)).toBeInTheDocument();
  });

  it("does not render Execute+ rank cue on Advanced operations pages", () => {
    render(<LayerHeader pageKey="compare" />);

    expect(screen.queryByTestId("layer-header-operate-execute-rank-cue")).toBeNull();
  });

  /**
   * Every Governance guidance key must surface the Execute+ rank-aware note when rank allows — packaging ↔ nav floor.
   */
  it("renders Execute+ rank cue for every Governance layer-guidance page key at Execute rank", () => {
    const governanceKeys = (Object.keys(LAYER_PAGE_GUIDANCE) as LayerGuidancePageKey[]).filter(
      (key) =>
        LAYER_PAGE_GUIDANCE[key].layerBadge === "Approval" && LAYER_PAGE_GUIDANCE[key].enterpriseFootnote != null,
    );

    expect(governanceKeys.length).toBeGreaterThan(0);
    navCallerAuthorityRank.current = AUTHORITY_RANK.ExecuteAuthority;

    for (const pageKey of governanceKeys) {
      const { unmount } = render(<LayerHeader pageKey={pageKey} />);

      expect(screen.getByTestId("layer-header-operate-execute-rank-cue")).toBeInTheDocument();
      unmount();
    }
  });
});
