namespace ArchLucid.Persistence.Scim;

/// <summary>
/// RFC 7643 caseExact=true string compares on CI-collated columns: CI equality seeks the index;
/// CS collation on the same parameter filters to exact case without wrapping only the column in COLLATE.
/// </summary>
internal static class SqlScimCaseExactStringSql
{
    internal const string CaseSensitiveCollation = "Latin1_General_CS_AS";

    internal static string Equality(string columnSql, string parameterReference)
    {
        string csColumn = CollationWrap(columnSql, CaseSensitiveCollation);
        string csParameter = CollationWrap(parameterReference, CaseSensitiveCollation);

        return $"{columnSql} = {parameterReference} AND {csColumn} = {csParameter}";
    }

    internal static string NotEqual(string columnSql, string parameterReference)
    {
        return $"NOT ({Equality(columnSql, parameterReference)})";
    }

    internal static string Like(string columnSql, string parameterReference)
    {
        string csColumn = CollationWrap(columnSql, CaseSensitiveCollation);
        string csParameter = CollationWrap(parameterReference, CaseSensitiveCollation);

        return $"{columnSql} LIKE {parameterReference} AND {csColumn} LIKE {csParameter}";
    }

    internal static string OrderedCompare(string columnSql, string parameterReference, string op)
    {
        string csColumn = CollationWrap(columnSql, CaseSensitiveCollation);
        string csParameter = CollationWrap(parameterReference, CaseSensitiveCollation);

        return $"{columnSql} {op} {parameterReference} AND {csColumn} {op} {csParameter}";
    }

    private static string CollationWrap(string expr, string collation) => $"{expr} COLLATE {collation}";
}
