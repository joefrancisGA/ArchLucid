using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Single-pass index of findings by <see cref="Finding.FindingType" /> for manifest builders (TB-589).
/// </summary>
public sealed class FindingsSnapshotTypeIndex
{
    private readonly Dictionary<string, List<Finding>> _byType;

    public FindingsSnapshotTypeIndex(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        _byType = new Dictionary<string, List<Finding>>(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in snapshot.Findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingType))
                continue;

            if (!_byType.TryGetValue(finding.FindingType, out List<Finding>? bucket))
            {
                bucket = [];
                _byType[finding.FindingType] = bucket;
            }

            bucket.Add(finding);
        }
    }

    public IReadOnlyList<Finding> GetByType(string findingType)
    {
        if (string.IsNullOrWhiteSpace(findingType))
            return Array.Empty<Finding>();

        if (_byType.TryGetValue(findingType, out List<Finding>? bucket))
            return bucket;

        return Array.Empty<Finding>();
    }
}
