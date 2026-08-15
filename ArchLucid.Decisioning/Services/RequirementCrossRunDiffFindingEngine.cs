using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class RequirementCrossRunDiffFindingEngine : IFindingEngine
{
    public string EngineType => "requirement-cross-run-diff";

    public string Category => "Requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        RequirementNameDiffResult diff = GraphSnapshotRequirementDiffAnalyzer.AnalyzeNameDelta(graphSnapshot);
        List<Finding> findings = [];

        if (diff.PriorRequirementNames.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>(findings);

        if (diff.RemovedRequirementNames.Count > 0)
        {
            findings.Add(FindingFactory.CreateRequirementGapFinding(
                EngineType,
                "Requirement set regressed since the prior committed run",
                "One or more requirements present in the prior context snapshot are absent in the current graph.",
                "requirement-set-regression",
                $"Removed requirements: {string.Join(", ", diff.RemovedRequirementNames)}",
                "Reviewers may miss regressions in traceability when requirements disappear between runs.",
                FindingSeverity.Warning));
        }

        if (diff.AddedRequirementNames.Count > 0)
        {
            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "RequirementCoverageFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Info,
                Title = "Requirement set expanded since the prior committed run",
                Rationale = "New requirements appeared relative to the prior context snapshot.",
                PayloadType = nameof(RequirementCoverageFindingPayload),
                Payload = new RequirementCoverageFindingPayload
                {
                    RequirementNodeCount = diff.CurrentRequirementNames.Count,
                    CoveredRequirementCount = diff.CurrentRequirementNames.Count - diff.AddedRequirementNames.Count,
                    UncoveredRequirementCount = diff.AddedRequirementNames.Count,
                    UncoveredRequirements = diff.AddedRequirementNames
                },
                Trace = new ExplainabilityTrace
                {
                    RulesApplied = ["requirement-cross-run-name-diff"],
                    DecisionsTaken = ["Compared current requirement names to prior committed snapshot metadata."],
                    Notes =
                    [
                        $"Prior: {string.Join(", ", diff.PriorRequirementNames)}",
                        $"Added: {string.Join(", ", diff.AddedRequirementNames)}"
                    ]
                }
            });
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}
