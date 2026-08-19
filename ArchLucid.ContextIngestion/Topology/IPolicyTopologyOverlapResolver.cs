namespace ArchLucid.ContextIngestion.Topology;

/// <summary>
///     Resolves policy-reference ↔ topology-hint overlap into stable graph node ids (<c>obj-{ObjectId}</c>).
/// </summary>
public interface IPolicyTopologyOverlapResolver
{
    bool Overlaps(string policyReference, string topologyHint);

    string ResolveStableObjectId(string topologyHintName);

    /// <summary>
    ///     Comma-separated <c>obj-{id}</c> values for hints that overlap the policy reference, or null when none.
    /// </summary>
    string? ResolveApplicableTopologyNodeIds(string policyReference, IReadOnlyList<string> topologyHints);
}
