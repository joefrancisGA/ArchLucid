namespace ArchLucid.Contracts.Findings;

/// <summary>POST body for <c>/v1/runs/{runId}/findings/{findingId}/insight-signal</c>.</summary>
public sealed class RecordFindingInsightSignalRequest
{
    public FindingInsightSignalKind Kind
    {
        get;
        init;
    } = FindingInsightSignalKind.DidNotThinkOfThat;
}
