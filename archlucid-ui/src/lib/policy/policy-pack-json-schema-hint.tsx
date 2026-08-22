"use client";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";

export const POLICY_PACK_JSON_SCHEMA_HINT =
  'Policy-pack JSON declares rules your workspace consults during finalize and posture checks. Typical top-level shapes: identifiers (slug/id), semantic version (`version`), `metadata` for operator notes, `rules[]` arrays with predicates (patterns, selectors, exclusions), enforced severities (`block` vs `warn`), optional `exceptions` keyed by workload or path, `controls` tying packs to attestations/compliance catalogs, `imports` referencing other packaged rule sets when your API supports merges, plus `constraints`/`mustNot` bullets for deterministic approval-check text. Prefer valid JSON (`"double quotes"`), one concern per clause, bump `version` on publish.';

/** Hoverable governance JSON schema hint beside policy editor labels. */
export function PolicyPackJsonSchemaHelpIcon(props: Readonly<{ readonly ariaLabel: string }>) {
  return (
    <FieldHelpTooltip
      label="policy-pack JSON schema"
      ariaLabel={props.ariaLabel}
      hint={POLICY_PACK_JSON_SCHEMA_HINT}
      triggerClassName="self-start"
    />
  );
}
