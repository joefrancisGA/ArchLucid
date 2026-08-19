import { RunAgentQualityWarningsPanel } from "@/components/runs/RunAgentQualityWarningsPanel";
import { buildAgentQualityConcernRows } from "@/lib/agent-quality-warnings-presenter";
import { getRunAgentEvaluation, getRunTraces } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";

/** Surfaces quality-gate warned/rejected traces on the review detail page (above diagnostics). */
export async function RunAgentQualityWarningsSection(props: { readonly runId: string }): Promise<React.JSX.Element | null> {
  const { runId } = props;

  let evaluationPayload = null;
  let tracesPayload = null;

  try
  {
    evaluationPayload = (await getRunAgentEvaluation(runId)).data;
  }
  catch
  {
    return null;
  }

  try
  {
    tracesPayload = (await getRunTraces(runId, 1, 100)).data;
  }
  catch (e)
  {
    toApiLoadFailure(e);
    return null;
  }

  const rows = buildAgentQualityConcernRows(
    evaluationPayload,
    tracesPayload?.traces ?? [],
  );

  if (rows.length === 0)
    return null;

  return <RunAgentQualityWarningsPanel runId={runId} rows={rows} />;
}
