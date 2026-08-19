using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Payload equality used by confluent merge: FindingType, Title, Severity, Rationale, Category (ordinal).
/// </summary>
internal sealed class FindingPayloadOrdinalEqualityComparer : IEqualityComparer<Finding>
{
    public static FindingPayloadOrdinalEqualityComparer Instance { get; } = new();

    public bool Equals(Finding? x, Finding? y)
    {
        if (ReferenceEquals(x, y))
            return true;

        if (x is null || y is null)
            return false;

        return string.Equals(x.FindingType, y.FindingType, StringComparison.Ordinal)
               && string.Equals(x.Title, y.Title, StringComparison.Ordinal)
               && x.Severity == y.Severity
               && string.Equals(x.Rationale, y.Rationale, StringComparison.Ordinal)
               && string.Equals(x.Category, y.Category, StringComparison.Ordinal);
    }

    public int GetHashCode(Finding obj)
    {
        ArgumentNullException.ThrowIfNull(obj);

        return HashCode.Combine(obj.FindingType, obj.Title, obj.Severity, obj.Rationale, obj.Category);
    }
}
