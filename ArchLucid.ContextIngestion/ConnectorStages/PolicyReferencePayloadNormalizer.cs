using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class PolicyReferencePayloadNormalizer(IPolicyTopologyOverlapResolver overlapResolver)
    : IConnectorNormalizer<PolicyReferencePayload>
{
    private readonly IPolicyTopologyOverlapResolver _overlapResolver =
        overlapResolver ?? throw new ArgumentNullException(nameof(overlapResolver));

    /// <summary>Must match <c>CanonicalGraphPropertyKeys.ApplicableTopologyNodeIds</c> in the knowledge-graph project.</summary>
    private const string ApplicableTopologyNodeIdsKey = "applicableTopologyNodeIds";

    public Task<NormalizedContextBatch> NormalizeAsync(
        PolicyReferencePayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);
        _ = ct;

        NormalizedContextBatch batch = new();

        foreach (string policy in payload.PolicyReferences)
        {
            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
            {
                ["reference"] = policy, ["status"] = "referenced"
            };

            string? targeted = _overlapResolver.ResolveApplicableTopologyNodeIds(policy, payload.TopologyHints);

            if (!string.IsNullOrWhiteSpace(targeted))
                properties[ApplicableTopologyNodeIdsKey] = targeted;

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectType = "PolicyControl",
                Name = policy,
                SourceType = "PolicyReference",
                SourceId = policy,
                Properties = properties
            });
        }

        return Task.FromResult(batch);
    }
}
