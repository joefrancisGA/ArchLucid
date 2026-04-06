using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Payloads;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public class SecurityCoverageFindingEngine(IGraphCoverageAnalyzer analyzer) : IFindingEngine
{
    public string EngineType => "security-coverage";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        SecurityCoverageResult result = analyzer.AnalyzeSecurity(graphSnapshot);
        List<Finding> findings = [];

        if (result.UnprotectedResourceCount > 0)
        
            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "SecurityCoverageFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Warning,
                Title = "Some topology resources are not protected by any security baseline nodes",
                Rationale = "Security protection coverage is incomplete for the current topology graph.",
                PayloadType = nameof(SecurityCoverageFindingPayload),
                Payload = new SecurityCoverageFindingPayload
                {
                    SecurityNodeCount = result.SecurityNodeCount,
                    ProtectedResourceCount = result.ProtectedResourceCount,
                    UnprotectedResourceCount = result.UnprotectedResourceCount,
                    UnprotectedResources = result.UnprotectedResources
                },
                RecommendedActions =
                [
                    "Add security baseline declarations or protection mappings for uncovered resources."
                ],
                Trace = new ExplainabilityTrace
                {
                    DecisionsTaken =
                    [
                        "Compared topology resources against PROTECTS edges."
                    ]
                }
            });
        

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}
