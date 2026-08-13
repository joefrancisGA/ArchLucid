using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class SecurityBaselineExpectationFindingEngine(IGraphCoverageAnalyzer analyzer) : IFindingEngine
{
    public string EngineType => "security-baseline-expectation";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        SecurityBaselineCategoryExpectationResult result =
            analyzer.AnalyzeSecurityBaselineExpectations(graphSnapshot);

        if (result.TopologyNodeCount == 0 || result.MissingCategories.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>([]);

        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.SecurityBaselineExpectationFinding,
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Title = "Category-scoped security baseline coverage is incomplete",
            Rationale =
                "Workload-expected topology categories lack any protected resources linked by security baseline PROTECTS edges.",
            PayloadType = nameof(SecurityBaselineExpectationFindingPayload),
            Payload = new SecurityBaselineExpectationFindingPayload
            {
                TopologyNodeCount = result.TopologyNodeCount,
                SecurityNodeCount = result.SecurityNodeCount,
                ExpectedCategories = result.ExpectedCategories,
                ProtectedCategories = result.ProtectedCategories,
                MissingCategories = result.MissingCategories
            },
            RecommendedActions =
            [
                "Add or extend security baseline PROTECTS mappings for resources in the missing categories."
            ],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["security-baseline-category-expectation"],
                DecisionsTaken =
                [
                    "Compared workload-expected topology categories to categories with protected resources."
                ],
                AlternativePathsConsidered =
                [
                    "Add security baseline nodes with PROTECTS edges to resources in each missing category.",
                    "Narrow expected categories when the workload legitimately omits a pillar."
                ],
                Notes =
                [
                    $"Expected: {string.Join(", ", result.ExpectedCategories)}",
                    $"Protected: {string.Join(", ", result.ProtectedCategories)}",
                    $"Missing: {string.Join(", ", result.MissingCategories)}"
                ]
            }
        };

        return Task.FromResult<IReadOnlyList<Finding>>([finding]);
    }
}
