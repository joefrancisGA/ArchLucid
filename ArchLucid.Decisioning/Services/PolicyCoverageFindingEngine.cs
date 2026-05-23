using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public class PolicyCoverageFindingEngine(IGraphCoverageAnalyzer analyzer) : IFindingEngine
{
    public string EngineType => "policy-coverage";

    public string Category => "Policy";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        PolicyCoverageResult result = analyzer.AnalyzePolicy(graphSnapshot);
        List<Finding> findings = [];

        if (result.PolicyNodeCount == 0)
        {
            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "PolicyCoverageFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Warning,
                Title = "No policy controls were found",
                Rationale = "The graph contains no PolicyControl nodes.",
                PayloadType = nameof(PolicyCoverageFindingPayload),
                Payload = new PolicyCoverageFindingPayload
                {
                    PolicyNodeCount = 0,
                    PolicyApplicabilityEdgeCount = 0,
                    UncoveredResources = result.UncoveredResources
                },
                Trace = new ExplainabilityTrace
                {
                    RulesApplied = ["policy-coverage-presence"],
                    DecisionsTaken =
                    [
                        "No PolicyControl nodes found in graph — emitted coverage warning."
                    ],
                    AlternativePathsConsidered =
                    [
                        "Introduce PolicyControl nodes with APPLIES_TO edges to topology resources.",
                        "Document an intentional omission when policy modeling is out of scope for this graph."
                    ],
                    Notes = [$"Uncovered topology resources: {result.UncoveredResources.Count}"]
                }
            });

            return Task.FromResult<IReadOnlyList<Finding>>(findings);
        }

        if (result.UncoveredResources.Count > 0)

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "PolicyCoverageFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Warning,
                Title = "Some topology resources are not covered by policy applicability edges",
                Rationale = "Policy applicability coverage is incomplete for the current topology graph.",
                PayloadType = nameof(PolicyCoverageFindingPayload),
                Payload = new PolicyCoverageFindingPayload
                {
                    PolicyNodeCount = result.PolicyNodeCount,
                    PolicyApplicabilityEdgeCount = result.PolicyApplicabilityEdgeCount,
                    UncoveredResources = result.UncoveredResources
                },
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [.. result.UncoveredResources],
                    RulesApplied = ["policy-coverage-applicability"],
                    DecisionsTaken =
                    [
                        "Compared PolicyControl APPLIES_TO edges against topology resources."
                    ],
                    AlternativePathsConsidered =
                    [
                        "Map uncovered resources to policies by adding or extending APPLIES_TO applicability.",
                        "Reduce in-scope topology or accept documented exceptions for uncovered resources."
                    ],
                    Notes =
                    [
                        $"Policy nodes: {result.PolicyNodeCount}",
                        $"APPLIES_TO edges: {result.PolicyApplicabilityEdgeCount}",
                        $"Uncovered resources: {result.UncoveredResources.Count}"
                    ]
                }
            });

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}
