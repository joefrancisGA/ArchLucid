using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class TopologyHintsPayloadNormalizer(IPolicyTopologyOverlapResolver overlapResolver) : IConnectorNormalizer<TopologyHintsPayload>
{
    private readonly IPolicyTopologyOverlapResolver _overlapResolver =
        overlapResolver ?? throw new ArgumentNullException(nameof(overlapResolver));

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

            if (trimmed.Length == 0)
                continue;

            string canonicalHint = TopologyHintStableObjectIds.CanonicalizeHintName(trimmed).ToLowerInvariant();
            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase) { ["text"] = canonicalHint };

            int slash = canonicalHint.IndexOf('/');

            if (slash > 0 && slash < canonicalHint.Length - 1)
            {
                string parentName = canonicalHint[..slash];
                string childRemainder = canonicalHint[(slash + 1)..];

                if (parentName.Length > 0 && childRemainder.Length > 0)
                {
                    // parentNodeId must match GraphNodeFactory: obj-{CanonicalObject.ObjectId}
                    string parentObjId = _overlapResolver.ResolveStableObjectId(parentName);
                    properties["parentNodeId"] = $"obj-{parentObjId}";
                }
            }

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectId = _overlapResolver.ResolveStableObjectId(canonicalHint),
                ObjectType = "TopologyResource",
                Name = canonicalHint,
                SourceType = "TopologyHint",
                SourceId = "topology-hint",
                Properties = properties
            });
        }

        return Task.FromResult(batch);
    }
}
