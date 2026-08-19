using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Single-pass index of findings by <see cref="Finding.FindingId" /> for manifest builders (TB-589).
/// </summary>
public sealed class FindingsSnapshotIdIndex
{
    private readonly Dictionary<string, Finding> _byId;

    public FindingsSnapshotIdIndex(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        _byId = new Dictionary<string, Finding>(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in snapshot.Findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
                continue;

            _byId[finding.FindingId] = finding;
        }
    }

    public bool TryGet(string findingId, out Finding? finding)
    {
        if (string.IsNullOrWhiteSpace(findingId))
        {
            finding = null;

            return false;
        }

        return _byId.TryGetValue(findingId, out finding);
    }
}
