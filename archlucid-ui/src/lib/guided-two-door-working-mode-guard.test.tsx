import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const UI_ROOT = join(process.cwd());

/** Sibling guards that must stay on disk so AO-13–22 cannot delete Guided teaching (AO-45). */
const GUIDED_TWO_DOOR_SIBLING_TEST_FILES = [
  "src/app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.test.tsx",
  "src/lib/buyer/create-review-peer-parity.test.tsx",
  "src/components/operator-home/OperatorHomeCompactStartingActionsSection.test.tsx",
  "e2e/first-run-wizard.spec.ts",
] as const;

function readUiUtf8(relativePath: string): string {
  return readFileSync(join(UI_ROOT, relativePath), "utf8");
}

const useSearchParams = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: () => useSearchParams(),
    usePathname: () => "/architecture/reviews/new",
    useRouter: () => ({ replace }),
  };
});

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => false,
  useProductionDeskChrome: () => true,
}));

vi.mock("@/hooks/use-working-start-href", () => ({
  useWorkingStartHref: () => "/architecture/architectures/architecture-identity-001",
}));

vi.mock("@/hooks/use-architecture-identities-list-query", () => ({
  useArchitectureIdentitiesListQuery: () => ({
    isLoading: false,
    isError: false,
    data: { items: [], totalCount: 0 },
  }),
}));

vi.mock("@/app/(operator)/architecture/reviews/new/reviews-new-path-switcher-deferred-chunks", () => ({
  ReviewsNewPathSwitcherDeferred: () => <div data-testid="reviews-new-path-switcher-stub" />,
}));

import { ReviewsNewRouteBody } from "@/app/(operator)/architecture/reviews/new/ReviewsNewRouteBody";

describe("guided two-door Working mode guard (AO-45)", () => {
  it("keeps sibling Vitest and e2e guards for Guided chooser teaching on disk", () => {
    for (const relativePath of GUIDED_TWO_DOOR_SIBLING_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps ReviewsNewJobChooserSection in the Guided path switcher", () => {
    const pathSwitcherSource = readUiUtf8(
      "src/app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.tsx",
    );
    const chooserSource = readUiUtf8(
      "src/app/(operator)/architecture/reviews/new/ReviewsNewJobChooserSection.tsx",
    );

    expect(pathSwitcherSource).toContain("ReviewsNewJobChooserSection");
    expect(chooserSource).toContain('data-testid="reviews-new-job-chooser-section"');
  });

  it("redirects Working /architecture/reviews/new before mounting the Guided path switcher", () => {
    const routeBodySource = readUiUtf8(
      "src/app/(operator)/architecture/reviews/new/ReviewsNewRouteBody.tsx",
    );

    expect(routeBodySource).toContain("useWorkingStartHref");
    expect(routeBodySource).toContain("reviews-new-working-redirect");
    expect(routeBodySource).toContain("ReviewsNewPathSwitcherDeferred");
    expect(routeBodySource).toContain("!evalChrome && pathQuery.length === 0");
  });

  it("mode-gates dual-path cards and starter packs on home compact starting actions", () => {
    const source = readUiUtf8(
      "src/components/operator-home/OperatorHomeCompactStartingActionsSection.tsx",
    );

    expect(source).toContain("hideDualPathCards = props.hasCommittedManifest === true || props.workingMode === true");
    expect(source).toContain("showStarterPacks = props.workingMode !== true");
    expect(source).toContain("OperatorHomeDualPathCards");
  });

  it("Working Start does not mount reviews-new-job-chooser-section on bare /architecture/reviews/new", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams());
    replace.mockClear();

    render(<ReviewsNewRouteBody />);

    expect(screen.getByTestId("reviews-new-working-redirect")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-path-switcher-stub")).toBeNull();
    expect(screen.queryByTestId("reviews-new-job-chooser-section")).toBeNull();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/architecture/architectures/architecture-identity-001");
    });
  });
});
