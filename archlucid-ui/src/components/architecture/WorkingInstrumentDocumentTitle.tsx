"use client";

import { useEffect } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  formatWorkingArchitectureDocumentTitle,
  WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX,
} from "@/lib/architecture/working-architecture-document-title";

type WorkingInstrumentDocumentTitleProps = {
  readonly architectureDisplayName: string;
  readonly parentArchitectureId?: string | null;
  readonly documentTitleSuffix?: string;
};

/** SG-036 / SY-61 — Working review chrome uses the architecture name in the browser tab. */
export function WorkingInstrumentDocumentTitle(
  props: WorkingInstrumentDocumentTitleProps,
): null {
  const { isWorkingMode } = useWorkspaceMode();
  const parentArchitectureId = props.parentArchitectureId?.trim() ?? "";
  const architectureDisplayName = props.architectureDisplayName.trim();

  useEffect(() => {
    if (!isWorkingMode || parentArchitectureId.length === 0 || architectureDisplayName.length === 0) {
      return;
    }

    const suffix = props.documentTitleSuffix ?? WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX;
    const nextTitle = formatWorkingArchitectureDocumentTitle(architectureDisplayName, suffix);
    const previousTitle = document.title;

    document.title = nextTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [architectureDisplayName, isWorkingMode, parentArchitectureId, props.documentTitleSuffix]);

  return null;
}
