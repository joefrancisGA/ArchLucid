import { act, fireEvent, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useArchitectureDraftDocumentUndo } from "@/hooks/use-architecture-draft-document-undo";
import { ARCHITECTURE_DRAFT_DOCUMENT_UNDO_COALESCE_MS } from "@/lib/architecture/architecture-draft-document-undo";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import type { ActorSet } from "@/types/draft-intake";

const initialFields: ArchitectureDraftFieldState = {
  systemName: "Claims intake",
  freeTextIntent: "",
  businessOutcome: "",
  openQuestions: "",
  structuredBrief: emptyArchitectureDraftStructuredBrief(),
};

describe("useArchitectureDraftDocumentUndo", () => {
  afterEach(() => vi.useRealTimers());

  it("undoes the newest edit while its history entry is waiting to be recorded", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => {
      const [fields, setFields] = useState(initialFields);
      const [actorSet, setActorSet] = useState<ActorSet>({ actors: [] });
      const history = useArchitectureDraftDocumentUndo({
        fields,
        actorSet,
        setFields,
        setActorSet,
        enabled: true,
      });

      return {
        systemName: fields.systemName,
        rename: (systemName: string) => setFields((current) => ({ ...current, systemName })),
        history,
      };
    });

    act(() => result.current.rename("Claims review"));
    act(() => vi.advanceTimersByTime(ARCHITECTURE_DRAFT_DOCUMENT_UNDO_COALESCE_MS));
    act(() => result.current.rename("Claims review platform"));

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });

    expect(result.current.systemName).toBe("Claims review");
    expect(result.current.history.canRedo).toBe(true);
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(result.current.systemName).toBe("Claims review platform");

    act(() => vi.advanceTimersByTime(ARCHITECTURE_DRAFT_DOCUMENT_UNDO_COALESCE_MS));
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(result.current.systemName).toBe("Claims review");

    act(() => result.current.rename("Claims archive"));
    expect(result.current.history.canRedo).toBe(false);
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(result.current.systemName).toBe("Claims archive");
  });
});
