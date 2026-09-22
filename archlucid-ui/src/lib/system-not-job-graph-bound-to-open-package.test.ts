import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveGraphIdleEmptyPreset } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { architectureNestedGraphPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingDeskToolHref } from "@/lib/resolve-working-desk-tool-href";
import { resolveWorkingPeerGraphRedirectHref } from "@/lib/resolve-working-peer-graph-redirect-href";
import {
  buildSystemNotJobWorkingGraphPickArchitectureEmpty,
  resolveSystemNotJobWorkingGraphShowsUnscopedPeerEmpty,
  resolveSystemNotJobWorkingPeerGraphRedirectHref,
  resolveSystemNotJobWorkingGraphPortfolioHref,
  shouldShowSystemNotJobWorkingGraphPortfolioBindEmpty,
  SYSTEM_NOT_JOB_GRAPH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR,
  SYSTEM_NOT_JOB_GRAPH_BOUND_TO_OPEN_PACKAGE_OWNER,
  SYSTEM_NOT_JOB_WORKING_GRAPH_BIND_SURFACES,
  SYSTEM_NOT_JOB_WORKING_GRAPH_PICK_ARCHITECTURE_DESCRIPTION,
} from "@/lib/system-not-job-graph-bound-to-open-package";

const REPO_ROOT = join(process.cwd(), "..");
const architectureId = "architecture-identity-001";

describe("SN-025 graph bound to open package", () => {
  it("redirects Working peer graph to nested graph when architecture is known", () => {
    expect(
      resolveSystemNotJobWorkingPeerGraphRedirectHref({
        pathname: "/insights/evidence-graph",
        lastOpenArchitectureId: architectureId,
        search: "?runId=run-1",
      }),
    ).toBe(`${architectureNestedGraphPath(architectureId)}?runId=run-1`);
  });

  it("sends unscoped Working graph to the architecture portfolio with bind honesty", () => {
    const portfolioHref = resolveSystemNotJobWorkingGraphPortfolioHref();

    expect(
      resolveSystemNotJobWorkingPeerGraphRedirectHref({
        pathname: "/insights/evidence-graph",
      }),
    ).toBe(portfolioHref);
    expect(resolveWorkingDeskToolHref({ tool: "graph" })).toBe(portfolioHref);
    expect(shouldShowSystemNotJobWorkingGraphPortfolioBindEmpty(portfolioHref.split("?")[1] ?? "")).toBe(
      true,
    );
  });

  it("does not redirect Guided or non-graph paths through the legacy wrapper", () => {
    expect(
      resolveWorkingPeerGraphRedirectHref({
        pathname: architectureNestedGraphPath(architectureId),
        lastOpenArchitectureId: architectureId,
      }),
    ).toBeNull();
  });

  it("shows pick-architecture empty state for unscoped Working peer graph only", () => {
    expect(
      resolveSystemNotJobWorkingGraphShowsUnscopedPeerEmpty({
        workingMode: true,
        pathname: "/insights/evidence-graph",
        pinnedArchitectureId: null,
        lastOpenArchitectureId: null,
      }),
    ).toBe(true);
    expect(
      resolveSystemNotJobWorkingGraphShowsUnscopedPeerEmpty({
        workingMode: false,
        pathname: "/insights/evidence-graph",
        pinnedArchitectureId: null,
        lastOpenArchitectureId: null,
      }),
    ).toBe(false);
    expect(
      resolveSystemNotJobWorkingGraphShowsUnscopedPeerEmpty({
        workingMode: true,
        pathname: architectureNestedGraphPath(architectureId),
        pinnedArchitectureId: architectureId,
        lastOpenArchitectureId: null,
      }),
    ).toBe(false);
  });

  it("builds Working graph pick-architecture empty copy without implying global peer graph", () => {
    const preset = buildSystemNotJobWorkingGraphPickArchitectureEmpty();

    expect(preset.title).toBe("Pick a system for the evidence graph");
    expect(preset.description).toBe(SYSTEM_NOT_JOB_WORKING_GRAPH_PICK_ARCHITECTURE_DESCRIPTION);
    expect(preset.description.toLowerCase()).toContain("architecture desk");
    expect(preset.description.toLowerCase()).toContain("not a workspace-wide peer graph");
    expect(preset.actions?.[0]?.href).toContain("deskBindGraph=1");
  });

  it("keeps Working graph idle on one New review action without sample CTA (CD-02)", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: false,
      demoUi: false,
      showIdleCard: true,
      workingMode: true,
    });

    expect(preset.actions).toHaveLength(1);
    expect(preset.actions?.[0]?.label).toBe("New review");
  });

  it("wires SN-025 surfaces and ADR 0079 anchor", () => {
    const moduleSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/system-not-job-graph-bound-to-open-package.ts"),
      "utf8",
    );
    const redirect = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/insights/WorkingPeerGraphRedirect.tsx"),
      "utf8",
    );
    const canvasShell = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphPageCanvasShell.tsx",
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

    expect(SYSTEM_NOT_JOB_GRAPH_BOUND_TO_OPEN_PACKAGE_OWNER).toBe("SN-025");
    expect(SYSTEM_NOT_JOB_GRAPH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR).toContain("0079");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_GRAPH_BOUND_TO_OPEN_PACKAGE_DOC_ANCHOR))).toBe(true);
    expect(moduleSource).toContain("resolveSystemNotJobWorkingPeerGraphRedirectHref");
    expect(SYSTEM_NOT_JOB_WORKING_GRAPH_BIND_SURFACES.length).toBeGreaterThanOrEqual(6);
    expect(redirect).toContain("resolveSystemNotJobWorkingPeerGraphRedirectHref");
    expect(canvasShell).toContain("WorkingGraphPickArchitectureEmptyState");
    expect(hubShell).toContain("ArchitecturesHubWorkingGraphBindEmptyStrip");
  });
});
