namespace ArchLucid.Contracts.Governance;

/// <summary>
///     One time bucket of policy-pack change activity used for compliance drift trend visualization.
/// </summary>
public sealed class ComplianceDriftTrendPoint
{
    /// <summary>UTC start of the bucket (inclusive).</summary>
    public DateTime BucketUtc
    {
        get;
        init;
    }

    /// <summary>Total change log entries in this bucket.</summary>
    public int ChangeCount
    {
        get;
        init;
    }

    /// <summary>Counts keyed by <see cref="PolicyPackChangeLogEntry.ChangeType" />.</summary>
    public IReadOnlyDictionary<string, int> ChangesByType
    {
        get;
        init;
    } =
        new Dictionary<string, int>(StringComparer.Ordinal);
}
