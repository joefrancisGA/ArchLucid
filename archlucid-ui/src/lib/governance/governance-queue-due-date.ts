import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type GovernanceQueueDueDate =
  | { readonly kind: "missing" }
  | { readonly kind: "invalid"; readonly raw: string }
  | { readonly kind: "valid"; readonly utc: string };

function firstNonEmptyValue(...values: Array<string | null | undefined>): string | null {
  const value = values.find((candidate: string | null | undefined) => (candidate?.trim().length ?? 0) > 0);

  return value?.trim() ?? null;
}

export function resolveGovernanceQueueDueDate(row: GovernanceFindingQueueRow): GovernanceQueueDueDate {
  const raw = firstNonEmptyValue(row.revisitDueUtc, row.waiverExpiresAtUtc);

  if (raw === null) {
    return { kind: "missing" };
  }

  const parsed = Date.parse(raw);

  if (Number.isNaN(parsed)) {
    return { kind: "invalid", raw };
  }

  return { kind: "valid", utc: new Date(parsed).toISOString() };
}
