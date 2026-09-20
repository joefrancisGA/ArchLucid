"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  confirmOperatorInferredConnection,
  dismissOperatorInferredConnection,
  listInferenceQuestionnaireItems,
} from "@/lib/infra-evidence/operator-inferred-connection-api";
import {
  operatorInferredConnectionPanelErrorFromUnknown,
  operatorInferredConnectionPanelErrorRecoveryScenario,
  type OperatorInferredConnectionPanelError,
} from "@/lib/infra-evidence/operator-inferred-connection-panel-error";
import type { OperatorInferredConnectionRow } from "@/lib/infra-evidence/operator-inferred-connection-types";
import { cn } from "@/lib/utils";

type InferenceQuestionnairePanelProps = {
  readonly snapshotId: string;
};

type QuestionnaireChoice = "yes" | "no" | "skip" | null;

export function InferenceQuestionnairePanel(
  props: InferenceQuestionnairePanelProps,
): React.JSX.Element | null {
  const { snapshotId } = props;
  const [items, setItems] = useState<OperatorInferredConnectionRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choice, setChoice] = useState<QuestionnaireChoice>(null);
  const [skippedConnectionIds, setSkippedConnectionIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selectedCatalog, setSelectedCatalog] = useState<string>("");
  const [panelError, setPanelError] = useState<OperatorInferredConnectionPanelError | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const proposedItems = useMemo(
    () => items.filter(
      (item) => item.status === "Proposed" && !skippedConnectionIds.has(item.connectionId),
    ),
    [items, skippedConnectionIds],
  );

  const currentItem = proposedItems[currentIndex] ?? null;
  const hasHumanConfirmed = useMemo(
    () => items.some((item) => item.status === "Confirmed"),
    [items],
  );

  const loadItems = useCallback(async () => {
    if (snapshotId.trim().length === 0) {
      setItems([]);
      setPanelError(null);
      return;
    }

    setLoading(true);

    try {
      const response = await listInferenceQuestionnaireItems(snapshotId);
      setItems(response.items);
      setCurrentIndex(0);
      setChoice(null);
      setSelectedCatalog("");
      setPanelError(null);
    } catch (error) {
      setPanelError(
        operatorInferredConnectionPanelErrorFromUnknown(
          error,
          "Could not load inference questionnaire items.",
          "load",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [snapshotId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const requiresCatalogChoice =
    currentItem?.ruleName === "SQL catalog missing" || currentItem?.ruleName === "Tenant catalog template";

  const canSubmit =
    !submitting
    && (choice === "skip"
      || choice === "no"
      || (choice === "yes" && (!requiresCatalogChoice || selectedCatalog.trim().length > 0)));

  const onSubmit = useCallback(async () => {
    if (currentItem == null || choice == null) {
      return;
    }

    if (choice === "skip") {
      setSkippedConnectionIds((current) => {
        const next = new Set(current);
        next.add(currentItem.connectionId);
        return next;
      });
      setCurrentIndex(0);
      setChoice(null);
      setSelectedCatalog("");
      return;
    }

    setSubmitting(true);
    setPanelError(null);

    try {
      if (choice === "yes") {
        await confirmOperatorInferredConnection(snapshotId, {
          connectionId: currentItem.connectionId,
          toCatalog: selectedCatalog.trim().length > 0 ? selectedCatalog : currentItem.toCatalog,
        });
      } else {
        await dismissOperatorInferredConnection(snapshotId, { connectionId: currentItem.connectionId });
      }

      await loadItems();
    } catch (error) {
      setPanelError(
        operatorInferredConnectionPanelErrorFromUnknown(
          error,
          "Could not save your answer.",
          "mutation",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }, [choice, currentItem, loadItems, proposedItems.length, selectedCatalog, snapshotId]);

  if (proposedItems.length === 0 && !hasHumanConfirmed && panelError == null) {
    return null;
  }

  const showEmptyRemainCaption = currentItem == null && panelError?.kind !== "load";

  return (
    <section
      className="rounded-md border border-al-border bg-al-surface p-4"
      data-testid="inference-questionnaire-panel"
      aria-label="Inference questionnaire"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Inference questionnaire</h2>
          {hasHumanConfirmed ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="inference-questionnaire-human-confirmed-caption"
            >
              Confirmed connection edges are operator assertions from uploaded config or the inference questionnaire.
            </p>
          ) : null}
        </div>

        {panelError != null ? (
          <>
            <OperatorMutationInlineError
              message={panelError.message}
              recoveryScenario={operatorInferredConnectionPanelErrorRecoveryScenario(panelError.kind)}
            />
            {panelError.kind === "load" ? (
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={loading}
                onClick={() => void loadItems()}
                data-testid="inference-questionnaire-retry"
              >
                Retry
              </Button>
            ) : null}
          </>
        ) : null}

        {currentItem != null ? (
          <>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="inference-questionnaire-progress">
              Question {currentIndex + 1} of {proposedItems.length}
            </p>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {currentItem.ruleName ?? "Inference gap"}
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="inference-questionnaire-question">
              {currentItem.questionText ?? "Does this connection exist?"}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={choice === "yes" ? "primary" : "outline"}
                onClick={() => setChoice("yes")}
                data-testid="inference-questionnaire-yes"
              >
                Yes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={choice === "no" ? "primary" : "outline"}
                onClick={() => setChoice("no")}
                data-testid="inference-questionnaire-no"
              >
                No
              </Button>
              <Button
                type="button"
                size="sm"
                variant={choice === "skip" ? "primary" : "outline"}
                onClick={() => setChoice("skip")}
                data-testid="inference-questionnaire-skip"
              >
                Skip
              </Button>
            </div>

            {choice === "yes" && requiresCatalogChoice ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="inference-questionnaire-catalog">Database choice</Label>
                <select
                  id="inference-questionnaire-catalog"
                  className="rounded-md border border-al-border bg-al-surface px-3 py-2 text-sm"
                  value={selectedCatalog}
                  onChange={(event) => setSelectedCatalog(event.target.value)}
                  data-testid="inference-questionnaire-catalog"
                >
                  <option value="">Select a database</option>
                  {currentItem.toCatalog != null ? (
                    <option value={currentItem.toCatalog}>{currentItem.toCatalog}</option>
                  ) : null}
                  <option value="server-only">Server only</option>
                </select>
              </div>
            ) : null}

            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={!canSubmit}
              onClick={() => void onSubmit()}
              data-testid="inference-questionnaire-submit"
            >
              Continue
            </Button>
          </>
        ) : showEmptyRemainCaption ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            No proposed questionnaire items remain for this snapshot.
          </p>
        ) : null}
      </div>
    </section>
  );
}
