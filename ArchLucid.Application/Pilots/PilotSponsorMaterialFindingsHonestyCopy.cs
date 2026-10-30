namespace ArchLucid.Application.Pilots;

internal static class PilotSponsorMaterialFindingsHonestyCopy
{
    internal const string CategoryNotStored = "Category was not stored.";
    internal const string FindingTitleNotStored = "Finding title was not stored.";
    internal const string AgentFindingsNotStored = "Agent findings were not stored.";
    internal const string RelatedGraphNodeIdsNotStored = "Related graph node ids were not stored.";
    internal const string RelatedGraphNodeIdsStoredEmpty =
        "Related graph node ids were stored as an empty list.";
    internal const string AgentExecutionTraceIdsNotStored = "Agent execution trace ids were not stored.";
    internal const string AgentExecutionTraceIdsStoredEmpty =
        "Agent execution trace ids were stored as an empty list.";
    internal const string MaterialFindingsSetStoredEmpty =
        "The sponsor material finding set was stored empty for this package.";

    internal static string FormatRelatedGraphNodeCount(int count) =>
        count > 0
            ? count.ToString(System.Globalization.CultureInfo.InvariantCulture)
            : RelatedGraphNodeIdsStoredEmpty;

    internal static string FormatAgentExecutionTraceCount(int count) =>
        count > 0
            ? count.ToString(System.Globalization.CultureInfo.InvariantCulture)
            : AgentExecutionTraceIdsStoredEmpty;
}
