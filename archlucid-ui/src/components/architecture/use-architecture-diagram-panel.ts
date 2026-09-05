"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { generateArchitectureDiagramAsync } from "@/lib/architecture/architecture-diagram-generate";
import { architectureDiagramModelToMermaid, isValidMermaidArchitectureDiagram } from "@/lib/architecture/architecture-diagram-mermaid";
import { summarizeArchitectureDiagramProvenance } from "@/lib/architecture/architecture-diagram-provenance";
import { formatArchitectureDiagramMissingExplanation } from "@/lib/architecture/architecture-diagram-readiness";
import {
  activateArchitectureDiagramVersion,
  appendArchitectureDiagramVersion,
  getActiveArchitectureDiagramVersion,
  readArchitectureDiagramCache,
  setArchitectureDiagramNodeOverrides,
  shouldRegenerateArchitectureDiagram,
} from "@/lib/architecture/architecture-diagram-storage";
import type { ArchitectureDiagramModel, ArchitectureDiagramNode, ArchitectureDiagramVersionSource } from "@/lib/architecture/architecture-diagram-types";
import type { ArchitectureDiagramElementKind } from "@/lib/architecture/architecture-diagram-provenance";
import {
  architectureDiagramSelectionHrefFromSearch,
  parseArchitectureDiagramEditOpenFromSearch,
  parseArchitectureDiagramIdFromSearch,
  parseArchitectureDiagramKindFromSearch,
} from "@/lib/architecture/architecture-diagram-selection-url";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { downloadBrowserTextFile, safeGraphExportFilenameSegment } from "@/lib/graph-view-model-export";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";

export type ArchitectureDiagramPanelProps = {
  readonly runId: string;
  readonly architectureName: string;
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly canEdit: boolean;
  readonly clarifyHref?: string;
  readonly onClarificationsNavigate?: () => void;
  readonly variant?: "full" | "preview";
  readonly onOpenFull?: () => void;
  readonly onUnconfirmedInferredCountChange?: (count: number) => void;
  /** TB-2201 — select provenance node when findings dual-pane highlights a component. */
  readonly highlightedNodeId?: string | null;
  /** TB-2201 — publish active node ids/labels for finding ↔ diagram selection sync. */
  readonly onDiagramNodesChange?: (nodes: readonly { id: string; label: string }[]) => void;
  /** When Do this next owns the page primary, keep tab-scoped follow-ons as outline actions. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

export type PanelPhase = "idle" | "loading" | "ready" | "insufficient" | "invalid" | "error";

export function useArchitectureDiagramPanel(props: ArchitectureDiagramPanelProps) {
  const variant = props.variant ?? "full";
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}`;
  const searchParams = useSearchParams();
  const urlDiagramKind = parseArchitectureDiagramKindFromSearch(searchParams.get("diagKind"));
  const urlDiagramId = parseArchitectureDiagramIdFromSearch(searchParams.get("diagId"));
  const urlDiagramEditOpen = parseArchitectureDiagramEditOpenFromSearch(searchParams.get("diagEdit"));
  const [phase, setPhase] = useState<PanelPhase>("idle");
  const [mermaidSource, setMermaidSource] = useState<string | null>(null);
  const [textAlternative, setTextAlternative] = useState("");
  const [contentFingerprint, setContentFingerprint] = useState("");
  const [missingExplanation, setMissingExplanation] = useState("");
  const [diagramModel, setDiagramModel] = useState<ArchitectureDiagramModel | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storageWriteFailed, setStorageWriteFailed] = useState(false);
  const [liveModelSynced, setLiveModelSynced] = useState(true);
  const [selectedElementKind, setSelectedElementKind] = useState<ArchitectureDiagramElementKind | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [, setCacheVersion] = useState(0);
  const autoStartedRef = useRef(false);
  const dark = useDocumentDarkMode();
  const onDiagramNodesChange = props.onDiagramNodesChange;
  const highlightedNodeId = props.highlightedNodeId;

  const syncDiagramSelectionToUrl = useCallback(
    (
      elementKind: ArchitectureDiagramElementKind | null,
      elementId: string | null,
      editorOpen: boolean,
    ): void => {
      router.replace(
        architectureDiagramSelectionHrefFromSearch(
          searchParams.toString(),
          { elementKind, elementId, editorOpen },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSelectedElementKindWithUrl = useCallback(
    (kind: ArchitectureDiagramElementKind | null) => {
      setSelectedElementKind(kind);
      syncDiagramSelectionToUrl(kind, selectedElementId, editorOpen);
    },
    [editorOpen, selectedElementId, syncDiagramSelectionToUrl],
  );

  const setSelectedElementIdWithUrl = useCallback(
    (id: string | null) => {
      setSelectedElementId(id);
      syncDiagramSelectionToUrl(selectedElementKind, id, editorOpen);
    },
    [editorOpen, selectedElementKind, syncDiagramSelectionToUrl],
  );

  const setEditorOpenWithUrl = useCallback(
    (open: boolean) => {
      setEditorOpen(open);
      syncDiagramSelectionToUrl(selectedElementKind, selectedElementId, open);
    },
    [selectedElementId, selectedElementKind, syncDiagramSelectionToUrl],
  );

  const selectDiagramElementWithUrl = useCallback(
    (kind: ArchitectureDiagramElementKind | null, id: string | null) => {
      setSelectedElementKind(kind);
      setSelectedElementId(id);
      syncDiagramSelectionToUrl(kind, id, editorOpen);
    },
    [editorOpen, syncDiagramSelectionToUrl],
  );

  useEffect(() => {
    if (diagramModel === null) {
      return;
    }

    if (urlDiagramKind === null || urlDiagramId.length === 0) {
      return;
    }

    const elementExists =
      urlDiagramKind === "node"
        ? diagramModel.nodes.some((node) => node.id === urlDiagramId && !node.removed)
        : diagramModel.edges.some((edge) => edge.id === urlDiagramId && !edge.removed);

    if (!elementExists) {
      return;
    }

    setSelectedElementKind(urlDiagramKind);
    setSelectedElementId(urlDiagramId);
    setEditorOpen(urlDiagramEditOpen);
  }, [diagramModel, urlDiagramEditOpen, urlDiagramId, urlDiagramKind]);

  useEffect(() => {
    if (diagramModel === null) {
      onDiagramNodesChange?.([]);
      return;
    }

    const nodes = diagramModel.nodes
      .filter((node) => !node.removed)
      .map((node) => ({ id: node.id, label: node.label }));
    onDiagramNodesChange?.(nodes);
  }, [diagramModel, onDiagramNodesChange]);

  useEffect(() => {
    if (highlightedNodeId === null || highlightedNodeId === undefined) {
      return;
    }

    const id = highlightedNodeId.trim();

    if (id.length === 0 || diagramModel === null) {
      return;
    }

    const exists = diagramModel.nodes.some((node) => node.id === id && !node.removed);

    if (!exists) {
      return;
    }

    setSelectedElementKind("node");
    setSelectedElementId(id);
    syncDiagramSelectionToUrl("node", id, editorOpen);
  }, [diagramModel, editorOpen, highlightedNodeId, syncDiagramSelectionToUrl]);

  const cache = readArchitectureDiagramCache(props.runId);
  const versions = cache?.versions ?? [];
  const activeVersionId = cache?.activeVersionId ?? null;
  const activeVersion = getActiveArchitectureDiagramVersion(cache);
  const inferredReviewLocked = activeVersion?.source === "user-edit";
  const diagramVersionSource: ArchitectureDiagramVersionSource | null = activeVersion?.source ?? null;

  const displayMermaidSource = useMemo(() => {
    if (mermaidSource === null) {
      return null;
    }

    if (!liveModelSynced || inferredReviewLocked || diagramModel === null) {
      return mermaidSource;
    }

    return architectureDiagramModelToMermaid(diagramModel, { dark });
  }, [dark, diagramModel, inferredReviewLocked, liveModelSynced, mermaidSource]);

  const runGeneration = useCallback(
    async (forceRegenerate: boolean) => {
      setPhase("loading");

      try {
        const latestCache = readArchitectureDiagramCache(props.runId);
        const result = await generateArchitectureDiagramAsync(
          props.sourceText,
          props.architectureName,
          props.userAssertions,
          latestCache?.nodeOverrides ?? [],
          latestCache?.edgeOverrides ?? [],
        );
        setContentFingerprint(result.contentFingerprint);

        if (!result.readiness.sufficient || result.mermaidSource === null) {
          setMissingExplanation(formatArchitectureDiagramMissingExplanation(result.readiness.missingCategories));
          setMermaidSource(null);
          setDiagramModel(null);
          setPhase("insufficient");
          return;
        }

        const cachedActive = getActiveArchitectureDiagramVersion(latestCache);
        const useCache =
          !forceRegenerate &&
          !shouldRegenerateArchitectureDiagram(latestCache, result.contentFingerprint, false) &&
          cachedActive !== null;

        if (useCache) {
          setMermaidSource(cachedActive.mermaidSource);
          setTextAlternative(result.textAlternative);
          setDiagramModel(result.model);
          setLiveModelSynced(cachedActive.source !== "user-edit");
          setPhase(isValidMermaidArchitectureDiagram(cachedActive.mermaidSource) ? "ready" : "invalid");
          return;
        }

        const appendResult = appendArchitectureDiagramVersion({
          runId: props.runId,
          contentFingerprint: result.contentFingerprint,
          mermaidSource: result.mermaidSource,
          source: forceRegenerate ? "regenerated" : "generated",
          label: forceRegenerate ? "Regenerated diagram" : "Generated diagram",
          nodeOverrides: latestCache?.nodeOverrides ?? [],
          edgeOverrides: latestCache?.edgeOverrides ?? [],
        });
        setStorageWriteFailed(appendResult.writeFailed);
        setCacheVersion((current) => current + 1);
        setMermaidSource(result.mermaidSource);
        setTextAlternative(result.textAlternative);
        setDiagramModel(result.model);
        setLiveModelSynced(true);
        setPhase(isValidMermaidArchitectureDiagram(result.mermaidSource) ? "ready" : "invalid");
      } catch {
        setMermaidSource(null);
        setDiagramModel(null);
        setLiveModelSynced(true);
        setPhase("error");
      }
    },
    [props.architectureName, props.runId, props.sourceText, props.userAssertions],
  );

  useEffect(() => {
    if (autoStartedRef.current) {
      return;
    }

    autoStartedRef.current = true;
    void runGeneration(false);
  }, [runGeneration]);

  useEffect(() => {
    props.onUnconfirmedInferredCountChange?.(
      summarizeArchitectureDiagramProvenance(diagramModel).unconfirmedInferredCount,
    );
  }, [diagramModel, props.onUnconfirmedInferredCountChange]);

  const copyMermaid = useCallback(async () => {
    if (mermaidSource === null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(mermaidSource);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [mermaidSource]);

  const downloadMermaid = useCallback(() => {
    if (mermaidSource === null) {
      return;
    }

    downloadBrowserTextFile(
      `${safeGraphExportFilenameSegment(props.runId)}-architecture-diagram.mmd`,
      mermaidSource,
      "text/plain;charset=utf-8",
    );
  }, [mermaidSource, props.runId]);

  const handleNodeOverride = useCallback(
    (nodes: readonly ArchitectureDiagramNode[]) => {
      if (inferredReviewLocked) {
        return;
      }

      const written = setArchitectureDiagramNodeOverrides(props.runId, nodes, cache?.edgeOverrides ?? []);

      if (written === null) {
        setStorageWriteFailed(true);
        return;
      }

      setCacheVersion((current) => current + 1);
      void runGeneration(true);
    },
    [cache?.edgeOverrides, inferredReviewLocked, props.runId, runGeneration],
  );

  const clarifyArchitectureVariant: "outline" | "primary" =
    props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";

  const onSaveMermaid = useCallback(
    (nextSource: string) => {
      const appendResult = appendArchitectureDiagramVersion({
        runId: props.runId,
        contentFingerprint,
        mermaidSource: nextSource,
        source: "user-edit",
        label: "Edited diagram",
      });
      setStorageWriteFailed(appendResult.writeFailed);
      setCacheVersion((current) => current + 1);
      setMermaidSource(nextSource);
      setLiveModelSynced(false);
      setPhase(isValidMermaidArchitectureDiagram(nextSource) ? "ready" : "invalid");
    },
    [contentFingerprint, props.runId],
  );

  const onActivateVersion = useCallback(
    (versionId: string) => {
      activateArchitectureDiagramVersion(props.runId, versionId);
      setCacheVersion((current) => current + 1);
      const activated = readArchitectureDiagramCache(props.runId);
      const version = activated?.versions.find((entry) => entry.versionId === versionId);

      if (version !== undefined) {
        setMermaidSource(version.mermaidSource);
        setLiveModelSynced(false);
        setPhase(isValidMermaidArchitectureDiagram(version.mermaidSource) ? "ready" : "invalid");
      }
    },
    [props.runId],
  );

  return {
    variant,
    phase,
    mermaidSource,
    textAlternative,
    missingExplanation,
    diagramModel,
    editorOpen,
    setEditorOpen: setEditorOpenWithUrl,
    copied,
    storageWriteFailed,
    selectedElementKind,
    setSelectedElementKind: setSelectedElementKindWithUrl,
    selectedElementId,
    setSelectedElementId: setSelectedElementIdWithUrl,
    selectDiagramElementWithUrl,
    versions,
    activeVersionId,
    inferredReviewLocked,
    diagramVersionSource,
    displayMermaidSource,
    runGeneration,
    copyMermaid,
    downloadMermaid,
    handleNodeOverride,
    clarifyArchitectureVariant,
    onSaveMermaid,
    onActivateVersion,
    canEdit: props.canEdit,
    runId: props.runId,
    clarifyHref: props.clarifyHref,
    onClarificationsNavigate: props.onClarificationsNavigate,
    onOpenFull: props.onOpenFull,
    pagePrimaryOwnedElsewhere: props.pagePrimaryOwnedElsewhere,
    versionsCount: versions.length,
  };
}

export type ArchitectureDiagramPanelState = ReturnType<typeof useArchitectureDiagramPanel>;
