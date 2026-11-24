using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>POST body for <c>/v1/runs/{runId}/findings/{findingId}/insight-signal</c>.</summary>
public sealed class RecordFindingInsightSignalRequest
{
    [JsonRequired]
    public FindingInsightSignalKind Kind
    {
        get;
        init;
    } = FindingInsightSignalKind.DidNotThinkOfThat;
}
