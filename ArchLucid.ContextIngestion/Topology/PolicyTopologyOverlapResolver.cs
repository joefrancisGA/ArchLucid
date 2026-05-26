namespace ArchLucid.ContextIngestion.Topology;

/// <inheritdoc cref="IPolicyTopologyOverlapResolver" />
public sealed class PolicyTopologyOverlapResolver : IPolicyTopologyOverlapResolver
{
    public bool Overlaps(string policyReference, string topologyHint)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(policyReference);
        ArgumentException.ThrowIfNullOrWhiteSpace(topologyHint);

        return topologyHint.Contains(policyReference, StringComparison.OrdinalIgnoreCase)
               || policyReference.Contains(topologyHint, StringComparison.OrdinalIgnoreCase);
    }

    public string ResolveStableObjectId(string topologyHintName)
    {
        return TopologyHintStableObjectIds.FromHintName(topologyHintName);
    }

    public string? ResolveApplicableTopologyNodeIds(string policyReference, IReadOnlyList<string> topologyHints)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(policyReference);
        ArgumentNullException.ThrowIfNull(topologyHints);

        if (topologyHints.Count == 0)
            return null;

        HashSet<string> ids = [];

        foreach (string hint in topologyHints)
        {
            if (string.IsNullOrWhiteSpace(hint))
                continue;

            string trimmed = hint.Trim();

            if (!Overlaps(policyReference, trimmed))
                continue;

            ids.Add($"obj-{ResolveStableObjectId(trimmed)}");
        }

        return ids.Count == 0 ? null : string.Join(',', ids);
    }
}
