import { formatShortCommitSha } from "@/lib/deployment-fingerprint";
import type { ReportProblemContext } from "@/lib/report-problem-context";
import {
  REPORT_PROBLEM_MISSING_VALUE,
} from "@/lib/report-problem-copy";

export function resolveReportProblemReferenceId(context: ReportProblemContext): string | null {
  const correlationId = context.correlationId?.trim() ?? "";

  if (correlationId.length > 0) {
    return correlationId;
  }

  const clientRequestId = context.clientRequestId?.trim() ?? "";

  if (clientRequestId.length > 0) {
    return clientRequestId;
  }

  return null;
}

export function formatReportProblemProductVersionDisplay(context: ReportProblemContext): string {
  const structuredParts: string[] = [];
  const deployStamp = context.deployStamp?.trim() ?? "";

  if (deployStamp.length > 0) {
    structuredParts.push(`Build ${deployStamp}`);
  }

  const apiCommitSha = context.apiCommitSha?.trim() ?? "";

  if (apiCommitSha.length > 0) {
    structuredParts.push(`API ${formatShortCommitSha(apiCommitSha)}`);
  }

  const uiCommitSha = context.uiCommitSha?.trim() ?? "";

  if (uiCommitSha.length > 0) {
    structuredParts.push(`UI ${formatShortCommitSha(uiCommitSha)}`);
  }

  if (structuredParts.length > 0) {
    return structuredParts.join(" · ");
  }

  const legacyParts: string[] = [];
  const productVersion = context.productVersion?.trim() ?? "";

  if (productVersion.length > 0) {
    legacyParts.push(productVersion);
  }

  const uiVersion = context.uiVersion?.trim() ?? "";

  if (uiVersion.length > 0) {
    legacyParts.push(`UI ${uiVersion}`);
  }

  return legacyParts.length > 0 ? legacyParts.join(" · ") : REPORT_PROBLEM_MISSING_VALUE;
}

export function formatOptionalField(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : REPORT_PROBLEM_MISSING_VALUE;
}

export function formatReportProblemErrorDisplay(context: ReportProblemContext): string {
  const title = context.errorTitle?.trim() ?? "";
  const code = context.errorCode?.trim() ?? "";

  if (title.length > 0 && code.length > 0) {
    return `${title} (${code})`;
  }

  if (title.length > 0) {
    return title;
  }

  if (code.length > 0) {
    return code;
  }

  return REPORT_PROBLEM_MISSING_VALUE;
}

export function hasApiUiCommitMismatch(context: ReportProblemContext): boolean {
  const apiCommitSha = context.apiCommitSha?.trim() ?? "";
  const uiCommitSha = context.uiCommitSha?.trim() ?? "";

  if (apiCommitSha.length === 0 || uiCommitSha.length === 0) {
    return false;
  }

  return apiCommitSha.toLowerCase() !== uiCommitSha.toLowerCase();
}
