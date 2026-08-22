"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { generatePolicyPackFromPrompt } from "@/lib/api/policy-pack-generate-api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  tryParseCuratedRulesDocumentJson,
  type CuratedRulesDocument,
} from "@/lib/policy/policy-pack-curated-rules-v1";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type PolicyPackNaturalLanguageBuilderProps = {
  readonly canMutatePacks: boolean;
  readonly onGenerated: (document: CuratedRulesDocument) => void;
};

export function PolicyPackNaturalLanguageBuilder(props: PolicyPackNaturalLanguageBuilderProps) {
  const { canMutatePacks, onGenerated } = props;

  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  return (
    <div
      className="rounded-md border border-dashed border-neutral-300 bg-al-surface-raised p-4 dark:border-neutral-700"
      data-testid="policy-pack-nl-builder"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Policy pack generator
      </p>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        ArchLucid drafts a curated rules document you can refine in the visual builder before publish. Human review is
        required before activation.
      </p>
      <div
        className={cn("mt-3", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
        data-testid="policy-pack-nl-human-review-callout"
      >
        <strong>Generated packs require human review before publish.</strong>{" "}
        <Link href={GOVERNANCE_POLICY_PACKS_PATH} className={OPERATOR_LINK.inline}>
          Open policy packs editor
        </Link>{" "}
        to refine rules before activation.
      </div>
      <Textarea
        className={cn("mt-3 font-sans", OPERATOR_TYPOGRAPHY.body)}
        rows={6}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={!canMutatePacks || busy}
        placeholder="Example: Create a HIPAA-aligned pack for Azure workloads handling PHI — encrypt data at rest with customer-managed keys, require audit logging on overrides, and document BAA coverage for third-party services."
        data-testid="policy-pack-nl-prompt"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canMutatePacks || busy || prompt.trim().length < 20}
          data-testid="policy-pack-nl-generate"
          onClick={() => {
            void (async () => {
              setBusy(true);
              setFailure(null);
              setDisclaimer(null);
              setPreviewJson(null);
              setValidationWarnings([]);

              try {
                const response = await generatePolicyPackFromPrompt({ prompt: prompt.trim() });
                const parsed = tryParseCuratedRulesDocumentJson(response.curatedRulesDocumentJson);

                if (parsed === null) {
                  setFailure(
                    uiFailureFromMessage(
                      "Generated document did not match the curated rules schema. Try refining your prompt.",
                    ),
                  );

                  return;
                }

                setDisclaimer(response.disclaimer);
                setPreviewJson(response.curatedRulesDocumentJson);
                setValidationWarnings(response.validationWarnings ?? []);
                onGenerated(parsed);
              } catch (e: unknown) {
                setFailure(toApiLoadFailure(e));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? "Generating…" : "Generate policy pack"}
        </Button>
      </div>
      {validationWarnings.length > 0 ? (
        <div
          className={cn("mt-3", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
          data-testid="policy-pack-nl-validation-warnings"
          role="status"
        >
          <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>Validation warnings — review before publish</p>
          <ul className="mb-0 mt-2 list-disc space-y-1 pl-5">
            {validationWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {failure !== null ? (
        <div className="mt-3" role="alert">
          <OperatorApiProblem failure={failure} />
          {failure.httpStatus === 422 ? (
            <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Revise your prompt and try again.
            </p>
          ) : null}
        </div>
      ) : null}
      {disclaimer !== null && previewJson !== null ? (
        <div className="mt-4 space-y-2">
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>{disclaimer}</p>
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
            Generated document preview
          </p>
          <pre className={cn("max-h-64 overflow-auto rounded-md border border-amber-600/40 bg-white p-3 dark:border-amber-700/50 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.micro)}>
            {previewJson}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
