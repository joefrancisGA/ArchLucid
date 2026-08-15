using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class RequirementExpectationFindingEngine(IGraphCoverageAnalyzer analyzer) : IFindingEngine
{
    public string EngineType => "requirement-expectation";

    public string Category => "Requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        RequirementExpectationResult result = analyzer.AnalyzeRequirementExpectations(graphSnapshot);

        if (result.TopologyNodeCount == 0 || result.MissingThemes.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>([]);

        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.RequirementExpectationFinding,
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Title = "Workload-conditioned requirement themes are incomplete",
            Rationale =
                "Scope metadata implies requirement themes that are not represented by requirement nodes in the graph.",
            PayloadType = nameof(RequirementExpectationFindingPayload),
            Payload = new RequirementExpectationFindingPayload
            {
                RequirementNodeCount = result.RequirementNodeCount,
                TopologyNodeCount = result.TopologyNodeCount,
                ExpectedThemes = result.ExpectedThemes,
                PresentThemes = result.PresentThemes,
                MissingThemes = result.MissingThemes
            },
            RecommendedActions =
            [
                "Add requirement nodes that cover the missing workload-conditioned themes."
            ],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["requirement-expectation-workload-scope"],
                DecisionsTaken =
                [
                    "Compared workload-conditioned requirement themes to themes inferred from requirement nodes."
                ],
                AlternativePathsConsidered =
                [
                    "Add requirement nodes with explicit theme properties for each missing theme.",
                    "Update scope metadata when the workload legitimately omits a theme for this review."
                ],
                Notes =
                [
                    $"Expected: {string.Join(", ", result.ExpectedThemes)}",
                    $"Present: {string.Join(", ", result.PresentThemes)}",
                    $"Missing: {string.Join(", ", result.MissingThemes)}"
                ]
            }
        };

        return Task.FromResult<IReadOnlyList<Finding>>([finding]);
    }
}
