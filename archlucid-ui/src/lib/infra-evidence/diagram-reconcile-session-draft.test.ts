import { beforeEach, describe, expect, it } from "vitest";

import {
  readDiagramReconcileAdvisorySessionDraft,
  readDiagramReconcileSessionDraft,
  writeDiagramReconcileAdvisorySessionDraft,
  writeDiagramReconcileSessionDraft,
} from "@/lib/infra-evidence/diagram-reconcile-session-draft";

const RUN_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("diagram-reconcile-session-draft", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("round-trips advisory mermaid drafts keyed by tenant and snapshot", () => {
    writeDiagramReconcileAdvisorySessionDraft("tenant-a", "11111111-1111-1111-1111-111111111111", {
      sourceName: "advisory-draft",
      mermaid: "flowchart LR\n  x-->y",
    });

    expect(readDiagramReconcileAdvisorySessionDraft("tenant-a", "11111111-1111-1111-1111-111111111111")).toEqual({
      sourceName: "advisory-draft",
      mermaid: "flowchart LR\n  x-->y",
    });
  });

  it("round-trips mermaid drafts keyed by review record id", () => {
    writeDiagramReconcileSessionDraft(RUN_ID, {
      sourceName: "architecture-overview",
      mermaid: "flowchart LR\n  app-->db",
    });

    expect(readDiagramReconcileSessionDraft(RUN_ID)).toEqual({
      sourceName: "architecture-overview",
      mermaid: "flowchart LR\n  app-->db",
    });
  });
});
