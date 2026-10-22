const STORAGE_KEY_PREFIX = "infra-diagram-reconcile-draft:";
const ADVISORY_STORAGE_KEY_PREFIX = "infra-diagram-reconcile-advisory-draft:";

export type DiagramReconcileSessionDraft = {
  readonly sourceName: string;
  readonly mermaid: string;
};

export function diagramReconcileSessionDraftStorageKey(runId: string): string {
  return `${STORAGE_KEY_PREFIX}${runId.trim()}`;
}

export function diagramReconcileAdvisorySessionDraftStorageKey(
  tenantId: string,
  snapshotId: string,
): string {
  return `${ADVISORY_STORAGE_KEY_PREFIX}${tenantId.trim()}:${snapshotId.trim()}`;
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

export function readDiagramReconcileAdvisorySessionDraft(
  tenantId: string,
  snapshotId: string,
): DiagramReconcileSessionDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const tenant = tenantId.trim();
  const snapshot = snapshotId.trim();

  if (tenant.length === 0 || snapshot.length === 0) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(diagramReconcileAdvisorySessionDraftStorageKey(tenant, snapshot));

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

export function writeDiagramReconcileAdvisorySessionDraft(
  tenantId: string,
  snapshotId: string,
  draft: DiagramReconcileSessionDraft,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const tenant = tenantId.trim();
  const snapshot = snapshotId.trim();

  if (tenant.length === 0 || snapshot.length === 0) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      diagramReconcileAdvisorySessionDraftStorageKey(tenant, snapshot),
      JSON.stringify(draft),
    );
  } catch {
    // Session storage may be unavailable in private mode — ignore.
  }
}
