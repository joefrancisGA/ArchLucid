using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Architecture;

public sealed partial class ArchitectureRunProvenanceService
{
    private static void AddSnapshotNodes(ArchitectureRun run, string runNodeId, Action<ArchitectureLinkageNode> addNode,
        Action<string, string, string, Dictionary<string, string>?> addEdge)
    {
        if (!string.IsNullOrWhiteSpace(run.ContextSnapshotId))
        {
            string id = $"ctx:{run.ContextSnapshotId}";
            addNode(new ArchitectureLinkageNode
            {
                Id = id,
                Type = ArchitectureLinkageKinds.Nodes.ContextSnapshot,
                ReferenceId = run.ContextSnapshotId,
                Name = "Context snapshot",
                Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            });
            addEdge(ArchitectureLinkageKinds.Edges.RunReferencesSnapshot, runNodeId, id, null);
        }

        if (run.GraphSnapshotId is { } graphId)
        {
            string id = $"graph:{graphId:N}";
            addNode(new ArchitectureLinkageNode
            {
                Id = id,
                Type = ArchitectureLinkageKinds.Nodes.GraphSnapshot,
                ReferenceId = graphId.ToString("N"),
                Name = "Graph snapshot",
                Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            });
            addEdge(ArchitectureLinkageKinds.Edges.RunReferencesSnapshot, runNodeId, id, null);
        }

        if (run.FindingsSnapshotId is { } findingsId)
        {
            string id = $"findings:{findingsId:N}";
            addNode(new ArchitectureLinkageNode
            {
                Id = id,
                Type = ArchitectureLinkageKinds.Nodes.FindingsSnapshot,
                ReferenceId = findingsId.ToString("N"),
                Name = "Findings snapshot",
                Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            });
            addEdge(ArchitectureLinkageKinds.Edges.RunReferencesSnapshot, runNodeId, id, null);
        }

        if (run.GoldenManifestId is { } goldenId)
        {
            string id = $"goldenPointer:{goldenId:N}";
            addNode(new ArchitectureLinkageNode
            {
                Id = id,
                Type = ArchitectureLinkageKinds.Nodes.GoldenManifestPointer,
                ReferenceId = goldenId.ToString("N"),
                Name = "Golden manifest pointer",
                Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            });
            addEdge(ArchitectureLinkageKinds.Edges.RunReferencesSnapshot, runNodeId, id, null);
        }

        if (run.ArtifactBundleId is not { } artifactBundleId)
            return;
        {
            string id = $"artifactBundle:{artifactBundleId:N}";
            addNode(new ArchitectureLinkageNode
            {
                Id = id,
                Type = ArchitectureLinkageKinds.Nodes.ArtifactBundle,
                ReferenceId = artifactBundleId.ToString("N"),
                Name = "Artifact bundle",
                Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            });
            addEdge(ArchitectureLinkageKinds.Edges.RunReferencesSnapshot, runNodeId, id, null);
        }
    }
}
