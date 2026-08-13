import type {
  ArchitectureDiagramCacheRecord,
  ArchitectureDiagramEdge,
  ArchitectureDiagramNode,
  ArchitectureDiagramVersion,
  ArchitectureDiagramVersionSource,
} from "@/lib/architecture/architecture-diagram-types";

const STORAGE_PREFIX = "archlucid_architecture_diagram_v1_";

function storageKey(runId: string): string {
  return `${STORAGE_PREFIX}${runId.trim()}`;
}

function tryPersistArchitectureDiagramCache(record: ArchitectureDiagramCacheRecord): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    window.localStorage.setItem(storageKey(record.runId), JSON.stringify(record));

    return true;
  } catch {
    return false;
  }
}

function createVersionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `diagram_${Date.now()}`;
}

export function readArchitectureDiagramCache(runId: string): ArchitectureDiagramCacheRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(trimmedRunId));

    if (raw === null || raw.length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as ArchitectureDiagramCacheRecord;

    if (parsed.runId !== trimmedRunId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeArchitectureDiagramCache(record: ArchitectureDiagramCacheRecord): void {
  if (typeof window === "undefined") {
    return;
  }

  tryPersistArchitectureDiagramCache(record);
}

export function getActiveArchitectureDiagramVersion(
  cache: ArchitectureDiagramCacheRecord | null,
): ArchitectureDiagramVersion | null {
  if (cache === null) {
    return null;
  }

  return cache.versions.find((version) => version.versionId === cache.activeVersionId) ?? null;
}

export function shouldRegenerateArchitectureDiagram(
  cache: ArchitectureDiagramCacheRecord | null,
  contentFingerprint: string,
  forceRegenerate: boolean,
): boolean {
  if (forceRegenerate) {
    return true;
  }

  if (cache === null) {
    return true;
  }

  return cache.contentFingerprint !== contentFingerprint;
}

export type ArchitectureDiagramAppendResult = {
  readonly record: ArchitectureDiagramCacheRecord;
  readonly writeFailed: boolean;
};

export function appendArchitectureDiagramVersion(input: {
  readonly runId: string;
  readonly contentFingerprint: string;
  readonly mermaidSource: string;
  readonly source: ArchitectureDiagramVersionSource;
  readonly label: string;
  readonly nodeOverrides?: readonly ArchitectureDiagramNode[];
  readonly edgeOverrides?: readonly ArchitectureDiagramEdge[];
}): ArchitectureDiagramAppendResult {
  const existing = readArchitectureDiagramCache(input.runId);
  const versionId = createVersionId();
  const version: ArchitectureDiagramVersion = {
    versionId,
    savedAtUtc: new Date().toISOString(),
    source: input.source,
    mermaidSource: input.mermaidSource,
    contentFingerprint: input.contentFingerprint,
    label: input.label,
  };
  const versions = [...(existing?.versions ?? []), version].slice(-20);
  const record: ArchitectureDiagramCacheRecord = {
    runId: input.runId,
    contentFingerprint: input.contentFingerprint,
    activeVersionId: versionId,
    versions,
    nodeOverrides: input.nodeOverrides ?? existing?.nodeOverrides ?? [],
    edgeOverrides: input.edgeOverrides ?? existing?.edgeOverrides ?? [],
  };

  let writeFailed = false;

  if (typeof window !== "undefined") {
    writeFailed = !tryPersistArchitectureDiagramCache(record);
  }

  return { record, writeFailed };
}

export function setArchitectureDiagramNodeOverrides(
  runId: string,
  nodeOverrides: readonly ArchitectureDiagramNode[],
  edgeOverrides: readonly ArchitectureDiagramEdge[],
): ArchitectureDiagramCacheRecord | null {
  const existing = readArchitectureDiagramCache(runId);

  if (existing === null) {
    return null;
  }

  const record: ArchitectureDiagramCacheRecord = {
    ...existing,
    nodeOverrides,
    edgeOverrides,
  };

  writeArchitectureDiagramCache(record);

  return record;
}

export function activateArchitectureDiagramVersion(
  runId: string,
  versionId: string,
): ArchitectureDiagramCacheRecord | null {
  const existing = readArchitectureDiagramCache(runId);

  if (existing === null) {
    return null;
  }

  const version = existing.versions.find((entry) => entry.versionId === versionId);

  if (version === undefined) {
    return null;
  }

  const record: ArchitectureDiagramCacheRecord = {
    ...existing,
    activeVersionId: versionId,
    contentFingerprint: version.contentFingerprint,
  };

  writeArchitectureDiagramCache(record);

  return record;
}
