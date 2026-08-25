using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Persistence.DecisionTraces;

namespace ArchLucid.Application.Pilots;

/// <summary>Decision trace summary and top-severity evidence chain sections for the first-value report.</summary>
public static class FirstValueReportTraceSectionFormatter
{
    public static void AppendDecisionTraceSection(StringBuilder sb, ArchitectureRunDetail detail, string runId, string baseUrl)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(baseUrl);

        sb.AppendLine("## Decision trace summary (top 5)");
        sb.AppendLine();
        List<DecisionTraceDto> traces = detail.DecisionTraces.Where(static _ => true).Take(5).ToList();
        if (traces.Count == 0)
        {
            sb.AppendLine("_(No decision traces on this run — typical before commit or for coordinator-only paths.)_");
            sb.AppendLine();
            return;
        }

        int index = 1;
        foreach (DecisionTraceDto trace in traces)
        {
            if (trace is RuleAuditTraceDto rule)
            {
                RuleAuditTracePayload p = rule.RuleAudit;
                sb.AppendLine(
                    $"{index}. **Rule audit** — rule set `{p.RuleSetId}` v`{p.RuleSetVersion}`; applied rules: {p.AppliedRuleIds.Count}, accepted findings: {p.AcceptedFindingIds.Count}, rejected: {p.RejectedFindingIds.Count}.");
            }
            else if (trace is RunEventTraceDto runEvent)
            {
                RunEventTracePayload p = runEvent.RunEvent;
                sb.AppendLine($"{index}. **Run event** — `{p.EventType}`: {p.EventDescription}");
            }
            else
            {
                sb.AppendLine($"{index}. **Trace** — `{trace.Kind}`");
            }

            index++;
        }

        sb.AppendLine();
        sb.AppendLine($"Full trace payloads: [GET /v1/architecture/review/{runId}]({baseUrl}/v1/architecture/review/{runId}) (`decisionTraces` array when present).");
        sb.AppendLine();
    }

    public static void AppendEvidenceChainSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(deltas);

        sb.AppendLine("## Top-severity finding — evidence chain excerpt");
        sb.AppendLine();
        if (deltas.TopFindingId is null)
        {
            sb.AppendLine("_(No findings on this run; evidence-chain excerpt skipped.)_");
            sb.AppendLine();
            return;
        }

        sb.AppendLine($"Selected finding: `{deltas.TopFindingId}` (severity `{deltas.TopFindingSeverity ?? "Unknown"}`).");
        sb.AppendLine();
        FindingEvidenceChainResponse? chain = deltas.TopFindingEvidenceChain;
        if (chain is null)
        {
            sb.AppendLine(
                "_(Evidence chain unavailable — the top-severity finding is not present in the persisted FindingsSnapshot, or the chain service could not resolve it. Review the full run detail JSON for an alternate selection.)_");
            sb.AppendLine();
            return;
        }

        sb.AppendLine("| Pointer | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine($"| Manifest version | `{chain.ManifestVersion ?? "(none)"}` |");
        sb.AppendLine($"| Findings snapshot id | `{FormatGuid(chain.FindingsSnapshotId)}` |");
        sb.AppendLine($"| Context snapshot id | `{FormatGuid(chain.ContextSnapshotId)}` |");
        sb.AppendLine($"| Graph snapshot id | `{FormatGuid(chain.GraphSnapshotId)}` |");
        sb.AppendLine($"| Decision trace id | `{FormatGuid(chain.DecisionTraceId)}` |");
        sb.AppendLine($"| Golden manifest id | `{FormatGuid(chain.GoldenManifestId)}` |");
        sb.AppendLine($"| Related graph nodes | {chain.RelatedGraphNodeIds.Count} |");
        sb.AppendLine($"| Agent execution traces | {chain.AgentExecutionTraceIds.Count} |");
        sb.AppendLine();
    }

    private static string FormatGuid(Guid? id)
    {
        return id is null ? "(none)" : id.Value.ToString("D");
    }
}
