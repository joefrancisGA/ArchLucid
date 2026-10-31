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

        sb.AppendLine("## Decision trace summary (first five, not ranked)");
        sb.AppendLine();
        List<DecisionTraceDto> allTraces = detail.DecisionTraces.Where(static _ => true).ToList();
        List<DecisionTraceDto> traces = allTraces.Take(5).ToList();
        int omittedTraceCount = Math.Max(0, allTraces.Count - traces.Count);
        if (traces.Count == 0)
        {
            sb.AppendLine("_(No decision traces were stored on this run.)_");
            sb.AppendLine();
            return;
        }

        int index = 1;
        foreach (DecisionTraceDto trace in traces)
        {
            if (trace is RuleAuditTraceDto rule)
            {
                RuleAuditTracePayload p = rule.RuleAudit;
                string ruleSetId = FormatStoredTraceField(p.RuleSetId, "Rule set id was not stored.");
                string ruleSetVersion = FormatStoredTraceField(p.RuleSetVersion, "Rule set version was not stored.");
                sb.AppendLine(
                    $"{index}. **Rule audit** — rule set {ruleSetId} v{ruleSetVersion}; applied rules: {p.AppliedRuleIds.Count}, accepted findings: {p.AcceptedFindingIds.Count}, rejected: {p.RejectedFindingIds.Count}.");
            }
            else if (trace is RunEventTraceDto runEvent)
            {
                RunEventTracePayload p = runEvent.RunEvent;
                string eventType = FormatStoredTraceField(p.EventType, "Event type was not stored.");
                string eventDescription = FormatStoredTraceField(p.EventDescription, "Event description was not stored.");
                sb.AppendLine($"{index}. **Run event** — {eventType}: {eventDescription}");
            }
            else
            {
                sb.AppendLine($"{index}. **Trace** — `{trace.Kind}`");
            }

            index++;
        }

        if (omittedTraceCount > 0)
        {
            sb.AppendLine(
                $"_{omittedTraceCount} more decision trace(s) were stored but are not listed in this summary._");
        }

        sb.AppendLine();
        if (!PilotExportLinkHonestyCopy.IsReviewLinkBaseStored(baseUrl))
        {
            sb.AppendLine(
                $"Full trace payloads: {PilotExportLinkHonestyCopy.ReviewLinkBaseNotStored} (`decisionTraces` array when present).");
            sb.AppendLine();
            return;
        }

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

        sb.AppendLine(PilotTopFindingPresentationHonestyCopy.FormatSelectedFindingMarkdownLine(deltas));
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
        sb.AppendLine($"| Manifest version | `{chain.ManifestVersion ?? "Manifest version was not stored."}` |");
        sb.AppendLine($"| Findings snapshot id | `{FormatGuid(chain.FindingsSnapshotId, "Findings snapshot id was not stored.")}` |");
        sb.AppendLine($"| Context snapshot id | `{FormatGuid(chain.ContextSnapshotId, "Context snapshot id was not stored.")}` |");
        sb.AppendLine($"| Graph snapshot id | `{FormatGuid(chain.GraphSnapshotId, "Graph snapshot id was not stored.")}` |");
        sb.AppendLine($"| Decision trace id | `{FormatGuid(chain.DecisionTraceId, "Decision trace id was not stored.")}` |");
        sb.AppendLine($"| Golden manifest id | `{FormatGuid(chain.GoldenManifestId, "Golden manifest id was not stored.")}` |");
        sb.AppendLine($"| Related graph nodes | {PilotSponsorMaterialFindingsHonestyCopy.FormatRelatedGraphNodeCount(chain.RelatedGraphNodeIds.Count)} |");
        sb.AppendLine($"| Agent execution traces | {PilotSponsorMaterialFindingsHonestyCopy.FormatAgentExecutionTraceCount(chain.AgentExecutionTraceIds.Count)} |");
        sb.AppendLine();
    }

    private static string FormatGuid(Guid? id, string missingValue = "(none)")
    {
        return id is null ? missingValue : id.Value.ToString("D");
    }

    private static string FormatStoredTraceField(string? value, string missingLabel)
    {
        return string.IsNullOrWhiteSpace(value) ? missingLabel : $"`{value.Trim()}`";
    }
}
