"use client";

import { ArchitectureDiagramEditor } from "@/components/architecture/ArchitectureDiagramEditor";
import { ArchitectureDiagramInferredPanel } from "@/components/architecture/ArchitectureDiagramInferredPanel";
import { ArchitectureDiagramLegend } from "@/components/architecture/ArchitectureDiagramLegend";
import { ArchitectureDiagramProvenancePanel } from "@/components/architecture/ArchitectureDiagramProvenancePanel";
import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION,
  ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION,
  ARCHITECTURE_DIAGRAM_EDIT_ACTION,
  ARCHITECTURE_DIAGRAM_INFERRED_LOCKED_FOR_HAND_EDIT,
  ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE,
  ARCHITECTURE_DIAGRAM_REGENERATE_ACTION,
  ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION,
} from "@/lib/architecture/architecture-diagram-copy";
import {
  architectureDiagramMermaidSourceDisclosureHrefFromSearch,
  parseArchitectureDiagramMermaidSourceOpenFromSearch,
} from "@/lib/architecture/architecture-diagram-mermaid-source-disclosure-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ArchitectureDiagramPanelState } from "./use-architecture-diagram-panel";

type ArchitectureDiagramReadyViewProps = {
  readonly panel: ArchitectureDiagramPanelState;
};

export function ArchitectureDiagramReadyView(props: ArchitectureDiagramReadyViewProps): React.JSX.Element | null {
  const { panel } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const architectureDiagramMermaidSourceOpenParam = searchParams.get("architectureDiagramMermaidSourceOpen");
  const [mermaidSourceOpen, setMermaidSourceOpenState] = useState(() =>
    parseArchitectureDiagramMermaidSourceOpenFromSearch(architectureDiagramMermaidSourceOpenParam),
  );

  const syncMermaidSourceOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        architectureDiagramMermaidSourceDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setMermaidSourceOpen = useCallback(
    (open: boolean) => {
      setMermaidSourceOpenState(open);
      syncMermaidSourceOpenToUrl(open);
    },
    [syncMermaidSourceOpenToUrl],
  );

  useEffect(() => {
    setMermaidSourceOpenState(
      parseArchitectureDiagramMermaidSourceOpenFromSearch(architectureDiagramMermaidSourceOpenParam),
    );
  }, [architectureDiagramMermaidSourceOpenParam]);

  if (panel.displayMermaidSource === null) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <ArchitectureDiagramViewer
          mermaidSource={panel.displayMermaidSource}
          textAlternative={panel.textAlternative}
          onRetry={() => void panel.runGeneration(false)}
        />
        {panel.diagramModel !== null ? (
          <div className="space-y-3">
            <ArchitectureDiagramProvenancePanel
              runId={panel.runId}
              model={panel.diagramModel}
              diagramVersionSource={panel.diagramVersionSource}
              selectedKind={panel.selectedElementKind}
              selectedId={panel.selectedElementId}
              onSelect={panel.selectDiagramElementWithUrl}
            />
            {panel.inferredReviewLocked ? (
              <p
                className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                role="status"
                data-testid="architecture-diagram-inferred-locked"
              >
                {ARCHITECTURE_DIAGRAM_INFERRED_LOCKED_FOR_HAND_EDIT}
              </p>
            ) : null}
            <ArchitectureDiagramInferredPanel
              model={panel.diagramModel}
              canEdit={panel.canEdit && !panel.inferredReviewLocked}
              onNodeOverride={panel.handleNodeOverride}
            />
          </div>
        ) : null}
      </div>
      <ArchitectureDiagramLegend model={panel.diagramModel} />
      <div className="flex flex-wrap gap-2">
        {panel.canEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={() => panel.setEditorOpen(true)}>
            {ARCHITECTURE_DIAGRAM_EDIT_ACTION}
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => void panel.runGeneration(true)} data-testid="architecture-diagram-regenerate">
          {ARCHITECTURE_DIAGRAM_REGENERATE_ACTION}
        </Button>
        <details
          data-testid="architecture-diagram-mermaid-source"
          open={mermaidSourceOpen}
          onToggle={(event) => {
            setMermaidSourceOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer px-1 py-2 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            {ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION}
          </summary>
          <div className="mt-2 space-y-2">
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE}
            </p>
            <pre className="max-h-48 overflow-auto rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-900">{panel.mermaidSource}</pre>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void panel.copyMermaid()}>
                {panel.copied ? "Copied" : ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={panel.downloadMermaid}>
                {ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION}
              </Button>
            </div>
            {panel.copyError !== null ? (
              <p
                role="alert"
                className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="architecture-diagram-copy-error"
              >
                {panel.copyError}
              </p>
            ) : null}
          </div>
        </details>
      </div>

      {panel.diagramModel !== null && panel.mermaidSource !== null ? (
        <ArchitectureDiagramEditor
          open={panel.editorOpen}
          onOpenChange={panel.setEditorOpen}
          mermaidSource={panel.mermaidSource}
          versions={panel.versions}
          activeVersionId={panel.activeVersionId}
          canEdit={panel.canEdit}
          storageWriteFailed={panel.storageWriteFailed}
          pagePrimaryOwnedElsewhere={panel.pagePrimaryOwnedElsewhere}
          onSaveMermaid={panel.onSaveMermaid}
          onActivateVersion={panel.onActivateVersion}
        />
      ) : null}
    </>
  );
}
