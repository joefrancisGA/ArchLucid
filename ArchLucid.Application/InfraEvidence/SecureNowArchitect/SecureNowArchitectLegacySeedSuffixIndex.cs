namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Indexes seed ARM ids for legacy prefixed node suffix matching without scanning every seed per node.</summary>
internal sealed class SecureNowArchitectLegacySeedSuffixIndex
{
    private readonly Dictionary<int, HashSet<string>> _seedsByLength = new();
    private readonly HashSet<string> _seedSuffixes = new(StringComparer.OrdinalIgnoreCase);

    public SecureNowArchitectLegacySeedSuffixIndex(IReadOnlyList<string> seedArmIds)
    {
        ArgumentNullException.ThrowIfNull(seedArmIds);

        foreach (string armId in seedArmIds)
        {
            if (string.IsNullOrWhiteSpace(armId))
            {
                continue;
            }

            if (!_seedsByLength.TryGetValue(armId.Length, out HashSet<string>? byLength))
            {
                byLength = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                _seedsByLength[armId.Length] = byLength;
            }

            byLength.Add(armId);

            for (int start = 0; start < armId.Length; start++)
            {
                _seedSuffixes.Add(armId[start..]);
            }
        }
    }

    public bool MatchesLegacyPrefixedNode(string node)
    {
        if (_seedSuffixes.Contains(node))
        {
            return true;
        }

        foreach ((int length, HashSet<string> seeds) in _seedsByLength)
        {
            if (node.Length < length)
            {
                continue;
            }

            if (seeds.Contains(node.Substring(node.Length - length, length)))
            {
                return true;
            }
        }

        return false;
    }
}
