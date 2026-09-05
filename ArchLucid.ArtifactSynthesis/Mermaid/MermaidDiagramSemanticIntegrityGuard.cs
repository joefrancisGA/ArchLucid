using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramSemanticIntegrityGuard : IMermaidDiagramSemanticIntegrityGuard
{
    public bool TryValidateRepair(
        DiagramAst original,
        DiagramAst repaired,
        IReadOnlyList<Guid> requiredCloudResourceIds,
        out MermaidDiagramCollapseReport collapseReport)
    {
        ArgumentNullException.ThrowIfNull(original);
        ArgumentNullException.ThrowIfNull(repaired);

        HashSet<Guid> required = requiredCloudResourceIds.ToHashSet();
        HashSet<Guid> repairedResourceIds = repaired.Nodes
            .Where(node => node.CloudResourceId is not null)
            .Select(node => node.CloudResourceId!.Value)
            .ToHashSet();

        List<MermaidDiagramCollapseEntry> entries = [];

        foreach (Guid requiredId in required)
        {
            if (!repairedResourceIds.Contains(requiredId))
            {
                entries.Add(new MermaidDiagramCollapseEntry
                {
                    Kind = "RequiredCloudResourceDropped",
                    CloudResourceId = requiredId,
                    Reason = "AI repair removed a required CloudResourceId without an approved collapse report.",
                });
            }
        }

        collapseReport = new MermaidDiagramCollapseReport { Entries = entries };

        return entries.Count == 0;
    }
}
