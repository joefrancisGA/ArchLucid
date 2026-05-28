using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;

namespace ArchLucidFindingEngine;

/// <summary>
/// Sample plugin engine: copy this project, rename, and place the built <c>.dll</c> in
/// <c>ArchLucid:FindingEngines:PluginDirectory</c> (parameterless constructor required).
/// </summary>
public sealed class PluginSampleFindingEngine : IFindingEngine
{
    public string EngineType => "plugin-sample";

    public string Category => "Sample";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "PluginSampleFinding",
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Info,
            Title = "Sample plugin finding engine",
            Rationale = "Replace PluginSampleFindingEngine with your own IFindingEngine implementation.",
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["plugin-sample-stub"],
                DecisionsTaken = ["Emitted a single informational finding for graph snapshot validation."],
                AlternativePathsConsidered = [ExplainabilityTraceMarkers.RuleBasedDeterministicSinglePathNote]
            },
        };

        return Task.FromResult<IReadOnlyList<Finding>>([finding]);
    }
}
