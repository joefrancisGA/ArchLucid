import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { architectureNestedAskPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingPeerAskRedirectHref } from "@/lib/resolve-working-peer-ask-redirect-href";
import { resolveWorkingDeskToolHref } from "@/lib/resolve-working-desk-tool-href";
import {
  buildSystemNotJobWorkingAskPickArchitectureEmpty,
  resolveSystemNotJobWorkingAskShowsUnscopedPeerEmpty,
  resolveSystemNotJobWorkingPeerAskRedirectHref,
  resolveSystemNotJobWorkingAskPortfolioHref,
  shouldShowSystemNotJobWorkingAskPortfolioBindEmpty,
  SYSTEM_NOT_JOB_ASK_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR,
  SYSTEM_NOT_JOB_ASK_BOUND_TO_OPEN_PACKAGE_OWNER,
  SYSTEM_NOT_JOB_WORKING_ASK_BIND_SURFACES,
  SYSTEM_NOT_JOB_WORKING_ASK_PICK_ARCHITECTURE_DESCRIPTION,
} from "@/lib/system-not-job-ask-bound-to-open-package";

const REPO_ROOT = join(process.cwd(), "..");
const architectureId = "architecture-identity-001";

describe("SN-024 ask bound to open package", () => {
  it("redirects Working peer Ask to nested Ask when architecture is known", () => {
    expect(
      resolveSystemNotJobWorkingPeerAskRedirectHref({
        pathname: "/insights/ask-review-questions",
        lastOpenArchitectureId: architectureId,
        search: "?runId=run-1",
      }),
    ).toBe(`${architectureNestedAskPath(architectureId)}?runId=run-1`);
  });

  it("sends unscoped Working Ask to the architecture portfolio with bind honesty", () => {
    const portfolioHref = resolveSystemNotJobWorkingAskPortfolioHref();

    expect(
      resolveSystemNotJobWorkingPeerAskRedirectHref({
        pathname: "/insights/ask-review-questions",
      }),
    ).toBe(portfolioHref);
    expect(resolveWorkingDeskToolHref({ tool: "ask" })).toBe(portfolioHref);
    expect(shouldShowSystemNotJobWorkingAskPortfolioBindEmpty(portfolioHref.split("?")[1] ?? "")).toBe(
      true,
    );
  });

  it("does not redirect Guided or non-Ask paths through the legacy wrapper", () => {
    expect(
      resolveWorkingPeerAskRedirectHref({
        pathname: "/insights/compare-two-reviews",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBeNull();
  });

  it("shows pick-architecture empty state for unscoped Working peer Ask only", () => {
    expect(
      resolveSystemNotJobWorkingAskShowsUnscopedPeerEmpty({
        workingMode: true,
        pathname: "/insights/ask-review-questions",
        pinnedArchitectureId: null,
        lastOpenArchitectureId: null,
      }),
    ).toBe(true);
    expect(
      resolveSystemNotJobWorkingAskShowsUnscopedPeerEmpty({
        workingMode: false,
        pathname: "/insights/ask-review-questions",
        pinnedArchitectureId: null,
        lastOpenArchitectureId: null,
      }),
    ).toBe(false);
    expect(
      resolveSystemNotJobWorkingAskShowsUnscopedPeerEmpty({
        workingMode: true,
        pathname: architectureNestedAskPath(architectureId),
        pinnedArchitectureId: architectureId,
        lastOpenArchitectureId: null,
      }),
    ).toBe(false);
  });

  it("builds Working Ask pick-architecture empty copy without implying global Career Q&A", () => {
    const preset = buildSystemNotJobWorkingAskPickArchitectureEmpty();

    expect(preset.title).toBe("Pick a system to ask");
    expect(preset.description).toBe(SYSTEM_NOT_JOB_WORKING_ASK_PICK_ARCHITECTURE_DESCRIPTION);
    expect(preset.description.toLowerCase()).toContain("architecture desk");
    expect(preset.description.toLowerCase()).toContain("not a workspace-wide career q&a");
    expect(preset.actions?.[0]?.href).toContain("deskBindAsk=1");
  });

  it("wires SN-024 surfaces and ADR 0079 anchor", () => {
    const moduleSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/system-not-job-ask-bound-to-open-package.ts"),
      "utf8",
    );
    const redirect = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/insights/WorkingPeerAskRedirect.tsx"),
      "utf8",
    );
    const askContent = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx",
      ),
      "utf8",
    );
    const hubShell = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/architecture/architectures/_sections/ArchitecturesHubPageShell.tsx",
      ),
      "utf8",
    );

    expect(SYSTEM_NOT_JOB_ASK_BOUND_TO_OPEN_PACKAGE_OWNER).toBe("SN-024");
    expect(SYSTEM_NOT_JOB_ASK_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR).toContain("0079");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_ASK_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR))).toBe(true);
    expect(moduleSource).toContain("resolveSystemNotJobWorkingPeerAskRedirectHref");
    expect(SYSTEM_NOT_JOB_WORKING_ASK_BIND_SURFACES.length).toBeGreaterThanOrEqual(5);
    expect(redirect).toContain("resolveSystemNotJobWorkingPeerAskRedirectHref");
    expect(askContent).toContain("WorkingAskPickArchitectureEmptyState");
    expect(hubShell).toContain("ArchitecturesHubWorkingAskBindEmptyStrip");
  });
});
