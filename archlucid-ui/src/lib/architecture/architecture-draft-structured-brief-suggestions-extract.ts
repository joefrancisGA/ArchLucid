import type { IncomingStructuredBriefSuggestions } from "@/lib/architecture/architecture-draft-structured-brief";

const EMPTY_SUGGESTIONS: IncomingStructuredBriefSuggestions = {
  suggestedConstraints: [],
  suggestedAssumptions: [],
  suggestedCapabilities: [],
};

/**
 * Deterministic structured-brief suggestions (ADR 0049-style) when LLM draft intake returns nothing.
 * Handles architecture review packets with ADRs, reliability targets, and markdown sections.
 */
export function buildDeterministicStructuredBriefSuggestionsFromText(
  text: string,
): IncomingStructuredBriefSuggestions {
  const trimmed = text.trim();

  if (trimmed.length < 20) {
    return EMPTY_SUGGESTIONS;
  }

  const constraints = new Set<string>();
  const assumptions = new Set<string>();
  const capabilities = new Set<string>();

  for (const match of trimmed.matchAll(/ADR-\d+:\s*([^\n]+)/gi)) {
    const value = match[1]?.trim();

    if (value !== undefined && value.length > 0) {
      constraints.add(value);
    }
  }

  for (const match of trimmed.matchAll(/^\s*[-*]\s+(.+)$/gm)) {
    const line = match[1]?.trim() ?? "";

    if (line.length < 8) {
      continue;
    }

    if (/^(decision|rationale):/i.test(line)) {
      continue;
    }

    if (/\b(defer|deferred|pilot|phase one|phase 1|manual rollback|async)\b/i.test(line)) {
      assumptions.add(line);
      continue;
    }

    if (/\b(must|require|isolation|retention|impersonation|tenantid|tenant id|sso|audit|metering)\b/i.test(line)) {
      constraints.add(line);
      continue;
    }

    if (/\b(service|processor|console|store|plane|export|metering|migration)\b/i.test(line)) {
      capabilities.add(line);
    }
  }

  if (/\bshared (db|database)\b/i.test(trimmed) && /\btenantid\b/i.test(trimmed)) {
    constraints.add("Shared database with TenantId row-level tenant isolation");
  }

  if (/\bsupport impersonation\b/i.test(trimmed)) {
    constraints.add("Support impersonation requires strong audit and approval controls");
  }

  if (/\bmanual migration rollback\b/i.test(trimmed)) {
    assumptions.add("Manual migration rollback via backup restore for pilot");
  }

  if (/\basync billing metering\b/i.test(trimmed)) {
    assumptions.add("Billing metering is asynchronous and requires reconciliation");
  }

  if (/\bno tenant-level noisy-neighbor\b/i.test(trimmed)) {
    assumptions.add("No tenant-level noisy-neighbor controls in phase one");
  }

  if (/\bsso\b/i.test(trimmed)) {
    capabilities.add("Customer SSO via SAML/OIDC");
  }

  if (/\baudit export\b/i.test(trimmed)) {
    capabilities.add("Tenant-scoped audit export to durable storage");
  }

  if (/\btenant isolation\b/i.test(trimmed)) {
    constraints.add("Tenant isolation enforced via application-layer tenant context and DB filters");
  }

  return {
    suggestedConstraints: [...constraints],
    suggestedAssumptions: [...assumptions],
    suggestedCapabilities: [...capabilities],
  };
}

/** Pulls a concise failure-mode note from reliability and recovery signals in free text. */
export function extractFailureModeSuggestionFromText(text: string): string | null {
  const trimmed = text.trim();
  const parts: string[] = [];

  if (trimmed.length < 20) {
    return null;
  }

  const rpoMatch = trimmed.match(/\bRPO is\s+([^.;,\n]+)/i);
  const rtoMatch = trimmed.match(/\bRTO is\s+([^.;,\n]+)/i);
  const rpo = rpoMatch?.[1]?.trim();
  const rto = rtoMatch?.[1]?.trim();

  if (rpo !== undefined && rpo.length > 0 && rto !== undefined && rto.length > 0) {
    parts.push(`Extended outage or data loss beyond RPO (${rpo}); recover service within RTO (${rto})`);
  } else if (rpo !== undefined && rpo.length > 0) {
    parts.push(`Data loss beyond RPO (${rpo}) requires restore from backup`);
  } else if (rto !== undefined && rto.length > 0) {
    parts.push(`Service disruption; target recovery within RTO (${rto})`);
  }

  if (/\bmanual migration rollback\b/i.test(trimmed)) {
    parts.push("Migration failure: manual rollback via backup restore for pilot");
  }

  if (/\bqueue backlog\b/i.test(trimmed) || /\bbacklog must not block\b/i.test(trimmed)) {
    parts.push("Queue backlog delays processing; drain backlog and scale workers");
  }

  const failoverMatch = trimmed.match(/\bfailover[^.\n]{0,120}/i);

  if (failoverMatch?.[0] !== undefined) {
    parts.push(failoverMatch[0].trim());
  }

  const availabilityMatch = trimmed.match(/\bavailability target is\s+(\d+(?:\.\d+)?%)/i);

  if (availabilityMatch?.[1] !== undefined && parts.length === 0) {
    parts.push(`Regional outage threatens availability target (${availabilityMatch[1]}); fail over or restore from backup`);
  }

  return parts.length > 0 ? parts.join("; ") : null;
}

/** Pulls numeric SLO-style targets from free text for quality-attribute chips. */
export function extractQualityAttributeSuggestionsFromText(text: string): string[] {
  const trimmed = text.trim();
  const suggestions = new Set<string>();

  if (trimmed.length < 20) {
    return [];
  }

  const availabilityMatch = trimmed.match(/\bavailability target is\s+(\d+(?:\.\d+)?%)/i)
    ?? trimmed.match(/\b(\d+(?:\.\d+)?%)\b[^.\n]{0,40}\bavailability\b/i);

  if (availabilityMatch?.[1] !== undefined) {
    suggestions.add(`Availability ${availabilityMatch[1]}`);
  }

  const rpoMatch = trimmed.match(/\bRPO is\s+([^.;,\n]+)/i);

  if (rpoMatch?.[1] !== undefined) {
    suggestions.add(`RPO ${rpoMatch[1].trim()}`);
  }

  const rtoMatch = trimmed.match(/\bRTO is\s+([^.;,\n]+)/i);

  if (rtoMatch?.[1] !== undefined) {
    suggestions.add(`RTO ${rtoMatch[1].trim()}`);
  }

  const exportMatch = trimmed.match(/\baudit export must generate within\s+([^.;,\n]+)/i);

  if (exportMatch?.[1] !== undefined) {
    suggestions.add(`Audit export latency ${exportMatch[1].trim()}`);
  }

  return [...suggestions];
}
