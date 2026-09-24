const STORAGE_KEY_PREFIX = "infra-diagram-reconcile-draft:";

export type DiagramReconcileSessionDraft = {
  readonly sourceName: string;
  readonly mermaid: string;
};

export function diagramReconcileSessionDraftStorageKey(runId: string): string {
  return `${STORAGE_KEY_PREFIX}${runId.trim()}`;
}

export function readDiagramReconcileSessionDraft(runId: string): DiagramReconcileSessionDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(diagramReconcileSessionDraftStorageKey(trimmed));

    if (raw == null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<DiagramReconcileSessionDraft>;

    return {
      sourceName: typeof parsed.sourceName === "string" ? parsed.sourceName : "",
      mermaid: typeof parsed.mermaid === "string" ? parsed.mermaid : "",
    };
  } catch {
    return null;
  }
}

export function writeDiagramReconcileSessionDraft(
  runId: string,
  draft: DiagramReconcileSessionDraft,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      diagramReconcileSessionDraftStorageKey(trimmed),
      JSON.stringify(draft),
    );
  } catch {
    // Session storage may be unavailable in private mode — ignore.
  }
}
