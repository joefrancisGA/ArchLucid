import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import {
  DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE,
  type ImpactPreviewComparisonScope,
} from "@/lib/impact-preview-page-types";

export const IMPACT_PREVIEW_COMPARISON_SCOPE_PARAM = "scope";

const SCOPE_KEYS = ["findings", "risk", "cost", "governance", "evidence"] as const;

type ScopeKey = (typeof SCOPE_KEYS)[number];

function isScopeKey(value: string): value is ScopeKey {
  return (SCOPE_KEYS as readonly string[]).includes(value);
}

function scopeKeysEqual(left: ImpactPreviewComparisonScope, right: ImpactPreviewComparisonScope): boolean {
  return (
    left.findings === right.findings
    && left.risk === right.risk
    && left.cost === right.cost
    && left.governance === right.governance
    && left.evidence === right.evidence
  );
}

function enabledScopeKeys(scope: ImpactPreviewComparisonScope): ScopeKey[] {
  return SCOPE_KEYS.filter((key) => scope[key]);
}

export function parseImpactPreviewComparisonScopeFromSearch(
  raw: string | null | undefined,
): ImpactPreviewComparisonScope {
  if (raw === null || raw === undefined) {
    return DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE;
  }

  const tokens = trimmed
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE;
  }

  const enabled = new Set(tokens.filter(isScopeKey));

  return {
    findings: enabled.has("findings"),
    risk: enabled.has("risk"),
    cost: enabled.has("cost"),
    governance: enabled.has("governance"),
    evidence: enabled.has("evidence"),
  };
}

export function impactPreviewComparisonScopeHrefFromSearch(
  currentSearch: string,
  scope: ImpactPreviewComparisonScope,
  pathname: string = IMPACT_PREVIEW_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (scopeKeysEqual(scope, DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE)) {
    params.delete(IMPACT_PREVIEW_COMPARISON_SCOPE_PARAM);
  } else {
    params.set(IMPACT_PREVIEW_COMPARISON_SCOPE_PARAM, enabledScopeKeys(scope).join(","));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function impactPreviewComparisonScopeToggleHrefFromSearch(
  currentSearch: string,
  key: ScopeKey,
  scope: ImpactPreviewComparisonScope,
  pathname: string = IMPACT_PREVIEW_PATH,
): string {
  const nextScope: ImpactPreviewComparisonScope = {
    ...scope,
    [key]: !scope[key],
  };

  return impactPreviewComparisonScopeHrefFromSearch(currentSearch, nextScope, pathname);
}
