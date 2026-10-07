import { describe, expect, it } from "vitest";

import {
  findDiagramReconcileOverlayMatch,
  resolveDiagramReconcileOverlayStyle,
} from "@/lib/infra-evidence/diagram-reconcile-overlay";

describe("diagram-reconcile-overlay", () => {
  it("does not give Conflict the ready status", () => {
    expect(resolveDiagramReconcileOverlayStyle("Conflict").statusKind).toBe("blocked");
    expect(resolveDiagramReconcileOverlayStyle("Conflict").statusKind).not.toBe("ready");
  });

  it("uses ready for Exact and Confirmed", () => {
    expect(resolveDiagramReconcileOverlayStyle("Exact").statusKind).toBe("ready");
    expect(resolveDiagramReconcileOverlayStyle("Confirmed").statusKind).toBe("ready");
  });

  it("joins correspondence rows to the imported diagram node id", () => {
    expect(
      findDiagramReconcileOverlayMatch(
        [{ nodeId: "portal", matchKind: "Exact" }],
        "portal",
      ),
    ).toEqual({ nodeId: "portal", matchKind: "Exact" });
    expect(findDiagramReconcileOverlayMatch([], "missing")).toBeNull();
  });
});
