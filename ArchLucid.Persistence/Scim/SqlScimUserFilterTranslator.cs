using ArchLucid.Core.Scim.Filtering;

using Dapper;

namespace ArchLucid.Persistence.Scim;

internal static class SqlScimUserFilterTranslator
{
    // dbo.ScimUsers string columns inherit database default collation (no per-column COLLATE in schema;
    // ArchLucid SQL is CI, typically SQL_Latin1_General_CP1_CI_AS). userName/displayName use plain compares
    // so IX_ScimUsers_TenantId_UserName stays sargable. externalId (RFC caseExact=true) uses seek-then-filter.
    public static string BuildWhere(ScimFilterNode? filter, DynamicParameters parameters, ref int nextParam)
    {
        return filter is null ? "1 = 1" : Build(filter, parameters, ref nextParam);
    }

    private static string Build(ScimFilterNode node, DynamicParameters parameters, ref int nextParam)
    {
        return node switch
        {
            ScimNotNode n => $"NOT ({Build(n.Inner, parameters, ref nextParam)})",
            ScimAndNode a => $"({Build(a.Left, parameters, ref nextParam)}) AND ({Build(a.Right, parameters, ref nextParam)})",
            ScimOrNode o => $"({Build(o.Left, parameters, ref nextParam)}) OR ({Build(o.Right, parameters, ref nextParam)})",
            ScimPresentNode p => $"{ColumnSql(p.AttributePath)} IS NOT NULL",
            ScimComparisonNode c => BuildComparison(c, parameters, ref nextParam),
            _ => throw new InvalidOperationException($"Unsupported filter node {node.GetType().Name}.")
        };
    }

    private static string BuildComparison(ScimComparisonNode c, DynamicParameters parameters, ref int nextParam)
    {
        string col = ColumnSql(c.AttributePath);
        string op = c.Operator.ToLowerInvariant();

        if (string.Equals(c.AttributePath, "active", StringComparison.OrdinalIgnoreCase))
        {
            if (!ScimActiveFilterLiteralParser.TryParseEqualityOperand(c.Value, out bool bit))
                throw new ScimFilterSqlException($"Invalid active filter value '{c.Value}'.");

            string name = NextName(ref nextParam);
            parameters.Add(name, bit ? 1 : 0);

            return op switch
            {
                "eq" => $"{col} = @{name}",
                "ne" => $"{col} <> @{name}",
                "gt" => $"{col} > @{name}",
                "lt" => $"{col} < @{name}",
                "ge" => $"{col} >= @{name}",
                "le" => $"{col} <= @{name}",
                _ => throw new ScimFilterSqlException($"Unsupported operator '{op}' for active.")
            };
        }

        string pName = NextName(ref nextParam);
        string bound = op switch
        {
            "co" => $"%{c.Value}%",
            "sw" => $"{c.Value}%",
            "ew" => $"%{c.Value}",
            _ => c.Value
        };

        parameters.Add(pName, bound);

        bool caseExact = ScimUserFilterAttributeSemantics.IsCaseExact(c.AttributePath);
        string paramRef = "@" + pName;

        return op switch
        {
            "eq" => EqualitySql(col, paramRef, caseExact),
            "ne" => NotEqualSql(col, paramRef, caseExact),
            "co" => LikeSql(col, paramRef, caseExact),
            "sw" => LikeSql(col, paramRef, caseExact),
            "ew" => LikeSql(col, paramRef, caseExact),
            "gt" => OrderedCompareSql(col, paramRef, ">", caseExact),
            "lt" => OrderedCompareSql(col, paramRef, "<", caseExact),
            "ge" => OrderedCompareSql(col, paramRef, ">=", caseExact),
            "le" => OrderedCompareSql(col, paramRef, "<=", caseExact),
            _ => throw new ScimFilterSqlException($"Unsupported operator '{op}'.")
        };
    }

    private static string EqualitySql(string col, string paramRef, bool caseExact)
    {
        if (caseExact)
            return SqlScimCaseExactStringSql.Equality(col, paramRef);

        return $"{col} = {paramRef}";
    }

    private static string NotEqualSql(string col, string paramRef, bool caseExact)
    {
        if (caseExact)
            return SqlScimCaseExactStringSql.NotEqual(col, paramRef);

        return $"{col} <> {paramRef}";
    }

    private static string LikeSql(string col, string paramRef, bool caseExact)
    {
        if (caseExact)
            return SqlScimCaseExactStringSql.Like(col, paramRef);

        return $"{col} LIKE {paramRef}";
    }

    private static string OrderedCompareSql(string col, string paramRef, string op, bool caseExact)
    {
        if (caseExact)
            return SqlScimCaseExactStringSql.OrderedCompare(col, paramRef, op);

        return $"{col} {op} {paramRef}";
    }

    private static string NextName(ref int nextParam)
    {
        nextParam++;

        return $"f{nextParam}";
    }

    private static string ColumnSql(string attributePath)
    {
        string p = attributePath.Trim();

        if (string.Equals(p, "userName", StringComparison.OrdinalIgnoreCase))
            return "u.UserName";

        if (string.Equals(p, "displayName", StringComparison.OrdinalIgnoreCase))

            return "u.DisplayName";

        if (ScimKnownUserFilterPaths.IsEmailsWorkValuePath(p))

            return "u.UserName";

        if (string.Equals(p, "externalId", StringComparison.OrdinalIgnoreCase))

            return "u.ExternalId";

        if (string.Equals(p, "active", StringComparison.OrdinalIgnoreCase))
            return "u.Active";

        return string.Equals(p, "id", StringComparison.OrdinalIgnoreCase) ? "CAST(u.Id AS NVARCHAR(36))" : throw new ScimFilterSqlException($"Unknown attribute '{attributePath}' for SQL translation.");
    }
}
