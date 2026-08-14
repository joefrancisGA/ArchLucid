using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class SecurityBaselineCompletenessFindingEngine(IGraphCoverageAnalyzer analyzer) : IFindingEngine
{
    public string EngineType => "security-baseline-completeness";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        SecurityBaselineCompletenessResult result = analyzer.AnalyzeSecurityBaselineCompleteness(graphSnapshot);

        if (result.TopologyNodeCount == 0 || result.MissingControlFamilies.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>([]);

        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.SecurityBaselineCompletenessFinding,
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Title = "Workload security baseline control-family coverage is incomplete",
            Rationale =
                "Scope metadata implies security control families that are not represented by active security baseline PROTECTS coverage.",
            PayloadType = nameof(SecurityBaselineCompletenessFindingPayload),
            Payload = new SecurityBaselineCompletenessFindingPayload
            {
                TopologyNodeCount = result.TopologyNodeCount,
                SecurityNodeCount = result.SecurityNodeCount,
                ExpectedControlFamilies = result.ExpectedControlFamilies,
                PresentControlFamilies = result.PresentControlFamilies,
                MissingControlFamilies = result.MissingControlFamilies,
                CompletenessMatrix = result.CompletenessMatrix
                    .Select(row => new SecurityBaselineCompletenessMatrixRowPayload
                    {
                        ControlFamily = row.ControlFamily,
                        Expected = row.Expected,
                        Present = row.Present
                    })
                    .ToList()
            },
            RecommendedActions =
            [
                "Add or extend security baseline controls with PROTECTS edges for each missing control family."
            ],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["security-baseline-completeness-matrix"],
                DecisionsTaken =
                [
                    "Compared workload-expected control families to families inferred from active security baseline nodes."
                ],
                AlternativePathsConsidered =
                [
                    "Add security baseline nodes with explicit controlFamily properties for each missing family.",
                    "Update scope metadata when the workload legitimately omits a control family for this review."
                ],
                Notes =
                [
                    $"Expected: {string.Join(", ", result.ExpectedControlFamilies)}",
                    $"Present: {string.Join(", ", result.PresentControlFamilies)}",
                    $"Missing: {string.Join(", ", result.MissingControlFamilies)}"
                ]
            }
        };

        return Task.FromResult<IReadOnlyList<Finding>>([finding]);
    }
}
