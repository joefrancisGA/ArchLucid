using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;
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
        HashSet<string> seenReferences = new(StringComparer.OrdinalIgnoreCase);

        foreach (string policy in payload.PolicyReferences)
        {
            if (string.IsNullOrWhiteSpace(policy))
                continue;

            string trimmed = policy.Trim();
            string canonicalReference = trimmed.ToLowerInvariant();

            if (!seenReferences.Add(canonicalReference))
                continue;

            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
            {
                ["reference"] = canonicalReference, ["status"] = "referenced"
            };

            string? targeted = _overlapResolver.ResolveApplicableTopologyNodeIds(trimmed, payload.TopologyHints);

            if (!string.IsNullOrWhiteSpace(targeted))
                properties[ApplicableTopologyNodeIdsKey] = targeted;

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectId = ContextIngestionStableLineNames.StableObjectId("PolicyControl", canonicalReference),
                ObjectType = "PolicyControl",
                Name = canonicalReference,
                SourceType = "PolicyReference",
                SourceId = canonicalReference,
                Properties = properties
            });
        }

        return Task.FromResult(batch);
    }
}
