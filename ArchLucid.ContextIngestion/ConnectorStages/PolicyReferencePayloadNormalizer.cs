using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class PolicyReferencePayloadNormalizer : IConnectorNormalizer<PolicyReferencePayload>
{
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

            string? targeted = BuildApplicableTopologyNodeIds(policy, payload.TopologyHints);

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

    /// <summary>
    ///     When a topology hint name overlaps the policy reference (substring, case-insensitive),
    ///     links the policy to <c>obj-{stableId}</c> for that hint so graph inference can narrow <c>APPLIES_TO</c>.
    /// </summary>
    private static string? BuildApplicableTopologyNodeIds(
        string policyReference,
        IReadOnlyList<string> topologyHints)
    {
        if (topologyHints.Count == 0)
            return null;

        HashSet<string> ids = [];

        foreach (string? trimmed in from hint in topologyHints
                 where !string.IsNullOrWhiteSpace(hint)
                 select hint.Trim()
                 into trimmed
                 where PolicyReferenceOverlapsTopology(policyReference, trimmed)
                 select trimmed)

            ids.Add($"obj-{TopologyHintStableObjectIds.FromHintName(trimmed)}");


        return ids.Count == 0 ? null : string.Join(',', ids);
    }

    private static bool PolicyReferenceOverlapsTopology(string policyReference, string topologyHint)
    {
        return topologyHint.Contains(policyReference, StringComparison.OrdinalIgnoreCase)
               || policyReference.Contains(topologyHint, StringComparison.OrdinalIgnoreCase);
    }
}
