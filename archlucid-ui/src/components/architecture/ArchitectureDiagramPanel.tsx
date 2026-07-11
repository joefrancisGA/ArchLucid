"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArchitectureDiagramEditor } from "@/components/architecture/ArchitectureDiagramEditor";
import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION,
  ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION,
  ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION,
  ARCHITECTURE_DIAGRAM_DRAFT_LABEL,
  ARCHITECTURE_DIAGRAM_EDIT_ACTION,
  ARCHITECTURE_DIAGRAM_GENERATE_ACTION,
  ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING,
  ARCHITECTURE_DIAGRAM_LOADING_LABEL,
  ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE,
  ARCHITECTURE_DIAGRAM_REGENERATE_ACTION,
  ARCHITECTURE_DIAGRAM_SECTION_HEADING,
  ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION,
} from "@/lib/architecture-diagram-copy";
import { generateArchitectureDiagramAsync } from "@/lib/architecture-diagram-generate";
import { isValidMermaidArchitectureDiagram } from "@/lib/architecture-diagram-mermaid";
import { formatArchitectureDiagramMissingExplanation } from "@/lib/architecture-diagram-readiness";
import {
  activateArchitectureDiagramVersion,
  appendArchitectureDiagramVersion,
  getActiveArchitectureDiagramVersion,
  readArchitectureDiagramCache,
  setArchitectureDiagramNodeOverrides,
  shouldRegenerateArchitectureDiagram,
} from "@/lib/architecture-diagram-storage";
import type { ArchitectureDiagramModel } from "@/lib/architecture-diagram-types";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";
import { downloadBrowserTextFile, safeGraphExportFilenameSegment } from "@/lib/graph-view-model-export";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramPanelProps = {
  readonly runId: string;
  readonly architectureName: string;
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly canEdit: boolean;
  readonly clarifyHref?: string;
};

type PanelPhase = "idle" | "loading" | "ready" | "insufficient" | "invalid";

/** Post-creation architecture diagram with async generation, caching, and edit controls. */
export function ArchitectureDiagramPanel(props: ArchitectureDiagramPanelProps): React.JSX.Element {
  const clarifyHref = props.clarifyHref ?? REVIEWS_NEW_CREATE_ARCHITECTURE_HREF;
  const [phase, setPhase] = useState<PanelPhase>("idle");
  const [mermaidSource, setMermaidSource] = useState<string | null>(null);
  const [textAlternative, setTextAlternative] = useState("");
  const [contentFingerprint, setContentFingerprint] = useState("");
  const [missingExplanation, setMissingExplanation] = useState("");
  const [diagramModel, setDiagramModel] = useState<ArchitectureDiagramModel | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const autoStartedRef = useRef(false);

  const cache = useMemo(() => readArchitectureDiagramCache(props.runId), [props.runId, cacheVersion]);
  const versions = cache?.versions ?? [];

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

        const useCache =
          !forceRegenerate &&
          !shouldRegenerateArchitectureDiagram(latestCache, result.contentFingerprint, false) &&
          getActiveArchitectureDiagramVersion(latestCache) !== null;

        if (useCache) {
          const cached = getActiveArchitectureDiagramVersion(latestCache)!;
          setMermaidSource(cached.mermaidSource);
          setTextAlternative(result.textAlternative);
          setDiagramModel(result.model);
          setPhase(isValidMermaidArchitectureDiagram(cached.mermaidSource) ? "ready" : "invalid");
          return;
        }

        appendArchitectureDiagramVersion({
          runId: props.runId,
          contentFingerprint: result.contentFingerprint,
          mermaidSource: result.mermaidSource,
          source: forceRegenerate ? "regenerated" : "generated",
          label: forceRegenerate ? "Regenerated diagram" : "Generated diagram",
          nodeOverrides: latestCache?.nodeOverrides ?? [],
          edgeOverrides: latestCache?.edgeOverrides ?? [],
        });
        setCacheVersion((current) => current + 1);
        setMermaidSource(result.mermaidSource);
        setTextAlternative(result.textAlternative);
        setDiagramModel(result.model);
        setPhase(isValidMermaidArchitectureDiagram(result.mermaidSource) ? "ready" : "invalid");
      } catch {
        setPhase("invalid");
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

  return (
    <section
      id="architecture-diagram"
      className="scroll-mt-24 space-y-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="architecture-diagram-panel"
      aria-labelledby="architecture-diagram-heading"
    >
      <div className="space-y-1">
        <h2 id="architecture-diagram-heading" className={cn("m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100")}>
          {ARCHITECTURE_DIAGRAM_SECTION_HEADING}
        </h2>
        {phase === "ready" ? (
          <>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ARCHITECTURE_DIAGRAM_DRAFT_LABEL}
            </p>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE}
            </p>
          </>
        ) : null}
      </div>

      {phase === "loading" ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-live="polite" data-testid="architecture-diagram-loading">
          {ARCHITECTURE_DIAGRAM_LOADING_LABEL}
        </p>
      ) : null}

      {phase === "insufficient" ? (
        <div className="space-y-3 rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700" data-testid="architecture-diagram-insufficient">
          <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING}
          </p>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{missingExplanation}</p>
          <Button type="button" variant="primary" asChild data-testid="architecture-diagram-add-details">
            <Link href={clarifyHref}>{ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION}</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void runGeneration(false)} data-testid="architecture-diagram-generate">
            {ARCHITECTURE_DIAGRAM_GENERATE_ACTION}
          </Button>
        </div>
      ) : null}

      {phase === "invalid" && mermaidSource !== null ? (
        <div className="space-y-3" data-testid="architecture-diagram-invalid">
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            The diagram source is invalid. Edit the diagram or regenerate after updating your brief.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void runGeneration(true)}>
            {ARCHITECTURE_DIAGRAM_REGENERATE_ACTION}
          </Button>
        </div>
      ) : null}

      {phase === "ready" && mermaidSource !== null ? (
        <>
          <ArchitectureDiagramViewer
            mermaidSource={mermaidSource}
            textAlternative={textAlternative}
            onRetry={() => void runGeneration(false)}
          />
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
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-900">{mermaidSource}</pre>
            </details>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyMermaid()}>
              {copied ? "Copied" : ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadMermaid}>
              {ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION}
            </Button>
          </div>
        </>
      ) : null}

      {diagramModel !== null && mermaidSource !== null ? (
        <ArchitectureDiagramEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          model={diagramModel}
          mermaidSource={mermaidSource}
          versions={versions}
          canEdit={props.canEdit}
          onSaveMermaid={(nextSource) => {
            appendArchitectureDiagramVersion({
              runId: props.runId,
              contentFingerprint,
              mermaidSource: nextSource,
              source: "user-edit",
              label: "Edited diagram",
            });
            setCacheVersion((current) => current + 1);
            setMermaidSource(nextSource);
            setPhase(isValidMermaidArchitectureDiagram(nextSource) ? "ready" : "invalid");
          }}
          onNodeOverride={(nodes) => {
            setArchitectureDiagramNodeOverrides(props.runId, nodes, cache?.edgeOverrides ?? []);
            setCacheVersion((current) => current + 1);
            void runGeneration(true);
          }}
          onActivateVersion={(versionId) => {
            activateArchitectureDiagramVersion(props.runId, versionId);
            setCacheVersion((current) => current + 1);
            const activated = readArchitectureDiagramCache(props.runId);
            const version = activated?.versions.find((entry) => entry.versionId === versionId);

            if (version !== undefined) {
              setMermaidSource(version.mermaidSource);
              setPhase(isValidMermaidArchitectureDiagram(version.mermaidSource) ? "ready" : "invalid");
            }
          }}
        />
      ) : null}
    </section>
  );
}
