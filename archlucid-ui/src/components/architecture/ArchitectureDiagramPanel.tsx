"use client";

import { cn } from "@/lib/utils";

import { ArchitectureDiagramInsufficientState } from "@/components/architecture/ArchitectureDiagramInsufficientState";
import { ArchitectureDiagramReadyView } from "@/components/architecture/ArchitectureDiagramReadyView";
import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ARCHITECTURE_DIAGRAM_DRAFT_LABEL,
  ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL,
  ARCHITECTURE_DIAGRAM_GENERATE_ACTION,
  ARCHITECTURE_DIAGRAM_LOADING_LABEL,
  ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE,
  ARCHITECTURE_DIAGRAM_PREVIEW_CLIPPED_LABEL,
  ARCHITECTURE_DIAGRAM_REGENERATE_ACTION,
  ARCHITECTURE_DIAGRAM_RENDER_FAILURE,
  ARCHITECTURE_DIAGRAM_RETRY_ACTION,
  ARCHITECTURE_DIAGRAM_SECTION_HEADING,
  ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE,
} from "@/lib/architecture/architecture-diagram-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  useArchitectureDiagramPanel,
  type ArchitectureDiagramPanelProps,
} from "./use-architecture-diagram-panel";

export type { ArchitectureDiagramPanelProps };

/** Post-creation architecture diagram with async generation, caching, and edit controls. */
export function ArchitectureDiagramPanel(props: ArchitectureDiagramPanelProps): React.JSX.Element {
  const panel = useArchitectureDiagramPanel(props);

  if (panel.variant === "preview") {
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
              panel.onOpenFull?.();
            }}
          >
            Open diagram tab
          </Button>
        </div>

        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE}
        </p>

        {panel.phase === "loading" ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} aria-live="polite">
            {ARCHITECTURE_DIAGRAM_LOADING_LABEL}
          </p>
        ) : null}

        {panel.phase === "insufficient" ? <ArchitectureDiagramInsufficientState panel={panel} /> : null}

        {panel.phase === "error" || panel.phase === "invalid" ? (
          <div className="space-y-2" role="alert" data-testid="architecture-diagram-preview-failure">
            <SeverityTag severity="high" label="Diagram unavailable" />
            <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
              {ARCHITECTURE_DIAGRAM_RENDER_FAILURE}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void panel.runGeneration(false)}>
              {ARCHITECTURE_DIAGRAM_RETRY_ACTION}
            </Button>
          </div>
        ) : null}

        {panel.phase === "ready" && panel.displayMermaidSource !== null ? (
          <div className="space-y-1">
            <div className="relative max-h-48 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
              <ArchitectureDiagramViewer
                mermaidSource={panel.displayMermaidSource}
                textAlternative={panel.textAlternative}
                onRetry={() => void panel.runGeneration(false)}
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

        {panel.phase === "idle" ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void panel.runGeneration(false)}>
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
          {panel.phase === "ready" ? <StatusTag kind="neutral" label={ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL} /> : null}
        </div>
        {panel.phase === "ready" ? (
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

      {panel.storageWriteFailed ? (
        <p
          className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}
          role="alert"
          data-testid="architecture-diagram-storage-write-failure"
        >
          {ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE}
        </p>
      ) : null}

      {panel.phase === "loading" ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-live="polite" data-testid="architecture-diagram-loading">
          {ARCHITECTURE_DIAGRAM_LOADING_LABEL}
        </p>
      ) : null}

      {panel.phase === "insufficient" ? <ArchitectureDiagramInsufficientState panel={panel} /> : null}

      {panel.phase === "error" ? (
        <div className="space-y-3" data-testid="architecture-diagram-generation-failure" role="alert">
          <SeverityTag severity="high" label="Diagram generation error" />
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}>
            {ARCHITECTURE_DIAGRAM_RENDER_FAILURE}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void panel.runGeneration(false)} data-testid="architecture-diagram-retry">
            {ARCHITECTURE_DIAGRAM_RETRY_ACTION}
          </Button>
        </div>
      ) : null}

      {panel.phase === "invalid" ? (
        <div className="space-y-3" data-testid="architecture-diagram-invalid" role="alert">
          <SeverityTag severity="medium" label="Invalid diagram source" />
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}>
            The diagram source is invalid. Edit the diagram or regenerate after updating your brief.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void panel.runGeneration(true)}>
            {ARCHITECTURE_DIAGRAM_REGENERATE_ACTION}
          </Button>
        </div>
      ) : null}

      {panel.phase === "ready" ? <ArchitectureDiagramReadyView panel={panel} /> : null}
    </section>
  );
}
