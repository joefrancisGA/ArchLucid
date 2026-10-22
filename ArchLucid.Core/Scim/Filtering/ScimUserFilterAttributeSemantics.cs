namespace ArchLucid.Core.Scim.Filtering;

/// <summary>
/// RFC 7643 User schema string attribute comparison rules (caseExact).
/// </summary>
public static class ScimUserFilterAttributeSemantics
{
    /// <summary>
    /// <c>externalId</c> is caseExact=true; other filterable user string attributes are case-insensitive.
    /// </summary>
    public static bool IsCaseExact(string attributePath)
    {
        return string.Equals(attributePath.Trim(), "externalId", StringComparison.OrdinalIgnoreCase);
    }

    public static StringComparison StringComparisonFor(string attributePath)
    {
        return IsCaseExact(attributePath) ? StringComparison.Ordinal : StringComparison.OrdinalIgnoreCase;
    }
}
