import { describe, expect, it } from "vitest";

import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import {
  getImpactPreviewShellPageState,
  setImpactPreviewShellPageState,
} from "@/lib/impact-preview-route-shell-state";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

describe("impact-preview-route-shell-state", () => {
  it("suppresses the coach strip when impact preview is blocked", () => {
    setImpactPreviewShellPageState("no_baseline");

    expect(getImpactPreviewShellPageState()).toBe("no_baseline");
    expect(routeViewExplanationForPathname(IMPACT_PREVIEW_PATH, { impactPreviewPageState: "no_baseline" })).toBeNull();

    setImpactPreviewShellPageState("unknown");
  });
});
