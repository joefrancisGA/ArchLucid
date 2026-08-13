using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class TopologyStructureFindingEngine : IFindingEngine
{
    public string EngineType => "topology-structure";

    public string Category => "Topology";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        IReadOnlyList<TopologyStructureGap> gaps = TopologyStructureAnalyzer.Analyze(graphSnapshot);
        List<Finding> findings = [];

        foreach (TopologyStructureGap gap in gaps)
        {
            findings.Add(FindingFactory.CreateTopologyGapFinding(
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
