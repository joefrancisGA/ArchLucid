import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { architectureNestedSearchPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingPeerSearchRedirectHref } from "@/lib/resolve-working-peer-search-redirect-href";
import {
  buildSystemNotJobWorkingNestedSearchUnboundEmpty,
  buildSystemNotJobWorkingPeerSearchHonestyEmpty,
  resolveSystemNotJobWorkingNestedSearchShowsUnboundEmpty,
  resolveSystemNotJobWorkingPeerSearchRedirectHref,
  resolveSystemNotJobWorkingPeerSearchShowsHonestyStrip,
  resolveSystemNotJobWorkingPeerSearchPageSubtitle,
  SYSTEM_NOT_JOB_SEARCH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR,
  SYSTEM_NOT_JOB_SEARCH_BOUND_TO_OPEN_PACKAGE_OWNER,
  SYSTEM_NOT_JOB_WORKING_GLOBAL_FIND_PAGE_SEARCH_HELPER,
  SYSTEM_NOT_JOB_WORKING_SEARCH_BIND_SURFACES,
} from "@/lib/system-not-job-search-bound-to-open-package";

const REPO_ROOT = join(process.cwd(), "..");
const architectureId = "architecture-identity-001";

describe("SN-026 search bound to open package", () => {
  it("redirects Working peer search to nested search when architecture is known", () => {
    expect(
      resolveSystemNotJobWorkingPeerSearchRedirectHref({
        pathname: "/insights/search-review-evidence",
        lastOpenArchitectureId: architectureId,
        search: "?q=encryption",
      }),
    ).toBe(`${architectureNestedSearchPath(architectureId)}?q=encryption`);
  });

  it("keeps unscoped Working peer search on the workspace console route", () => {
    expect(
      resolveSystemNotJobWorkingPeerSearchRedirectHref({
        pathname: "/insights/search-review-evidence",
      }),
    ).toBeNull();
    expect(
      resolveWorkingPeerSearchRedirectHref({
        pathname: "/insights/search-review-evidence",
      }),
    ).toBeNull();
  });

  it("shows nested unbound empty only on nested desk search without a run", () => {
    expect(
      resolveSystemNotJobWorkingNestedSearchShowsUnboundEmpty({
        workingMode: true,
        pathname: architectureNestedSearchPath(architectureId),
        pinnedArchitectureId: architectureId,
        scopedRunId: "",
      }),
    ).toBe(true);
    expect(
      resolveSystemNotJobWorkingNestedSearchShowsUnboundEmpty({
        workingMode: true,
        pathname: architectureNestedSearchPath(architectureId),
        pinnedArchitectureId: architectureId,
        scopedRunId: "run-1",
      }),
    ).toBe(false);
  });

  it("shows peer honesty strip on workspace console search in Working mode", () => {
    expect(
      resolveSystemNotJobWorkingPeerSearchShowsHonestyStrip({
        workingMode: true,
        pathname: "/insights/search-review-evidence",
        pinnedArchitectureId: null,
      }),
    ).toBe(true);
    expect(
      resolveSystemNotJobWorkingPeerSearchShowsHonestyStrip({
        workingMode: true,
        pathname: architectureNestedSearchPath(architectureId),
        pinnedArchitectureId: architectureId,
      }),
    ).toBe(false);
  });

  it("builds nested unbound empty with one New review action and no sample CTA (CD-02)", () => {
    const preset = buildSystemNotJobWorkingNestedSearchUnboundEmpty({
      architectureId,
      architectureDisplayName: "Payments API",
    });

    expect(preset.actions).toHaveLength(2);
    expect(preset.actions?.[1]?.label).toBe("New review");
    expect(preset.actions?.some((action) => action.label.toLowerCase().includes("sample"))).toBe(false);
  });

  it("distinguishes header global search from desk evidence search in Working copy", () => {
    const peerHonesty = buildSystemNotJobWorkingPeerSearchHonestyEmpty();
    const workingSubtitle = resolveSystemNotJobWorkingPeerSearchPageSubtitle("Guided subtitle.");

    expect(peerHonesty.description.toLowerCase()).toContain("header");
    expect(peerHonesty.description.toLowerCase()).toContain("platform console");
    expect(workingSubtitle.toLowerCase()).toContain("architecture desk");
    expect(SYSTEM_NOT_JOB_WORKING_GLOBAL_FIND_PAGE_SEARCH_HELPER.toLowerCase()).toContain("header search");
    expect(SYSTEM_NOT_JOB_WORKING_GLOBAL_FIND_PAGE_SEARCH_HELPER.toLowerCase()).toContain("evidence trail");
  });

  it("wires SN-026 surfaces and ADR 0079 anchor", () => {
    const moduleSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/system-not-job-search-bound-to-open-package.ts"),
      "utf8",
    );
    const redirect = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/insights/WorkingPeerSearchRedirect.tsx"),
      "utf8",
    );
    const searchView = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/insights/search-review-evidence/_sections/SearchPageView.tsx",
      ),
      "utf8",
    );
    const globalSearchShell = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/GlobalSearchBarShell.tsx"),
      "utf8",
    );

    expect(SYSTEM_NOT_JOB_SEARCH_BOUND_TO_OPEN_PACKAGE_OWNER).toBe("SN-026");
    expect(SYSTEM_NOT_JOB_SEARCH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR).toContain("0079");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_SEARCH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR))).toBe(true);
    expect(moduleSource).toContain("resolveSystemNotJobWorkingPeerSearchRedirectHref");
    expect(SYSTEM_NOT_JOB_WORKING_SEARCH_BIND_SURFACES.length).toBeGreaterThanOrEqual(5);
    expect(redirect).toContain("resolveSystemNotJobWorkingPeerSearchRedirectHref");
    expect(searchView).toContain("WorkingNestedSearchUnboundEmptyState");
    expect(globalSearchShell).toContain("SYSTEM_NOT_JOB_WORKING_GLOBAL_FIND_PAGE_SEARCH_HELPER");
  });
});
