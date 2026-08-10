"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ARCHITECTURE_DIAGRAM_ACCEPT_INFERRED_ACTION,
  ARCHITECTURE_DIAGRAM_EDIT_ACTION,
  ARCHITECTURE_DIAGRAM_INFERRED_NODE_LABEL,
  ARCHITECTURE_DIAGRAM_REMOVE_INFERRED_ACTION,
  ARCHITECTURE_DIAGRAM_VERSION_HISTORY_LABEL,
} from "@/lib/architecture-diagram-copy";
import type { ArchitectureDiagramModel, ArchitectureDiagramNode, ArchitectureDiagramVersion } from "@/lib/architecture-diagram-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramEditorProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly model: ArchitectureDiagramModel;
  readonly mermaidSource: string;
  readonly versions: readonly ArchitectureDiagramVersion[];
  readonly canEdit: boolean;
  readonly onSaveMermaid: (mermaidSource: string) => void;
  readonly onNodeOverride: (nodes: readonly ArchitectureDiagramNode[]) => void;
  readonly onActivateVersion: (versionId: string) => void;
};

/** Edit architecture diagram source and manage inferred node acceptance/removal. */
export function ArchitectureDiagramEditor(props: ArchitectureDiagramEditorProps): React.JSX.Element {
  const [draftSource, setDraftSource] = useState(props.mermaidSource);
  const inferredNodes = useMemo(
    () => props.model.nodes.filter((node) => node.provenance === "inferred" && !node.accepted && !node.removed),
    [props.model.nodes],
  );

  useEffect(() => {
    setDraftSource(props.mermaidSource);
  }, [props.mermaidSource, props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" data-testid="architecture-diagram-editor">
        <DialogHeader>
          <DialogTitle>{ARCHITECTURE_DIAGRAM_EDIT_ACTION}</DialogTitle>
        </DialogHeader>

        {!props.canEdit ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
            Diagram edits are locked after the review is committed.
          </p>
        ) : (
          <div className="space-y-4">
            {inferredNodes.length > 0 ? (
              <div className="space-y-2" data-testid="architecture-diagram-inferred-list">
                <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  {ARCHITECTURE_DIAGRAM_INFERRED_NODE_LABEL} components
                </p>
                <ul className="m-0 list-none space-y-2 p-0">
                  {inferredNodes.map((node) => (
                    <li
                      key={node.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-neutral-300 p-2 dark:border-neutral-700"
                    >
                      <span className={OPERATOR_TYPOGRAPHY.body}>{node.label}</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          data-testid={`architecture-diagram-accept-${node.id}`}
                          onClick={() => {
                            const next = props.model.nodes.map((entry) =>
                              entry.id === node.id ? { ...entry, accepted: true } : entry,
                            );
                            props.onNodeOverride(next);
                          }}
                        >
                          {ARCHITECTURE_DIAGRAM_ACCEPT_INFERRED_ACTION}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          data-testid={`architecture-diagram-remove-${node.id}`}
                          onClick={() => {
                            const next = props.model.nodes.map((entry) =>
                              entry.id === node.id ? { ...entry, removed: true } : entry,
                            );
                            props.onNodeOverride(next);
                          }}
                        >
                          {ARCHITECTURE_DIAGRAM_REMOVE_INFERRED_ACTION}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)} htmlFor="architecture-diagram-mermaid-editor">
                Mermaid source
              </label>
              <textarea
                id="architecture-diagram-mermaid-editor"
                className="min-h-[12rem] w-full rounded-md border border-neutral-300 bg-white p-3 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
                value={draftSource}
                onChange={(event) => setDraftSource(event.target.value)}
                data-testid="architecture-diagram-mermaid-editor"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  props.onSaveMermaid(draftSource);
                  props.onOpenChange(false);
                }}
              >
                Save diagram
              </Button>
            </div>

            {props.versions.length > 1 ? (
              <details>
                <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                  {ARCHITECTURE_DIAGRAM_VERSION_HISTORY_LABEL}
                </summary>
                <ul className="mt-2 space-y-1">
                  {props.versions
                    .slice()
                    .reverse()
                    .map((version) => (
                      <li key={version.versionId}>
                        <button
                          type="button"
                          className="text-left text-teal-800 underline underline-offset-2 dark:text-teal-300"
                          onClick={() => props.onActivateVersion(version.versionId)}
                        >
                          {version.label} — {new Date(version.savedAtUtc).toLocaleString()}
                        </button>
                      </li>
                    ))}
                </ul>
              </details>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
