namespace ArchLucid.AgentRuntime;

/// <summary>Documents which agent paths persist retrieval grounding traces (RAG-V1-006).</summary>
public static class AgentRetrievalGroundingTraceCoverageRegistry
{
    public static IReadOnlyList<string> AgentNamesWritingGroundingTraces { get; } =
    [
        "Compliance",
        "Topology",
        RetailPriceRetrievalGroundingTraceMapper.CostAgentName,
    ];
}
