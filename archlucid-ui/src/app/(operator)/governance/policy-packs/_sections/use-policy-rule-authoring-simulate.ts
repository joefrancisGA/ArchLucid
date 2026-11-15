import { useCallback, useEffect, useMemo, useState } from "react";

import { listRunsByProjectPaged, simulatePolicyPackAgainstRun } from "@/lib/api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import type { components } from "@/lib/openapi-schemas";
import type { PolicyPackContentDocument } from "@/types/policy-packs";
import { presentPolicyPackSimulateToast } from "@/lib/policy/policy-pack-simulate-toast";
import type { RunSummary } from "@/types/authority";

const AUTH_WIZARD_PROJECT_ID = "default";

export function tryParseContentDocument(json: string): PolicyPackContentDocument | null {
  try {
    const parsed: unknown = JSON.parse(json);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as PolicyPackContentDocument;
  } catch {
    return null;
  }
}

export type UsePolicyRuleAuthoringSimulateParams = {
  readonly policyContentJson: string;
  readonly selectedPackId: string;
  readonly canMutatePacks: boolean;
  readonly loading: boolean;
  readonly bundledPublishBlocked: boolean;
};

export type UsePolicyRuleAuthoringSimulateResult = {
  readonly simulateRunId: string;
  readonly setSimulateRunId: (value: string) => void;
  readonly recentRuns: RunSummary[];
  readonly runsLoadError: string | null;
  readonly simulateBusy: boolean;
  readonly simulateFailure: ApiLoadFailureState | null;
  readonly simulateResult: components["schemas"]["PolicyPackGovernanceDryRunResult"] | null;
  readonly blockOnCritical: boolean;
  readonly setBlockOnCritical: (value: boolean) => void;
  readonly allowPublishWithoutTest: boolean;
  readonly setAllowPublishWithoutTest: (value: boolean) => void;
  readonly loadRecentRuns: () => Promise<void>;
  readonly runSimulation: () => Promise<void>;
  readonly parsedDocumentForSimulate: PolicyPackContentDocument | null;
  readonly gateBlocked: boolean;
  readonly canPublishAfterTest: boolean;
  readonly publishDisabled: boolean;
};

export function usePolicyRuleAuthoringSimulate(
  params: UsePolicyRuleAuthoringSimulateParams,
): UsePolicyRuleAuthoringSimulateResult {
  const { policyContentJson, selectedPackId, canMutatePacks, loading, bundledPublishBlocked } = params;

  const [simulateRunId, setSimulateRunId] = useState("");
  const [recentRuns, setRecentRuns] = useState<RunSummary[]>([]);
  const [runsLoadError, setRunsLoadError] = useState<string | null>(null);
  const [simulateBusy, setSimulateBusy] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState<ApiLoadFailureState | null>(null);
  const [blockOnCritical, setBlockOnCritical] = useState(true);
  const [allowPublishWithoutTest, setAllowPublishWithoutTest] = useState(false);

  const parsedDocumentForSimulate: PolicyPackContentDocument | null = useMemo(
    () => tryParseContentDocument(policyContentJson),
    [policyContentJson],
  );

  const trimmedRun = simulateRunId.trim();
  const simulationInputs = useMemo(
    () => ({ content: parsedDocumentForSimulate, selectedPackId, runId: trimmedRun, blockOnCritical }),
    [parsedDocumentForSimulate, selectedPackId, trimmedRun, blockOnCritical],
  );
  const [completedSimulation, setCompletedSimulation] = useState<{
    inputs: typeof simulationInputs;
    result: components["schemas"]["PolicyPackGovernanceDryRunResult"];
  } | null>(null);
  const simulateResult = completedSimulation?.inputs === simulationInputs ? completedSimulation.result : null;

  useEffect(() => {
    if (simulateResult !== null) {
      presentPolicyPackSimulateToast(simulateResult, {
        successMessage: "Policy test completed for the selected review.",
      });
    }
  }, [simulateResult]);

  const loadRecentRuns = useCallback(async () => {
    setRunsLoadError(null);

    try {
      const raw: unknown = await listRunsByProjectPaged(AUTH_WIZARD_PROJECT_ID, 1, 30);
      const coerced = coerceRunSummaryPaged(raw);

      if (!coerced.ok) {
        setRecentRuns([]);
        setRunsLoadError(coerced.message);

        return;
      }

      setRecentRuns(coerced.value.items);
    } catch (e: unknown) {
      setRecentRuns([]);
      setRunsLoadError(toApiLoadFailure(e).message);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setSimulateFailure(null);
    setCompletedSimulation(null);
    const { content, runId, selectedPackId, blockOnCritical } = simulationInputs;

    if (content === null) {
      setSimulateFailure(
        uiFailureFromMessage("Policy content must be valid JSON matching the pack document shape before testing."),
      );

      return;
    }

    if (runId.length === 0) {
      setSimulateFailure(
        uiFailureFromMessage("Enter a review ID to evaluate this policy content against that architecture snapshot."),
      );

      return;
    }

    setSimulateBusy(true);

    try {
      const proposedId: string | null = /^[0-9a-fA-F-]{36}$/.test(selectedPackId) ? selectedPackId : null;
      const body: components["schemas"]["PolicyPackSimulateRequest"] = {
        runId,
        content,
        blockCommitOnCritical: blockOnCritical,
        proposedPolicyPackId: proposedId,
      };

      const result: components["schemas"]["PolicyPackGovernanceDryRunResult"] =
        await simulatePolicyPackAgainstRun(body);
      setCompletedSimulation({ inputs: simulationInputs, result });
    } catch (e: unknown) {
      setSimulateFailure(toApiLoadFailure(e));
    } finally {
      setSimulateBusy(false);
    }
  }, [simulationInputs]);

  const gateBlocked: boolean =
    simulateResult?.gateResult !== undefined && simulateResult.gateResult?.blocked === true;

  const canPublishAfterTest: boolean = simulateResult !== null && !gateBlocked;

  const publishDisabled: boolean =
    !canMutatePacks ||
    loading ||
    bundledPublishBlocked ||
    parsedDocumentForSimulate === null ||
    (!canPublishAfterTest && !allowPublishWithoutTest);

  return {
    simulateRunId,
    setSimulateRunId,
    recentRuns,
    runsLoadError,
    simulateBusy,
    simulateFailure,
    simulateResult,
    blockOnCritical,
    setBlockOnCritical,
    allowPublishWithoutTest,
    setAllowPublishWithoutTest,
    loadRecentRuns,
    runSimulation,
    parsedDocumentForSimulate,
    gateBlocked,
    canPublishAfterTest,
    publishDisabled,
  };
}
