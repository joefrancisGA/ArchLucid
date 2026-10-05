import { describe, expect, it } from "vitest";

import { parseDiagramReconcileWorkbenchModeFromSearch } from "@/lib/infra-evidence/diagram-reconcile-workbench-mode";

describe("diagram-reconcile-workbench-mode", () => {
  it("defaults to advisory when compare mode and run id are absent", () => {
    expect(parseDiagramReconcileWorkbenchModeFromSearch(null, "")).toBe("advisory");
  });

  it("defaults to sealed when run id is present without compare mode", () => {
    expect(
      parseDiagramReconcileWorkbenchModeFromSearch(
        null,
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      ),
    ).toBe("sealed");
  });

  it("honors explicit compare mode in the URL", () => {
    expect(parseDiagramReconcileWorkbenchModeFromSearch("advisory", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(
      "advisory",
    );
    expect(parseDiagramReconcileWorkbenchModeFromSearch("sealed", "")).toBe("sealed");
  });
});
