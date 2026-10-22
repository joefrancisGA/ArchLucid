import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type CaiqSigPostureStatus = "Affirmative" | "Strong" | "Partial" | "Planned" | "Inherited";

export type CaiqSigResponsePostureCounts = Readonly<Record<CaiqSigPostureStatus, number>>;

const EMPTY_POSTURE_COUNTS: CaiqSigResponsePostureCounts = {
  Affirmative: 0,
  Strong: 0,
  Partial: 0,
  Planned: 0,
  Inherited: 0,
};

export function normalizePostureToken(raw: string): CaiqSigPostureStatus | null {
  const token = raw.trim().replace(/\s*\(engineering\)\s*$/i, "");

  if (/^strong/i.test(token)) {
    return "Strong";
  }

  if (/^partial/i.test(token)) {
    return "Partial";
  }

  if (/^planned/i.test(token)) {
    return "Planned";
  }

  if (/^inherited/i.test(token)) {
    return "Inherited";
  }

  return null;
}

function incrementPostureCount(
  counts: CaiqSigResponsePostureCounts,
  status: CaiqSigPostureStatus,
): CaiqSigResponsePostureCounts {
  return {
    ...counts,
    [status]: counts[status] + 1,
  };
}

function countPostureInTableRow(
  row: string,
  statusColumnIndex: number | null,
  responseColumnIndex: number | null,
): CaiqSigPostureStatus | null {
  const cells = row
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  // Prefer Status (SIG Core). Never promote CAIQ Lite "Yes" to Strong — that label is not
  // rendered as a Strong StatusTag, so counting it here would break the posture rollup.
  if (statusColumnIndex !== null && statusColumnIndex >= 0 && cells[statusColumnIndex] !== undefined) {
    return normalizePostureToken(cells[statusColumnIndex] ?? "");
  }

  if (responseColumnIndex !== null && responseColumnIndex >= 0 && cells[responseColumnIndex] !== undefined) {
    const response = cells[responseColumnIndex] ?? "";

    if (/^yes\b/i.test(response)) {
      return "Affirmative";
    }

    // CAIQ Lite Response cells may say Partial; No stays out of Strong/Planned/Inherited.
    if (/^partial\b/i.test(response)) {
      return "Partial";
    }
  }

  return null;
}

export function computeCaiqSigResponsePostureCounts(preparedMarkdown: string): CaiqSigResponsePostureCounts {
  let counts: CaiqSigResponsePostureCounts = { ...EMPTY_POSTURE_COUNTS };
  const lines = preparedMarkdown.split("\n");
  let statusColumnIndex: number | null = null;
  let responseColumnIndex: number | null = null;
  let inTable = false;

  for (const line of lines) {
    if (!line.trimStart().startsWith("|")) {
      inTable = false;
      statusColumnIndex = null;
      responseColumnIndex = null;
      continue;
    }

    if (/^[\s|:-]+$/.test(line.trim())) {
      continue;
    }

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (!inTable) {
      statusColumnIndex = cells.findIndex((cell) => /^status$/i.test(cell));
      responseColumnIndex = cells.findIndex((cell) => /^response$/i.test(cell));
      inTable = true;
      continue;
    }

    const posture = countPostureInTableRow(line, statusColumnIndex, responseColumnIndex);

    if (posture !== null) {
      counts = incrementPostureCount(counts, posture);
    }
  }

  return counts;
}

export function countCaiqSigResponseTableRows(preparedMarkdown: string): number {
  let rowCount = 0;
  const lines = preparedMarkdown.split("\n");
  let statusColumnIndex: number | null = null;
  let responseColumnIndex: number | null = null;
  let inTable = false;

  for (const line of lines) {
    if (!line.trimStart().startsWith("|")) {
      inTable = false;
      statusColumnIndex = null;
      responseColumnIndex = null;
      continue;
    }

    if (/^[\s|:-]+$/.test(line.trim())) {
      continue;
    }

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (!inTable) {
      statusColumnIndex = cells.findIndex((cell) => /^status$/i.test(cell));
      responseColumnIndex = cells.findIndex((cell) => /^response$/i.test(cell));
      inTable = true;
      continue;
    }

    if (statusColumnIndex !== null || responseColumnIndex !== null) {
      rowCount += 1;
    }
  }

  return rowCount;
}

export function sumCaiqSigResponsePostureCounts(counts: CaiqSigResponsePostureCounts): number {
  return counts.Affirmative + counts.Strong + counts.Partial + counts.Planned + counts.Inherited;
}

export function resolveCaiqSigStatusQualifier(statusLabel: string): string | null {
  const trimmed = statusLabel.trim();

  if (/^planned\b/i.test(trimmed) && /not yet scheduled/i.test(trimmed)) {
    return "not yet scheduled";
  }

  if (/\(engineering\)/i.test(trimmed)) {
    return "Engineering-asserted";
  }

  return null;
}

export function resolveCaiqSigStatusNarrative(statusLabel: string): string | null {
  const trimmed = statusLabel.trim();

  const yesMatch = /^yes\s*[—–-]\s*(.+)/i.exec(trimmed);

  if (yesMatch?.[1] !== undefined && yesMatch[1].trim().length > 0) {
    return yesMatch[1].trim();
  }

  const noMatch = /^no\s*[—–-]\s*(.+)/i.exec(trimmed);

  if (noMatch?.[1] !== undefined && noMatch[1].trim().length > 0) {
    return noMatch[1].trim();
  }

  if (/^partial\s*[—–-]/i.test(trimmed)) {
    const narrative = trimmed.replace(/^partial\s*[—–-]\s*/i, "").trim();

    if (narrative.length > 0) {
      return narrative;
    }
  }

  return null;
}

export function mapCaiqSigStatusLabelToTagKind(statusLabel: string): EnterpriseStatusKind {
  const normalized = normalizePostureToken(statusLabel);

  switch (normalized) {
    case "Strong":
      return "ready";
    case "Partial":
      return "needs-attention";
    case "Planned":
      return "in-progress";
    case "Inherited":
      return "approved-with-monitoring";
    default: {
      if (/^yes\b/i.test(statusLabel.trim())) {
        return "ready";
      }

      if (/^no\b/i.test(statusLabel.trim())) {
        return "blocked";
      }

      return "neutral";
    }
  }
}

export function resolveCaiqSigStatusTagLabel(statusLabel: string): string {
  const normalized = normalizePostureToken(statusLabel);

  if (normalized !== null) {
    return normalized;
  }

  const trimmed = statusLabel.trim();

  if (/^yes\b/i.test(trimmed)) {
    return "Yes";
  }

  if (/^no\b/i.test(trimmed)) {
    return "No";
  }

  return trimmed;
}
