import { describe, expect, it } from "vitest";

import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  ARCHITECTURE_DRAFT_DOCUMENT_UNDO_STACK_DEPTH,
  cloneDraftDocumentSnapshot,
  draftDocumentSnapshotsEqual,
  pushDraftDocumentUndoSnapshot,
  redoDraftDocumentSnapshot,
  undoDraftDocumentSnapshot,
  type ArchitectureDraftDocumentSnapshot,
} from "@/lib/architecture/architecture-draft-document-undo";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ActorSet } from "@/types/draft-intake";

const baseFields: ArchitectureDraftFieldState = {
  freeTextIntent: "Intent one",
  businessOutcome: "Outcome one",
  systemName: "System A",
  structuredBrief: emptyArchitectureDraftStructuredBrief(),
};

const actorSet: ActorSet = {
  actors: [
    {
      label: "Operator",
      kind: "Human",
      trustOrigin: "Internal",
      contract: "Employee",
    },
  ],
};

function snapshot(
  overrides?: Partial<ArchitectureDraftFieldState>,
): ArchitectureDraftDocumentSnapshot {
  return {
    fields: { ...baseFields, ...overrides },
    actorSet,
  };
}

describe("architecture-draft-document-undo", () => {
  it("pushDraftDocumentUndoSnapshot dedupes identical top entries", () => {
    const first = snapshot();
    const stacks = pushDraftDocumentUndoSnapshot({ undo: [], redo: [] }, first);
    const again = pushDraftDocumentUndoSnapshot(stacks, first);

    expect(again.undo).toHaveLength(1);
  });

  it("undoDraftDocumentSnapshot restores prior snapshot and pushes current to redo", () => {
    const a = snapshot({ systemName: "A" });
    const b = snapshot({ systemName: "B" });
    let stacks = pushDraftDocumentUndoSnapshot({ undo: [], redo: [] }, a);

    const undoResult = undoDraftDocumentSnapshot(stacks, b);

    expect(undoResult.restored).not.toBeNull();
    expect(undoResult.restored!.fields.systemName).toBe("A");
    expect(undoResult.stacks.redo).toHaveLength(1);
    expect(undoResult.stacks.redo[0].fields.systemName).toBe("B");
  });

  it("redoDraftDocumentSnapshot inverts undo", () => {
    const a = snapshot({ systemName: "A" });
    const b = snapshot({ systemName: "B" });
    let stacks = pushDraftDocumentUndoSnapshot({ undo: [], redo: [] }, a);
    const undone = undoDraftDocumentSnapshot(stacks, b);
    const redone = redoDraftDocumentSnapshot(undone.stacks, undone.restored!);

    expect(redone.restored?.fields.systemName).toBe("B");
  });

  it("respects max depth", () => {
    let stacks = { undo: [] as ArchitectureDraftDocumentSnapshot[], redo: [] as ArchitectureDraftDocumentSnapshot[] };

    for (let index = 0; index < ARCHITECTURE_DRAFT_DOCUMENT_UNDO_STACK_DEPTH + 5; index += 1) {
      stacks = pushDraftDocumentUndoSnapshot(stacks, snapshot({ systemName: `S${index}` }));
    }

    expect(stacks.undo).toHaveLength(ARCHITECTURE_DRAFT_DOCUMENT_UNDO_STACK_DEPTH);
    expect(stacks.undo[0].fields.systemName).toBe("S5");
  });

  it("cloneDraftDocumentSnapshot deep-copies structured brief", () => {
    const original = snapshot();
    const cloned = cloneDraftDocumentSnapshot(original);

    cloned.fields.structuredBrief.qualityAttribute = "changed";

    expect(draftDocumentSnapshotsEqual(original, cloned)).toBe(false);
  });
});
