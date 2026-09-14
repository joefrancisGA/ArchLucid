import type { GovernanceFindingInspectHrefOptions } from "@/components/governance/findings/governance-findings-navigation";
import { parseArchitectureNestedToolArchitectureId } from "@/lib/architecture/architecture-routes";
import { deriveWorkingInstrumentReviewHeaderPresentation } from "@/lib/run-detail-workspace-derive/review-presentation";

export const INHABIT_FINDINGS_DOCUMENT_OWNER = "IH-016" as const;

export const INHABIT_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE =
  "Afternoon document for this architecture — disposition rows are the work. The open child review is a subtitle, not the day’s job." as const;

export const INHABIT_WORKING_NESTED_FINDINGS_CLAIM_DISCIPLINE =
  "You inhabit this architecture on the desk. Findings here are verbs on this system; nested review-detail stays a job inspector when you need it." as const;

export const INHABIT_WORKING_NESTED_FINDINGS_EMPTY_TITLE =
  "No decision-grade findings yet" as const;

export const INHABIT_WORKING_NESTED_FINDINGS_EMPTY_BODY =
  "That is not completeness. Quiet engines, in-flight analysis, or Practice runs can leave this list empty while work continues. Check the transparency trail and in-flight status before you treat an empty list as done." as const;

export type InhabitedFindingsDocumentInput = {
  readonly workingMode: boolean;
  readonly pathname: string | null;
  readonly scopedArchitectureId: string | null;
  readonly architectureDisplayName?: string | null;
  readonly scopedRunId?: string | null;
  readonly scopedRunTitle?: string | null;
};

export type InhabitedFindingsDocumentPresentation = {
  readonly isInhabitedDocument: true;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly claimDiscipline: string;
  readonly jobSubtitle: string | null;
  readonly suppressPipelineChrome: boolean;
};

export function resolveInhabitedFindingsArchitectureId(
  pathname: string | null,
  scopedArchitectureId: string | null,
): string | null {
  const fromPath = parseArchitectureNestedToolArchitectureId(pathname ?? "", "findings");

  if (fromPath !== null && fromPath.trim().length > 0) {
    return fromPath.trim();
  }

  const scoped = scopedArchitectureId?.trim() ?? "";

  return scoped.length > 0 ? scoped : null;
}

export function resolveIsInhabitedFindingsDocument(input: InhabitedFindingsDocumentInput): boolean {
  if (!input.workingMode) {
    return false;
  }

  return resolveInhabitedFindingsArchitectureId(input.pathname, input.scopedArchitectureId) !== null;
}

/** WA-001 — shared inspect options for inhabited nested findings queue surfaces. */
export function resolveInhabitedFindingsInspectHrefOptions(
  input: Pick<InhabitedFindingsDocumentInput, "workingMode" | "pathname" | "scopedArchitectureId">,
): GovernanceFindingInspectHrefOptions | undefined {
  if (!input.workingMode) {
    return undefined;
  }

  const architectureId = resolveInhabitedFindingsArchitectureId(
    input.pathname,
    input.scopedArchitectureId,
  );

  if (architectureId === null) {
    return undefined;
  }

  return {
    architectureId,
    isWorkingMode: true,
  };
}

function resolveArchitectureH1Title(architectureDisplayName: string | null | undefined): string {
  const trimmed = architectureDisplayName?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Architecture";
  }

  return deriveWorkingInstrumentReviewHeaderPresentation({
    architectureDisplayName: trimmed,
    reviewTitle: "",
    runId: "",
  }).h1Title;
}

function resolveJobSubtitle(input: InhabitedFindingsDocumentInput): string | null {
  const runTitle = input.scopedRunTitle?.trim() ?? "";
  const runId = input.scopedRunId?.trim() ?? "";

  if (runTitle.length > 0) {
    return `Child review: ${runTitle}`;
  }

  if (runId.length > 0) {
    return `Child review: ${runId}`;
  }

  return null;
}

/** IH-016 / IH-023 — Working nested findings uses architecture H1 and job subtitle. */
export function resolveInhabitedFindingsDocumentPresentation(
  input: InhabitedFindingsDocumentInput,
): InhabitedFindingsDocumentPresentation | null {
  if (!resolveIsInhabitedFindingsDocument(input)) {
    return null;
  }

  const pageTitle = resolveArchitectureH1Title(input.architectureDisplayName);
  const jobSubtitle = resolveJobSubtitle(input);

  return {
    isInhabitedDocument: true,
    pageTitle,
    pageSubtitle: INHABIT_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE,
    claimDiscipline: INHABIT_WORKING_NESTED_FINDINGS_CLAIM_DISCIPLINE,
    jobSubtitle,
    suppressPipelineChrome: true,
  };
}

export type InhabitedFindingsEmptyStateCopy = {
  readonly title: string;
  readonly description: string;
};

/** IH-021 — empty nested findings names quiet engines and in-flight, not done. */
export function resolveInhabitedFindingsEmptyStateCopy(
  input: InhabitedFindingsDocumentInput,
): InhabitedFindingsEmptyStateCopy | null {
  if (!resolveIsInhabitedFindingsDocument(input)) {
    return null;
  }

  return {
    title: INHABIT_WORKING_NESTED_FINDINGS_EMPTY_TITLE,
    description: INHABIT_WORKING_NESTED_FINDINGS_EMPTY_BODY,
  };
}
