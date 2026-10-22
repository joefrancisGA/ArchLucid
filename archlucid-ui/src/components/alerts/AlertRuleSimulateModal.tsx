"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { buildDefaultSimulationRequestForRule, normalizeSimulateAlertRuleBody } from "@/lib/alert-rule-simulation";
import { simulateAlertRule } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_CALLOUT_BLOCKED_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RuleSimulationResult } from "@/types/alert-simulation";
import type { AlertRule } from "@/types/alerts";

/** Headline UX line for operators after `POST /v1/alert-simulation/simulate`. */
function simulationOutcomeHeadline(result: RuleSimulationResult): string {
  if (result.wouldCreateCount > 0) {
    return "Alert would fire";
  }

  return "Alert would not fire";
}

export interface AlertRuleSimulateModalProps {
  rule: AlertRule | null;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}

/**
 * Opens from Alert rules inventory: edits the canonical simulation envelope (same shape as Alerts → Simulation tab)
 * and posts to `simulateAlertRule` (`POST /v1/alert-simulation/simulate`).
 */
export function AlertRuleSimulateModal({ rule, open, onOpenChange }: AlertRuleSimulateModalProps) {
  const [payloadText, setPayloadText] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [apiFailure, setApiFailure] = useState<ApiLoadFailureState | null>(null);
  const [simulationResult, setSimulationResult] = useState<RuleSimulationResult | null>(null);

  useEffect(() => {
    if (!open || rule === null) {
      return;
    }

    setPayloadText(JSON.stringify(buildDefaultSimulationRequestForRule(rule), null, 2));
    setLocalErrorMessage(null);
    setApiFailure(null);
    setSimulationResult(null);
  }, [open, rule]);

  if (rule === null) {
    return null;
  }

  async function onRunSimulation() {
    setBusy(true);
    setLocalErrorMessage(null);
    setApiFailure(null);
    setSimulationResult(null);

    let parsed: unknown;

    try {
      parsed = JSON.parse(payloadText);
    } catch {
      setLocalErrorMessage("Invalid JSON — fix syntax and try again.");
      setBusy(false);

      return;
    }

    const normalized = normalizeSimulateAlertRuleBody(parsed);

    if (typeof normalized === "string") {
      setLocalErrorMessage(normalized);
      setBusy(false);

      return;
    }

    try {
      const nextResult = await simulateAlertRule(normalized);

      setSimulationResult(nextResult);
    } catch (e) {
      setApiFailure(toApiLoadFailure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Simulate: {rule.name}</DialogTitle>
          <DialogDescription>
            Sends <code className={OPERATOR_TYPOGRAPHY.micro}>POST /v1/alert-simulation/simulate</code> with the envelope below —
            tweak thresholds, scope fields, <code className={OPERATOR_TYPOGRAPHY.micro}>recentRunCount</code>, or{" "}
            <code className={OPERATOR_TYPOGRAPHY.micro}>runProjectSlug</code>, then preview whether the rule would create alerts against
            recent reviews.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="alert-rule-simulate-payload">Simulation request (JSON)</Label>
            <textarea
              id="alert-rule-simulate-payload"
              data-testid="alert-rule-simulate-payload"
              className={cn(
                "min-h-[220px] rounded-md border border-neutral-300 bg-white p-2 font-mono dark:border-neutral-700 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.micro,
              )}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              spellCheck={false}
              aria-busy={busy}
              disabled={busy}
            />
            <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <code className={OPERATOR_TYPOGRAPHY.micro}>simpleRule</code> is pre-filled from the saved rule; adjust trigger fields (
              <code className={OPERATOR_TYPOGRAPHY.micro}>ruleType</code>, <code className={OPERATOR_TYPOGRAPHY.micro}>severity</code>,{" "}
              <code className={OPERATOR_TYPOGRAPHY.micro}>thresholdValue</code>) to explore “what-if” scenarios.
            </p>
          </div>

          {localErrorMessage !== null ? (
            <div role="alert" data-testid="alert-rule-simulate-local-error" className={alertToneClass}>
              {localErrorMessage}
            </div>
          ) : null}

          {apiFailure !== null ? (
            <div role="alert" data-testid="alert-rule-simulate-api-error">
              <OperatorApiProblem
                problem={apiFailure.problem}
                fallbackMessage={apiFailure.message}
                correlationId={apiFailure.correlationId}
              />
            </div>
          ) : null}

          {simulationResult !== null ? (
            <section
              data-testid="alert-rule-simulate-result"
              className={cn("grid gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}
            >
              <div className="font-semibold" data-testid="alert-rule-simulate-verdict">
                {simulationOutcomeHeadline(simulationResult)}
              </div>
              <div className="text-neutral-700 dark:text-neutral-300">
                Evaluated reviews: <strong>{simulationResult.evaluatedRunCount}</strong> · matched:{" "}
                <strong>{simulationResult.matchedCount}</strong> · would create:{" "}
                <strong>{simulationResult.wouldCreateCount}</strong> · would suppress:{" "}
                <strong>{simulationResult.wouldSuppressCount}</strong>
              </div>
              {simulationResult.summaryNotes.length > 0 ? (
                <ul className={cn("m-0 max-h-32 overflow-y-auto pl-[18px] text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {simulationResult.summaryNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
          <Button
            type="button"
            variant="default"
            data-testid="alert-rule-simulate-run"
            onClick={() => void onRunSimulation()}
            disabled={busy}
          >
            {busy ? "Running…" : "Run Simulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const alertToneClass = OPERATOR_CALLOUT_BLOCKED_CLASS;
