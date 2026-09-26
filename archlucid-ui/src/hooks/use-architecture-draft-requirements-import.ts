"use client";

import { useCallback, useRef, useState } from "react";

import { buildArchitectureIntakeInferenceCorpus } from "@/lib/evidence-readable-text";
import {
  appendArchitectureDraftRequirementsImport,
  architectureDraftRequirementsFileKey,
  newlyAddedArchitectureDraftRequirementFiles,
} from "@/lib/architecture/architecture-draft-requirements-import";
import {
  architectureDraftRequirementsImportEmptyMessage,
  architectureDraftRequirementsImportErrorMessage,
} from "@/lib/guided-intake-copy";

type UseArchitectureDraftRequirementsImportOptions = {
  readonly disabled?: boolean;
  readonly currentOverview: string;
  readonly onOverviewChange: (nextOverview: string) => void;
};

export function useArchitectureDraftRequirementsImport(
  options: UseArchitectureDraftRequirementsImportOptions,
): {
  readonly importing: boolean;
  readonly statusMessage: string | null;
  readonly importError: string | null;
  readonly onRequirementsFilesSelected: (files: File[]) => void;
} {
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importedFileKeysRef = useRef<Set<string>>(new Set());
  const overviewRef = useRef(options.currentOverview);
  overviewRef.current = options.currentOverview;

  const { disabled, onOverviewChange } = options;

  const onRequirementsFilesSelected = useCallback(
    (files: File[]) => {
      if (disabled === true) {
        return;
      }

      const added = newlyAddedArchitectureDraftRequirementFiles(importedFileKeysRef.current, files);

      if (added.length === 0) {
        return;
      }

      setImportError(null);
      setStatusMessage(null);
      setImporting(true);

      void (async () => {
        let nextOverview = overviewRef.current;

        try {
          for (const file of added) {
            const key = architectureDraftRequirementsFileKey(file);
            importedFileKeysRef.current.add(key);

            const extracted = await buildArchitectureIntakeInferenceCorpus({
              briefText: "",
              evidenceFiles: [file],
            });

            if (extracted.trim().length === 0) {
              setImportError(architectureDraftRequirementsImportEmptyMessage(file.name));
              continue;
            }

            nextOverview = appendArchitectureDraftRequirementsImport(nextOverview, file.name, extracted);
            overviewRef.current = nextOverview;
            onOverviewChange(nextOverview);
          }
        } catch {
          const failed = added[added.length - 1];

          if (failed !== undefined) {
            setImportError(architectureDraftRequirementsImportErrorMessage(failed.name));
          }
        } finally {
          setImporting(false);
          setStatusMessage(null);
        }
      })();
    },
    [disabled, onOverviewChange],
  );

  return {
    importing,
    statusMessage: importing ? "Reading uploaded requirements…" : statusMessage,
    importError,
    onRequirementsFilesSelected,
  };
}
