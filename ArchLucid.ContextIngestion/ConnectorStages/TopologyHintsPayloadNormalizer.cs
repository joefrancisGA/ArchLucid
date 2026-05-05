using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class TopologyHintsPayloadNormalizer : IConnectorNormalizer<TopologyHintsPayload>
{
    public Task<NormalizedContextBatch> NormalizeAsync(
        TopologyHintsPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);
        _ = ct;

        NormalizedContextBatch batch = new();

        foreach (string hint in payload.TopologyHints)
        {
            string trimmed = hint.Trim();
            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase) { ["text"] = trimmed };

            int slash = trimmed.IndexOf('/');

            if (slash > 0 && slash < trimmed.Length - 1)
            {
                string parentName = trimmed[..slash].Trim();
                string childRemainder = trimmed[(slash + 1)..].Trim();

                if (parentName.Length > 0 && childRemainder.Length > 0)
                {
                    // parentNodeId must match GraphNodeFactory: obj-{CanonicalObject.ObjectId}
                    string parentObjId = TopologyHintStableObjectIds.FromHintName(parentName);
                    properties["parentNodeId"] = $"obj-{parentObjId}";
                }
            }

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectId = TopologyHintStableObjectIds.FromHintName(trimmed),
                ObjectType = "TopologyResource",
                Name = trimmed,
                SourceType = "TopologyHint",
                SourceId = "topology-hint",
                Properties = properties
            });
        }

        return Task.FromResult(batch);
    }
}
