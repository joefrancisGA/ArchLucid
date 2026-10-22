namespace ArchLucid.ContextIngestion.Topology;

/// <inheritdoc cref="IPolicyTopologyOverlapResolver" />
public sealed class PolicyTopologyOverlapResolver : IPolicyTopologyOverlapResolver
{
    public bool Overlaps(string policyReference, string topologyHint)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(policyReference);
        ArgumentException.ThrowIfNullOrWhiteSpace(topologyHint);

        string canonicalPolicy = TopologyHintStableObjectIds.CanonicalizeHintName(policyReference.Trim());
        string canonicalHint = TopologyHintStableObjectIds.CanonicalizeHintName(topologyHint.Trim());

        if (string.Equals(canonicalPolicy, canonicalHint, StringComparison.OrdinalIgnoreCase))
            return true;

        return IsDelimitedPrefix(canonicalPolicy, canonicalHint)
               || IsDelimitedPrefix(canonicalHint, canonicalPolicy)
               || IsDelimitedSuffix(canonicalPolicy, canonicalHint)
               || IsDelimitedSuffix(canonicalHint, canonicalPolicy);
    }

    private static bool IsDelimitedPrefix(string prefix, string value)
    {
        if (value.Length <= prefix.Length)
            return false;

        if (!value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        char boundary = value[prefix.Length];

        return boundary is '/' or '-';
    }

    private static bool IsDelimitedSuffix(string suffix, string value)
    {
        if (value.Length <= suffix.Length)
            return false;

        if (!value.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
            return false;

        char boundary = value[value.Length - suffix.Length - 1];

        return boundary is '/' or '-';
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

            string canonicalHint = TopologyHintStableObjectIds.CanonicalizeHintName(trimmed).ToLowerInvariant();
            ids.Add($"obj-{ResolveStableObjectId(canonicalHint)}");
        }

        if (ids.Count == 0)
            return null;

        return string.Join(',', ids.OrderBy(static id => id, StringComparer.OrdinalIgnoreCase));
    }
}
