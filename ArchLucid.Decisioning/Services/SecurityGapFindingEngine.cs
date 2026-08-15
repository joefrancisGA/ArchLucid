using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class SecurityGapFindingEngine : IFindingEngine
{
    public string EngineType => "security-gap";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        IReadOnlyList<SecurityTraceabilityGap> gaps = SecurityTraceabilityAnalyzer.Analyze(graphSnapshot);
        List<Finding> findings = [];

        foreach (SecurityTraceabilityGap gap in gaps)
        {
            findings.Add(FindingFactory.CreateSecurityGapFinding(
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
