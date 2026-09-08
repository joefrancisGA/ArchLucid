import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { discoverAppRouterPathnames } from "@/lib/routing/discover-app-router-pathnames";
import {
  WORKING_ROUTE_ROLES,
  classifyWorkingRoutePathname,
  requiresOpenArchitecture,
} from "@/lib/routing/working-route-roles";

const APP_DIR = join(process.cwd(), "src", "app");

describe("working route roles (AO-39)", () => {
  it("classifies representative routes into the five Working roles", () => {
    expect(classifyWorkingRoutePathname("/")).toBe("locator");
    expect(classifyWorkingRoutePathname("/architecture/architectures/arch-1")).toBe("locator");
    expect(
      classifyWorkingRoutePathname("/architecture/architectures/arch-1/drafts/draft-1"),
    ).toBe("nestedJob");
    expect(
      classifyWorkingRoutePathname("/architecture/architectures/arch-1/reviews/review-1"),
    ).toBe("nestedJob");
    expect(classifyWorkingRoutePathname("/architecture/reviews")).toBe("inbox");
    expect(classifyWorkingRoutePathname("/governance/findings")).toBe("inbox");
    expect(classifyWorkingRoutePathname("/insights/ask-review-questions")).toBe("bindTool");
    expect(classifyWorkingRoutePathname("/insights/evidence-graph")).toBe("bindTool");
    expect(classifyWorkingRoutePathname("/administration/users")).toBe("evalAdmin");
    expect(classifyWorkingRoutePathname("/pricing")).toBe("marketing");
    expect(classifyWorkingRoutePathname("/auth/signin")).toBe("auth");
    expect(classifyWorkingRoutePathname("/help/getting-started")).toBe("help");
    expect(classifyWorkingRoutePathname("/architecture/reviews/review-1")).toBe("legacyPeerJob");
  });

  it("marks bind-tool roles as architecture-scoped", () => {
    expect(requiresOpenArchitecture("bindTool")).toBe(true);
    expect(requiresOpenArchitecture("inbox")).toBe(false);
  });

  it("AO-39: every App Router page.tsx path is classified", () => {
    const pathnames = discoverAppRouterPathnames(APP_DIR);
    const unknown: string[] = [];

    for (const pathname of pathnames) {
      const role = classifyWorkingRoutePathname(pathname);

      if (role === null || !WORKING_ROUTE_ROLES.includes(role)) {
        unknown.push(pathname);
      }
    }

    expect(unknown, `Unclassified routes: ${unknown.join(", ")}`).toEqual([]);
  });
});
