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
  ARCHITECTURE_DIAGRAM_ACTIVE_VERSION_LABEL,
  ARCHITECTURE_DIAGRAM_CANCEL_EDIT_ACTION,
  ARCHITECTURE_DIAGRAM_EDIT_MERMAID_ACTION,
  ARCHITECTURE_DIAGRAM_INVALID_MERMAID_ERROR,
  ARCHITECTURE_DIAGRAM_SAVE_ACTION,
  ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE,
  ARCHITECTURE_DIAGRAM_VERSION_HISTORY_DISCLAIMER,
  ARCHITECTURE_DIAGRAM_VERSION_HISTORY_LABEL,
} from "@/lib/architecture/architecture-diagram-copy";
import { isValidMermaidArchitectureDiagram } from "@/lib/architecture/architecture-diagram-mermaid";
import type { ArchitectureDiagramVersion } from "@/lib/architecture/architecture-diagram-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramEditorProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mermaidSource: string;
  readonly versions: readonly ArchitectureDiagramVersion[];
  readonly activeVersionId: string | null;
  readonly canEdit: boolean;
  readonly storageWriteFailed: boolean;
  readonly onSaveMermaid: (mermaidSource: string) => void;
  readonly onActivateVersion: (versionId: string) => void;
  /** When Do this next owns the page primary, keep save as outline. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/** Hand-edit Mermaid source and browse device-local diagram version history. */
export function ArchitectureDiagramEditor(props: ArchitectureDiagramEditorProps): React.JSX.Element {
  const [draftSource, setDraftSource] = useState(props.mermaidSource);
  const draftValid = useMemo(() => isValidMermaidArchitectureDiagram(draftSource), [draftSource]);
  const saveMermaidVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";

  useEffect(() => {
    setDraftSource(props.mermaidSource);
  }, [props.mermaidSource, props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" data-testid="architecture-diagram-editor">
        <DialogHeader>
          <DialogTitle>{ARCHITECTURE_DIAGRAM_EDIT_MERMAID_ACTION}</DialogTitle>
        </DialogHeader>

        {!props.canEdit ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
            Diagram edits are locked after the review is committed.
          </p>
        ) : (
          <div className="space-y-4">
            {props.storageWriteFailed ? (
              <p
                className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}
                role="alert"
                data-testid="architecture-diagram-storage-write-failure"
              >
                {ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE}
              </p>
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
                aria-invalid={!draftValid}
                aria-describedby={!draftValid ? "architecture-diagram-mermaid-error" : undefined}
              />
              {!draftValid ? (
                <p
                  id="architecture-diagram-mermaid-error"
                  className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
                  role="alert"
                >
                  {ARCHITECTURE_DIAGRAM_INVALID_MERMAID_ERROR}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={saveMermaidVariant}
                disabled={!draftValid}
                data-testid="architecture-diagram-save-mermaid"
                onClick={() => {
                  props.onSaveMermaid(draftSource);
                  props.onOpenChange(false);
                }}
              >
                {ARCHITECTURE_DIAGRAM_SAVE_ACTION}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftSource(props.mermaidSource);
                  props.onOpenChange(false);
                }}
              >
                {ARCHITECTURE_DIAGRAM_CANCEL_EDIT_ACTION}
              </Button>
            </div>

            {props.versions.length > 0 ? (
              <details data-testid="architecture-diagram-version-history">
                <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                  {ARCHITECTURE_DIAGRAM_VERSION_HISTORY_LABEL}
                </summary>
                <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {ARCHITECTURE_DIAGRAM_VERSION_HISTORY_DISCLAIMER}
                </p>
                <ul className="mt-2 space-y-1">
                  {props.versions
                    .slice()
                    .reverse()
                    .map((version) => {
                      const isActive = version.versionId === props.activeVersionId;

                      return (
                        <li key={version.versionId}>
                          <button
                            type="button"
                            className={cn(
                              "text-left underline underline-offset-2",
                              isActive
                                ? "font-semibold text-neutral-900 dark:text-neutral-100"
                                : "text-teal-800 dark:text-teal-300",
                            )}
                            onClick={() => props.onActivateVersion(version.versionId)}
                          >
                            {version.label} — {new Date(version.savedAtUtc).toLocaleString()}
                            {isActive ? ` (${ARCHITECTURE_DIAGRAM_ACTIVE_VERSION_LABEL})` : ""}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </details>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
