"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateHolisticCritique } from "@/lib/api/holistic-critic-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailHolisticCriticPanelProps = {
  readonly runId: string;
  readonly hasGoldenManifest: boolean;
};

export function RunDetailHolisticCriticPanel(props: RunDetailHolisticCriticPanelProps) {
  const { runId, hasGoldenManifest } = props;

  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [critiqueMarkdown, setCritiqueMarkdown] = useState<string | null>(null);

  if (!hasGoldenManifest) {
    return null;
  }

  return (
    <Card className="border border-neutral-200 dark:border-neutral-700" data-testid="run-holistic-critic-panel">
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Holistic critic
        </CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Free-form principal-architect critique beyond structured findings — blind spots, alternatives, and pushback.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-1">
          <label htmlFor="holistic-critic-focus" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            Optional focus (security, cost, reliability…)
          </label>
          <Input
            id="holistic-critic-focus"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            disabled={busy}
            placeholder="Example: disaster recovery and regional failover"
            data-testid="holistic-critic-focus"
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={busy || runId.trim().length === 0}
          data-testid="holistic-critic-generate"
          onClick={() => {
            void (async () => {
              setBusy(true);
              setFailure(null);
              setDisclaimer(null);
              setCritiqueMarkdown(null);

              try {
                const trimmedFocus = focus.trim();
                const response = await generateHolisticCritique(runId, {
                  focus: trimmedFocus.length > 0 ? trimmedFocus : undefined,
                });

                setDisclaimer(response.disclaimer);
                setCritiqueMarkdown(response.critiqueMarkdown);
              } catch (e: unknown) {
                setFailure(toApiLoadFailure(e));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? "Generating critique…" : "Generate holistic critique"}
        </Button>
        {failure !== null ? (
          <div role="alert">
            <OperatorApiProblem failure={failure} />
          </div>
        ) : null}
        {disclaimer !== null && critiqueMarkdown !== null ? (
          <div className="space-y-2">
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>{disclaimer}</p>
            <pre className={cn("max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-white p-3 leading-relaxed text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
              {critiqueMarkdown}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
