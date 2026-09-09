/**
 * AS-005 — read pixel-only diagram honesty rows from context snapshot warnings.
 */

import {
  PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX,
} from "@/lib/architecture-spine/pixel-diagram-not-verifiable-warnings";

export type PixelDiagramNotVerifiableSource = {
  readonly fileName: string;
  readonly sourceMimeType: string;
  readonly evidenceItemId: string | null;
  readonly pendingStoredFileMarker: string | null;
};

/** TB-645 operator copy — not "we analyzed your screenshot." */
export const PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE =
  "Diagram file stored; topology not extracted.";

export function formatPixelDiagramNotVerifiableLabel(source: PixelDiagramNotVerifiableSource): string {
  const disposition = "not verifiable";

  return `${source.fileName} — ${PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE} (${disposition})`;
}

function parseWarningToken(warning: string, key: string): string | null {
  const pattern = new RegExp(`(?:^|;)${key}=([^;]+)`);
  const match = warning.match(pattern);

  if (match === null) {
    return null;
  }

  const value = match[1]?.trim() ?? "";

  return value.length > 0 && value !== "none" ? value : null;
}

export function parsePixelDiagramNotVerifiableWarning(warning: string): PixelDiagramNotVerifiableSource | null {
  if (!warning.startsWith(PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX)) {
    return null;
  }

  const payload = warning.slice(PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX.length);
  const fileName = parseWarningToken(payload, "file");

  if (fileName === null) {
    return null;
  }

  return {
    fileName,
    sourceMimeType: parseWarningToken(payload, "mime") ?? "image/unknown",
    evidenceItemId: parseWarningToken(payload, "evidenceItemId"),
    pendingStoredFileMarker: parseWarningToken(payload, "pending"),
  };
}

export function readPixelDiagramNotVerifiableSourcesFromContextSnapshot(
  contextSnapshot: unknown,
): readonly PixelDiagramNotVerifiableSource[] {
  if (contextSnapshot === null || contextSnapshot === undefined || typeof contextSnapshot !== "object") {
    return [];
  }

  const warnings = (contextSnapshot as { warnings?: unknown }).warnings;

  if (!Array.isArray(warnings)) {
    return [];
  }

  const sources: PixelDiagramNotVerifiableSource[] = [];

  for (const warning of warnings) {
    if (typeof warning !== "string") {
      continue;
    }

    const parsed = parsePixelDiagramNotVerifiableWarning(warning);

    if (parsed !== null) {
      sources.push(parsed);
    }
  }

  return sources;
}

export function formatPixelDiagramNotVerifiableLabels(
  sources: readonly PixelDiagramNotVerifiableSource[],
): readonly string[] {
  return sources.map((source) => formatPixelDiagramNotVerifiableLabel(source));
}
