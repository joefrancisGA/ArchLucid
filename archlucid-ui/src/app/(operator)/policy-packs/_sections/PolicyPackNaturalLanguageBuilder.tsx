"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { generatePolicyPackFromPrompt } from "@/lib/api/policy-pack-generate-api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  tryParseCuratedRulesDocumentJson,
  type CuratedRulesDocument,
} from "@/lib/policy-pack-curated-rules-v1";

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

  return (
    <div
      className="rounded-md border border-dashed border-neutral-300 bg-al-surface-raised p-4 dark:border-neutral-700"
      data-testid="policy-pack-nl-builder"
    >
      <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        Describe your governance pack in plain English
      </p>
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
        ArchLucid drafts a curated rules document you can refine in the visual builder before publish. Human review is
        required before activation.
      </p>
      <Textarea
        className="mt-3 font-sans text-sm"
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
                onGenerated(parsed);
              } catch (e: unknown) {
                setFailure(toApiLoadFailure(e));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? "Generating…" : "Generate pack from description"}
        </Button>
      </div>
      {failure !== null ? (
        <div className="mt-3" role="alert">
          <OperatorApiProblem failure={failure} />
        </div>
      ) : null}
      {disclaimer !== null && previewJson !== null ? (
        <div className="mt-4 space-y-2">
          <p className="m-0 text-xs text-amber-900 dark:text-amber-100">{disclaimer}</p>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            Generated document preview
          </p>
          <pre className="max-h-64 overflow-auto rounded-md border border-amber-600/40 bg-white p-3 text-xs dark:border-amber-700/50 dark:bg-neutral-950">
            {previewJson}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
