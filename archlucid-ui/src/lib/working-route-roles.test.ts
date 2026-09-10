import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { enumerateAppRouterPagePaths } from "@/lib/app-router-page-paths";
import {
  WORKING_TOOL_MUST_BIND_HREFS,
  classifyWorkingRouteRole,
  isWorkingPaletteNavigationHrefAllowed,
  isWorkingToolMustBindHref,
} from "@/lib/working-route-roles";

const APP_DIR = join(process.cwd(), "src/app");

describe("working-route-roles (AO-39)", () => {
  it("classifies every App Router page path", () => {
    const paths = enumerateAppRouterPagePaths(APP_DIR);

    expect(paths.length).toBeGreaterThan(100);

    for (const path of paths) {
      expect(classifyWorkingRouteRole(path)).toBeTruthy();
    }
  });

  it("marks marketing routes separately from operator workspace routes", () => {
    expect(classifyWorkingRouteRole("/trust")).toBe("marketing");
    expect(classifyWorkingRouteRole("/pricing")).toBe("marketing");
    expect(classifyWorkingRouteRole("/architecture/architectures")).toBe("locator");
  });

  it("marks nested architecture jobs distinctly from peer review URLs", () => {
    expect(
      classifyWorkingRouteRole("/architecture/architectures/architecture-identity-001/reviews/run-001"),
    ).toBe("nested-job");
    expect(classifyWorkingRouteRole("/architecture/reviews/run-001")).toBe("peer-review-job");
    expect(classifyWorkingRouteRole("/architecture/reviews")).toBe("inbox");
  });

  it("lists bind-tool hrefs consumed by AO-40 and AO-41", () => {
    expect(WORKING_TOOL_MUST_BIND_HREFS.length).toBeGreaterThanOrEqual(4);

    for (const href of WORKING_TOOL_MUST_BIND_HREFS) {
      expect(isWorkingToolMustBindHref(href)).toBe(true);
      expect(classifyWorkingRouteRole(href)).toBe("tool-must-bind");
    }
  });

  it("AO-41: blocks bind-tool palette navigation until an architecture desk is open", () => {
    expect(isWorkingPaletteNavigationHrefAllowed("/insights/evidence-graph", null)).toBe(false);
    expect(
      isWorkingPaletteNavigationHrefAllowed(
        "/insights/evidence-graph",
        "architecture-identity-001",
      ),
    ).toBe(true);
    expect(isWorkingPaletteNavigationHrefAllowed("/architecture/architectures", null)).toBe(true);
    expect(isWorkingPaletteNavigationHrefAllowed("/internal/health", null)).toBe(false);
  });
});
