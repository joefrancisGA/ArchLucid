import { describe, expect, it } from "vitest";

import { architectureNestedAskPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingFindingInspectHrefOptions } from "@/lib/inhabit/resolve-working-finding-inspect-href-options";

describe("resolveWorkingFindingInspectHrefOptions (WA-002)", () => {
  it("returns nested inspect options on Working Ask", () => {
    const options = resolveWorkingFindingInspectHrefOptions({
      workingMode: true,
      pathname: architectureNestedAskPath("arch-1"),
    });

    expect(options).toEqual({ architectureId: "arch-1", isWorkingMode: true });
  });

  it("uses scoped architectureId when the path is a peer hub", () => {
    const options = resolveWorkingFindingInspectHrefOptions({
      workingMode: true,
      pathname: "/governance/alerts",
      scopedArchitectureId: "arch-2",
    });

    expect(options).toEqual({ architectureId: "arch-2", isWorkingMode: true });
  });

  it("returns undefined in Guided mode", () => {
    const options = resolveWorkingFindingInspectHrefOptions({
      workingMode: false,
      pathname: architectureNestedAskPath("arch-1"),
    });

    expect(options).toBeUndefined();
  });
});
