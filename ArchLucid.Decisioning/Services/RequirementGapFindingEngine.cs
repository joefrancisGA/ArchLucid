using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class RequirementGapFindingEngine : IFindingEngine
{
    public string EngineType => "requirement-gap";

    public string Category => "Requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        IReadOnlyList<RequirementTraceabilityGap> gaps = RequirementTraceabilityAnalyzer.Analyze(graphSnapshot);
        List<Finding> findings = [];

        foreach (RequirementTraceabilityGap gap in gaps)
        {
            findings.Add(FindingFactory.CreateRequirementGapFinding(
                EngineType,
                gap.Title,
                gap.Rationale,
                gap.GapCode,
                gap.Description,
                gap.Impact,
                FindingSeverity.Warning,
                gap.RelatedNodeIds));
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}
