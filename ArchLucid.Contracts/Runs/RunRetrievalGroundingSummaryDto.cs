namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Operator-facing rollup of persisted retrieval grounding traces for a run (assessment #5).
/// </summary>
public sealed class RunRetrievalGroundingSummaryDto
{
    public int TraceCount
    {
        get;
        set;
    }

    public IReadOnlyList<string> AgentsWithTraces
    {
        get;
        set;
    } = [];

    /// <summary>RAG agents that executed but have no persisted grounding trace row.</summary>
    public IReadOnlyList<string> ExpectedAgentsMissingTraces
    {
        get;
        set;
    } = [];

    public double AverageCitationCoverage
    {
        get;
        set;
    }

    public int TotalRetrievedChunks
    {
        get;
        set;
    }

    /// <summary>PASS, WARN, or HOLD — aligned with sponsor-handoff vocabulary.</summary>
    public string Disposition
    {
        get;
        set;
    } = "WARN";

    public string? OperatorDetail
    {
        get;
        set;
    }
}
