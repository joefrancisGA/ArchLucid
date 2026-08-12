"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { draftPolicyPackRule } from "@/lib/api/policy-pack-draft-api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { CURATED_RULE_ROW_SCHEMA_REFERENCE } from "@/lib/policy-pack-curated-rules-constants";
import {
  tryParseCuratedRuleRowJson,
  type CuratedRuleRow,
  type CuratedRulesDocument,
} from "@/lib/policy-pack-curated-rules-v1";
import { showSuccess } from "@/lib/toast";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type PolicyRulePlainEnglishDraftPanelProps = {
  readonly canMutatePacks: boolean;
  readonly curatedDoc: CuratedRulesDocument;
  readonly onCuratedDocChange: (next: CuratedRulesDocument) => void;
};

function prettifyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function PolicyRulePlainEnglishDraftPanel(props: PolicyRulePlainEnglishDraftPanelProps) {
  const { canMutatePacks, curatedDoc, onCuratedDocChange } = props;

  const [intent, setIntent] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [draftRuleJson, setDraftRuleJson] = useState<string | null>(null);
  const [parsedRule, setParsedRule] = useState<CuratedRuleRow | null>(null);

  const previewJson = useMemo(
    () => (draftRuleJson !== null ? prettifyJson(draftRuleJson) : null),
    [draftRuleJson],
  );

  return (
    <div
      className="rounded-md border border-dashed border-teal-300 bg-teal-50/40 p-4 dark:border-teal-800 dark:bg-teal-950/20"
      data-testid="policy-rule-plain-english-draft"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Draft a rule from plain English
      </p>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Describe one governance rule in natural language. ArchLucid drafts curated rule JSON using bundled pack
        examples. Review the draft before adding it to this pack — nothing is published automatically.
      </p>
      <Textarea
        className={cn("mt-3 font-sans", OPERATOR_TYPOGRAPHY.body)}
        rows={4}
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        disabled={!canMutatePacks || busy}
        placeholder="Example: Require TLS 1.2 or higher on all public-facing load balancers and document the cipher policy in the architecture narrative."
        data-testid="policy-rule-plain-english-intent"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canMutatePacks || busy || intent.trim().length < 20}
          data-testid="policy-rule-plain-english-draft-button"
          title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
          onClick={() => {
            void (async () => {
              setBusy(true);
              setFailure(null);
              setDisclaimer(null);
              setDraftRuleJson(null);
              setParsedRule(null);

              try {
                const response = await draftPolicyPackRule({ freeTextIntent: intent.trim() });
                const rule = tryParseCuratedRuleRowJson(response.draftRuleJson);

                if (rule === null) {
                  setFailure(
                    uiFailureFromMessage(
                      "Draft JSON did not match the curated rule schema. Refine your intent or edit manually.",
                    ),
                  );

                  return;
                }

                setDisclaimer(response.disclaimer);
                setDraftRuleJson(response.draftRuleJson);
                setParsedRule(rule);
              } catch (error: unknown) {
                setFailure(toApiLoadFailure(error));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? "Drafting…" : "Draft a rule from plain English"}
        </Button>
        {parsedRule !== null ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canMutatePacks}
            data-testid="policy-rule-plain-english-add-button"
            title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
            onClick={() => {
              if (parsedRule === null) {
                return;
              }

              const duplicate = curatedDoc.rules.some(
                (row) => row.id.trim().toLowerCase() === parsedRule.id.trim().toLowerCase(),
              );

              if (duplicate) {
                setFailure(
                  uiFailureFromMessage(
                    `Rule id "${parsedRule.id}" already exists in this pack. Edit the draft id before adding.`,
                  ),
                );

                return;
              }

              onCuratedDocChange({ ...curatedDoc, rules: [...curatedDoc.rules, parsedRule] });
              showSuccess(`Added draft rule "${parsedRule.id}" for review. Merge into policy JSON when ready.`);
              setIntent("");
              setDisclaimer(null);
              setDraftRuleJson(null);
              setParsedRule(null);
            }}
          >
            Add draft to pack for review
          </Button>
        ) : null}
      </div>
      {failure !== null ? (
        <div className="mt-3" role="alert">
          <OperatorApiProblem failure={failure} />
        </div>
      ) : null}
      {disclaimer !== null && previewJson !== null ? (
        <div className="mt-4 space-y-3">
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)} role="status">
            {disclaimer}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
                Expected schema
              </p>
              <pre className={cn("mt-1 max-h-64 overflow-auto rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.micro)}>
                {CURATED_RULE_ROW_SCHEMA_REFERENCE}
              </pre>
            </div>
            <div>
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
                Draft rule JSON
              </p>
              <pre
                className={cn("mt-1 max-h-64 overflow-auto rounded-md border border-teal-600/40 bg-white p-3 dark:border-teal-700/50 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.micro)}
                data-testid="policy-rule-plain-english-preview"
              >
                {previewJson}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
