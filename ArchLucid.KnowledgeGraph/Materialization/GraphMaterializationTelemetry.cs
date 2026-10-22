using System.Diagnostics;

namespace ArchLucid.KnowledgeGraph.Materialization;

internal static class GraphMaterializationTelemetry
{
    internal const string ActivitySourceName = "ArchLucid.KnowledgeGraph.Materialization";

    private static readonly ActivitySource ActivitySource = new(ActivitySourceName, "1.0.0");

    internal static Activity? StartStageActivity(string stageName)
    {
        Activity? activity = ActivitySource.StartActivity("graph.materialization.stage");
        activity?.SetTag("graph.materialization.stage", stageName);
        return activity;
    }
}
