"use client";

import { CircleHelp } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Short inline help for governance policy-pack JSON pasted into lifecycle editors.
 * Kept dense: operators mainly need versioning, clauses, scopes, severities — not exhaustive schema duplication.
 *
 * (~85 words.)
 */
export const POLICY_PACK_JSON_SCHEMA_HINT =
  'Policy-pack JSON declares rules your workspace consults during pre-commit/posture checks. Typical top-level shapes: identifiers (slug/id), semantic version (`version`), `metadata` for operator notes, `rules[]` arrays with predicates (patterns, selectors, exclusions), enforced severities (`block` vs `warn`), optional `exceptions` keyed by workload or path, `controls` tying packs to attestations/compliance catalogs, `imports` referencing other packaged rule sets when your API supports merges, plus `constraints`/`mustNot` bullets for deterministic gate text. Prefer valid JSON (`"double quotes"`), one concern per clause, bump `version` on publish.';


/** Hoverable governance JSON schema hint beside policy editor labels. */
export function PolicyPackJsonSchemaHelpIcon(props: Readonly<{ readonly ariaLabel: string }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 rounded p-0.5 text-neutral-500 hover:text-neutral-700 focus-visible:outline focus-visible:ring-2 dark:text-neutral-400 dark:hover:text-neutral-200"
          aria-label={props.ariaLabel}
        >
          <CircleHelp className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-md text-left text-xs leading-relaxed">{POLICY_PACK_JSON_SCHEMA_HINT}</TooltipContent>
    </Tooltip>
  );
}
