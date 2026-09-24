import { beforeEach, describe, expect, it } from "vitest";

import {
  readDiagramReconcileSessionDraft,
  writeDiagramReconcileSessionDraft,
} from "@/lib/infra-evidence/diagram-reconcile-session-draft";

const RUN_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("diagram-reconcile-session-draft", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
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
