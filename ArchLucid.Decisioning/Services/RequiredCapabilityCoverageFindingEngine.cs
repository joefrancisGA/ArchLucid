using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class RequiredCapabilityCoverageFindingEngine(RequiredCapabilityCoverageAnalyzer analyzer) : IFindingEngine
{
    public string EngineType => "required-capability-coverage";

    public string Category => "Governance";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        RequiredCapabilityCoverageResult result = analyzer.Analyze(graphSnapshot);

        if (result.RequiredCapabilities.Count == 0 || result.MissingCapabilities.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>([]);

        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "RequiredCapabilityCoverageFinding",
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Title = "Required capabilities are not fully evidenced on the context graph",
            Rationale =
                "One or more required capabilities asserted on the request lack matching topology, security, or requirement evidence.",
            PayloadType = nameof(RequiredCapabilityCoverageFindingPayload),
            Payload = new RequiredCapabilityCoverageFindingPayload
            {
                RequiredCapabilities = result.RequiredCapabilities,
                SatisfiedCapabilities = result.SatisfiedCapabilities,
                MissingCapabilities = result.MissingCapabilities,
                CoverageScorePercent = result.CoverageScorePercent,
            },
            RecommendedActions =
            [
                "Add topology, security baseline, or requirement nodes that evidence each missing capability.",
            ],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["required-capability-coverage"],
                DecisionsTaken =
                [
                    $"Coverage score {result.CoverageScorePercent}% with {result.MissingCapabilities.Count} missing capabilities.",
                ],
                Notes =
                [
                    $"Missing: {string.Join(", ", result.MissingCapabilities)}",
                ],
            },
        };

        return Task.FromResult<IReadOnlyList<Finding>>([finding]);
    }
}
