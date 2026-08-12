"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArchitectureDiagramProvenancePanel } from "@/components/architecture/ArchitectureDiagramProvenancePanel";
import { ArchitectureDiagramEditor } from "@/components/architecture/ArchitectureDiagramEditor";
import { ArchitectureDiagramInferredPanel } from "@/components/architecture/ArchitectureDiagramInferredPanel";
import { ArchitectureDiagramLegend } from "@/components/architecture/ArchitectureDiagramLegend";
import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION,
  ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION,
  ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION,
  ARCHITECTURE_DIAGRAM_DRAFT_LABEL,
  ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL,
  ARCHITECTURE_DIAGRAM_EDIT_ACTION,
  ARCHITECTURE_DIAGRAM_GENERATE_ACTION,
  ARCHITECTURE_DIAGRAM_INFERRED_LOCKED_FOR_HAND_EDIT,
  ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING,
  ARCHITECTURE_DIAGRAM_LOADING_LABEL,
  ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE,
  ARCHITECTURE_DIAGRAM_PREVIEW_CLIPPED_LABEL,
  ARCHITECTURE_DIAGRAM_REGENERATE_ACTION,
  ARCHITECTURE_DIAGRAM_RENDER_FAILURE,
  ARCHITECTURE_DIAGRAM_RETRY_ACTION,
  ARCHITECTURE_DIAGRAM_SECTION_HEADING,
  ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE,
  ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE,
  ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION,
} from "@/lib/architecture/architecture-diagram-copy";
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
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { downloadBrowserTextFile, safeGraphExportFilenameSegment } from "@/lib/graph-view-model-export";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
};

type PanelPhase = "idle" | "loading" | "ready" | "insufficient" | "invalid" | "error";

/** Post-creation architecture diagram with async generation, caching, and edit controls. */
export function ArchitectureDiagramPanel(props: ArchitectureDiagramPanelProps): React.JSX.Element {
  const variant = props.variant ?? "full";
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
  }, [diagramModel, highlightedNodeId]);

  const cache = readArchitectureDiagramCache(props.runId);
  const versions = cache?.versions ?? [];
  const activeVersionId = cache?.activeVersionId ?? null;
  const activeVersion = getActiveArchitectureDiagramVersion(cache);
  const inferredReviewLocked = activeVersion?.source === "user-edit";
  const diagramVersionSource: ArchitectureDiagramVersionSource | null = activeVersion?.source ?? null;

  // History restore keeps mermaidSource; live generated views re-derive for theme-aware classDefs.
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
      // Hand-edited Mermaid stays authoritative until the architect regenerates or restores a generated version.
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

  const clarificationsAction =
    props.onClarificationsNavigate !== undefined ? (
      <Button
        type="button"
        variant="primary"
        data-testid="architecture-diagram-add-details"
        onClick={props.onClarificationsNavigate}
      >
        {ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION}
      </Button>
    ) : props.clarifyHref !== undefined ? (
      <Button type="button" variant="primary" asChild data-testid="architecture-diagram-add-details">
        <Link href={props.clarifyHref}>{ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION}</Link>
      </Button>
    ) : null;

  if (variant === "preview") {
    return (
      <div
        className="space-y-3 rounded-lg border border-dashed border-neutral-300 p-3 dark:border-neutral-700"
        data-testid="architecture-diagram-preview"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100")}>
              {ARCHITECTURE_DIAGRAM_SECTION_HEADING}
            </h3>
            <StatusTag kind="neutral" label={ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL} />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="architecture-diagram-open-full"
            onClick={() => {
              props.onOpenFull?.();
            }}
          >
            Open diagram tab
          </Button>
        </div>

        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE}
        </p>

        {phase === "loading" ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} aria-live="polite">
            {ARCHITECTURE_DIAGRAM_LOADING_LABEL}
          </p>
        ) : null}

        {phase === "insufficient" ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
            {missingExplanation || ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING}
          </p>
        ) : null}

        {phase === "error" || phase === "invalid" ? (
          <div className="space-y-2" role="alert" data-testid="architecture-diagram-preview-failure">
            <SeverityTag severity="high" label="Diagram unavailable" />
            <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
              {ARCHITECTURE_DIAGRAM_RENDER_FAILURE}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void runGeneration(false)}>
              {ARCHITECTURE_DIAGRAM_RETRY_ACTION}
            </Button>
          </div>
        ) : null}

        {phase === "ready" && displayMermaidSource !== null ? (
          <div className="space-y-1">
            <div className="relative max-h-48 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
              <ArchitectureDiagramViewer
                mermaidSource={displayMermaidSource}
                textAlternative={textAlternative}
                onRetry={() => void runGeneration(false)}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-neutral-950"
                aria-hidden
              />
            </div>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ARCHITECTURE_DIAGRAM_PREVIEW_CLIPPED_LABEL}
            </p>
          </div>
        ) : null}

        {phase === "idle" ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void runGeneration(false)}>
            {ARCHITECTURE_DIAGRAM_GENERATE_ACTION}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <section
      id="architecture-diagram"
      className="scroll-mt-24 space-y-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="architecture-diagram-panel"
      aria-labelledby="architecture-diagram-heading"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="architecture-diagram-heading" className={cn("m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100")}>
            {ARCHITECTURE_DIAGRAM_SECTION_HEADING}
          </h2>
          {phase === "ready" ? <StatusTag kind="neutral" label={ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL} /> : null}
        </div>
        {phase === "ready" ? (
          <>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
              {ARCHITECTURE_DIAGRAM_DRAFT_LABEL}
            </p>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE}
            </p>
          </>
        ) : null}
      </div>

      {storageWriteFailed ? (
        <p
          className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}
          role="alert"
          data-testid="architecture-diagram-storage-write-failure"
        >
          {ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE}
        </p>
      ) : null}

      {phase === "loading" ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-live="polite" data-testid="architecture-diagram-loading">
          {ARCHITECTURE_DIAGRAM_LOADING_LABEL}
        </p>
      ) : null}

      {phase === "insufficient" ? (
        <div className="space-y-3 rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700" data-testid="architecture-diagram-insufficient" role="status">
          <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING}
          </p>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{missingExplanation}</p>
          {clarificationsAction}
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="space-y-3" data-testid="architecture-diagram-generation-failure" role="alert">
          <SeverityTag severity="high" label="Diagram generation error" />
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}>
            {ARCHITECTURE_DIAGRAM_RENDER_FAILURE}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void runGeneration(false)} data-testid="architecture-diagram-retry">
            {ARCHITECTURE_DIAGRAM_RETRY_ACTION}
          </Button>
        </div>
      ) : null}

      {phase === "invalid" ? (
        <div className="space-y-3" data-testid="architecture-diagram-invalid" role="alert">
          <SeverityTag severity="medium" label="Invalid diagram source" />
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}>
            The diagram source is invalid. Edit the diagram or regenerate after updating your brief.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void runGeneration(true)}>
            {ARCHITECTURE_DIAGRAM_REGENERATE_ACTION}
          </Button>
        </div>
      ) : null}

      {phase === "ready" && displayMermaidSource !== null ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
            <ArchitectureDiagramViewer
              mermaidSource={displayMermaidSource}
              textAlternative={textAlternative}
              onRetry={() => void runGeneration(false)}
            />
            {diagramModel !== null ? (
              <div className="space-y-3">
                <ArchitectureDiagramProvenancePanel
                  runId={props.runId}
                  model={diagramModel}
                  diagramVersionSource={diagramVersionSource}
                  selectedKind={selectedElementKind}
                  selectedId={selectedElementId}
                  onSelect={(kind, id) => {
                    setSelectedElementKind(kind);
                    setSelectedElementId(id);
                  }}
                />
                {inferredReviewLocked ? (
                  <p
                    className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                    role="status"
                    data-testid="architecture-diagram-inferred-locked"
                  >
                    {ARCHITECTURE_DIAGRAM_INFERRED_LOCKED_FOR_HAND_EDIT}
                  </p>
                ) : null}
                <ArchitectureDiagramInferredPanel
                  model={diagramModel}
                  canEdit={props.canEdit && !inferredReviewLocked}
                  onNodeOverride={handleNodeOverride}
                />
              </div>
            ) : null}
          </div>
          <ArchitectureDiagramLegend model={diagramModel} />
          <div className="flex flex-wrap gap-2">
            {props.canEdit ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                {ARCHITECTURE_DIAGRAM_EDIT_ACTION}
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void runGeneration(true)} data-testid="architecture-diagram-regenerate">
              {ARCHITECTURE_DIAGRAM_REGENERATE_ACTION}
            </Button>
            <details data-testid="architecture-diagram-mermaid-source">
              <summary className={cn("cursor-pointer px-1 py-2 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
                {ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION}
              </summary>
              <div className="mt-2 space-y-2">
                <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE}
                </p>
                <pre className="max-h-48 overflow-auto rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-900">{mermaidSource}</pre>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyMermaid()}>
                    {copied ? "Copied" : ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={downloadMermaid}>
                    {ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION}
                  </Button>
                </div>
              </div>
            </details>
          </div>
        </>
      ) : null}

      {diagramModel !== null && mermaidSource !== null ? (
        <ArchitectureDiagramEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          mermaidSource={mermaidSource}
          versions={versions}
          activeVersionId={activeVersionId}
          canEdit={props.canEdit}
          storageWriteFailed={storageWriteFailed}
          onSaveMermaid={(nextSource) => {
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
          }}
          onActivateVersion={(versionId) => {
            activateArchitectureDiagramVersion(props.runId, versionId);
            setCacheVersion((current) => current + 1);
            const activated = readArchitectureDiagramCache(props.runId);
            const version = activated?.versions.find((entry) => entry.versionId === versionId);

            if (version !== undefined) {
              setMermaidSource(version.mermaidSource);
              setLiveModelSynced(false);
              setPhase(isValidMermaidArchitectureDiagram(version.mermaidSource) ? "ready" : "invalid");
            }
          }}
        />
      ) : null}
    </section>
  );
}
