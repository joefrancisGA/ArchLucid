using System.Text.RegularExpressions;

namespace ArchLucid.Analyzers;

internal static class TenantScopedQuerySqlInspector
{
    private static readonly Regex BlockCommentRegex = new(
        @"/\*.*?\*/",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.Singleline);

    private static readonly Regex LineCommentRegex = new(
        @"--[^\r\n]*",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.Multiline);

    private static readonly Regex TopLevelFromJoinRegex = new(
        @"(?:(?:FROM|JOIN)\s+(?:\[?dbo\]?\.)?\[?(?<table>[A-Za-z_][A-Za-z0-9_]*)\]?)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex MutationTargetRegex = new(
        @"(?:UPDATE\s+(?:\[?dbo\]?\.)?\[?(?<update>[A-Za-z_][A-Za-z0-9_]*)\]?|DELETE\s+(?:FROM\s+)?(?:\[?dbo\]?\.)?\[?(?<delete>[A-Za-z_][A-Za-z0-9_]*)\]?|INSERT\s+INTO\s+(?:\[?dbo\]?\.)?\[?(?<insert>[A-Za-z_][A-Za-z0-9_]*)\]?|MERGE\s+(?:\[?dbo\]?\.)?\[?(?<merge>[A-Za-z_][A-Za-z0-9_]*)\]?)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex TenantIdPredicateRegex = new(
        @"TenantId\s*=\s*@(TenantId|ScopeTenantId)\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex TripleScopePredicateRegex = new(
        @"TenantId\s*=\s*@(TenantId|ScopeTenantId)[\s\S]*?WorkspaceId\s*=\s*@(WorkspaceId|ScopeWorkspaceId)[\s\S]*?(?:ScopeProjectId|ProjectId)\s*=\s*@(ScopeProjectId|ProjectId)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex RunChildJoinMarkerRegex = new(
        @"INNER\s+JOIN\s+dbo\.Runs\s+run_scope\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex RunChildScopeWhereRegex = new(
        @"run_scope\.TenantId\s*=\s*@TenantId\b[\s\S]*?run_scope\.WorkspaceId\s*=\s*@WorkspaceId\b[\s\S]*?run_scope\.ScopeProjectId\s*=\s*@ScopeProjectId\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex RepositoryScopePredicateMarkerRegex = new(
        @"TenantId\s*=\s*@ScopeTenantId\b[\s\S]*?WorkspaceId\s*=\s*@ScopeWorkspaceId\b[\s\S]*?(ScopeProjectId|ProjectId)\s*=\s*@ScopeProjectId\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    internal static bool HasRecognizedScopeHelperMarkers(string sqlText) =>
        RunChildJoinMarkerRegex.IsMatch(StripSqlComments(sqlText)) ||
        RunChildScopeWhereRegex.IsMatch(StripSqlComments(sqlText)) ||
        RepositoryScopePredicateMarkerRegex.IsMatch(StripSqlComments(sqlText));

    internal static bool HasTenantIdScopePredicate(string sqlText) =>
        TenantIdPredicateRegex.IsMatch(StripSqlComments(sqlText));

    internal static bool HasTripleScopePredicate(string sqlText) =>
        TripleScopePredicateRegex.IsMatch(StripSqlComments(sqlText)) ||
        RunChildScopeWhereRegex.IsMatch(StripSqlComments(sqlText)) ||
        RepositoryScopePredicateMarkerRegex.IsMatch(StripSqlComments(sqlText));

    internal static bool InsertIncludesTenantIdColumn(string sqlText, string normalizedTableName)
    {
        string bareName = normalizedTableName.Substring("dbo.".Length);

        Match insertMatch = Regex.Match(
            sqlText,
            $@"INSERT\s+INTO\s+(?:\[?dbo\]?\.)?\[?{Regex.Escape(bareName)}\]?\s*\((?<cols>[\s\S]*?)\)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (!insertMatch.Success)
            return false;

        string columns = insertMatch.Groups["cols"].Value;

        return Regex.IsMatch(columns, @"\bTenantId\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    internal static IReadOnlyList<string> GetTopLevelScopedTargets(string sqlText)
    {
        if (string.IsNullOrWhiteSpace(sqlText))
            return Array.Empty<string>();

        string scrubbed = StripSqlComments(sqlText);
        int subqueryStart = FindFirstSubqueryStart(scrubbed);
        string mainStatement = subqueryStart >= 0 ? scrubbed.Substring(0, subqueryStart) : scrubbed;
        HashSet<string> tables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in MutationTargetRegex.Matches(mainStatement))
        {
            string? raw = match.Groups["update"].Success ? match.Groups["update"].Value
                : match.Groups["delete"].Success ? match.Groups["delete"].Value
                : match.Groups["insert"].Success ? match.Groups["insert"].Value
                : match.Groups["merge"].Success ? match.Groups["merge"].Value
                : null;

            if (raw is null)
                continue;

            string? normalized = TenantScopedTableRegistry.NormalizeTableName(raw);

            if (normalized is not null)
                tables.Add(normalized);
        }

        foreach (Match match in TopLevelFromJoinRegex.Matches(mainStatement))
        {
            string? normalized = TenantScopedTableRegistry.NormalizeTableName(match.Groups["table"].Value);

            if (normalized is not null)
                tables.Add(normalized);
        }

        return tables.ToList();
    }

    internal static bool IsScopeBoundForTable(
        string sqlText,
        string normalizedTableName,
        bool requiresTripleScope,
        bool hasScopeHelperInvocation)
    {
        string scrubbed = StripSqlComments(sqlText);

        if (hasScopeHelperInvocation || HasRecognizedScopeHelperMarkers(scrubbed))
            return true;

        if (InsertIncludesTenantIdColumn(scrubbed, normalizedTableName))
            return true;

        if (MergeIncludesTenantIdOnClause(scrubbed, normalizedTableName))
            return true;

        if (IsPrimaryKeyScopedMutation(scrubbed))
            return true;

        if (IsSingleSurrogateKeyRead(scrubbed))
            return true;

        if (requiresTripleScope)
        {
            if (HasTripleScopePredicate(scrubbed))
                return true;

            if (HasTenantIdScopePredicate(scrubbed) && HasCompoundWhereClause(scrubbed))
                return true;

            return false;
        }

        return HasTenantIdScopePredicate(scrubbed) || HasTripleScopePredicate(scrubbed);
    }

    internal static string StripSqlComments(string sqlText)
    {
        if (string.IsNullOrEmpty(sqlText))
            return sqlText;

        string withoutBlock = BlockCommentRegex.Replace(sqlText, " ");
        return LineCommentRegex.Replace(withoutBlock, " ");
    }

    internal static bool MergeIncludesTenantIdOnClause(string sqlText, string normalizedTableName)
    {
        string bareName = normalizedTableName.Substring("dbo.".Length);

        if (!Regex.IsMatch(
                sqlText,
                $@"MERGE\s+(?:\[?dbo\]?\.)?\[?{Regex.Escape(bareName)}\]?",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            return false;

        return Regex.IsMatch(
            sqlText,
            @"\bON\b[\s\S]*?TenantId\s*=\s*(?:@(TenantId|ScopeTenantId)\b|[A-Za-z_][A-Za-z0-9_]*\.TenantId\b)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    internal static bool HasCompoundWhereClause(string sqlText)
    {
        Match whereMatch = Regex.Match(
            sqlText,
            @"\bWHERE\s+(?<clause>[\s\S]+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (!whereMatch.Success)
            return false;

        string clause = NormalizeWhereClause(whereMatch.Groups["clause"].Value);

        return clause.Contains(" AND ", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeWhereClause(string clause)
    {
        Match terminator = Regex.Match(
            clause,
            @"\b(ORDER\s+BY|GROUP\s+BY|HAVING|OPTION\s+\(|FOR\s+JSON|FOR\s+XML)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (terminator.Success)
            clause = clause.Substring(0, terminator.Index);

        return clause.Trim().TrimEnd(';').Trim();
    }

    /// <summary>
    ///     SELECT constrained to a single surrogate-key predicate (tenant catalog + unguessable id discipline).
    /// </summary>
    internal static bool IsSingleSurrogateKeyRead(string sqlText)
    {
        if (string.IsNullOrWhiteSpace(sqlText))
            return false;

        if (!Regex.IsMatch(sqlText, @"^\s*SELECT\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            return false;

        Match whereMatch = Regex.Match(
            sqlText,
            @"\bWHERE\s+(?<clause>[\s\S]+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (!whereMatch.Success)
            return false;

        return IsSurrogateKeyWhereClause(NormalizeWhereClause(whereMatch.Groups["clause"].Value));
    }

    private static bool IsSurrogateKeyWhereClause(string clause)
    {
        string[] parts = Regex.Split(clause, @"\s+AND\s+", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (parts.Length == 0)
            return false;

        bool hasKeyEquality = false;

        foreach (string part in parts)
        {
            string trimmedPart = part.Trim();

            if (Regex.IsMatch(
                    trimmedPart,
                    @"^[A-Za-z_][A-Za-z0-9_]*\s*=\s*@[A-Za-z_][A-Za-z0-9_]*$",
                    RegexOptions.CultureInvariant))
            {
                hasKeyEquality = true;

                continue;
            }

            if (Regex.IsMatch(
                    trimmedPart,
                    @"^[A-Za-z_][A-Za-z0-9_]*\s+IS\s+(?:NOT\s+)?NULL$",
                    RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
                continue;

            if (Regex.IsMatch(
                    trimmedPart,
                    @"^IsDeleted\s*=\s*0$",
                    RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
                continue;

            return false;
        }

        return hasKeyEquality;
    }

    /// <summary>
    ///     UPDATE/DELETE constrained to a single surrogate-key predicate (tenant catalog + PK discipline).
    /// </summary>
    internal static bool IsPrimaryKeyScopedMutation(string sqlText)
    {
        if (string.IsNullOrWhiteSpace(sqlText))
            return false;

        if (!Regex.IsMatch(sqlText, @"^\s*(UPDATE|DELETE)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            return false;

        Match whereMatch = Regex.Match(
            sqlText,
            @"\bWHERE\s+(?<clause>[\s\S]+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (!whereMatch.Success)
            return false;

        string clause = NormalizeWhereClause(whereMatch.Groups["clause"].Value);

        if (clause.Contains(" AND ", StringComparison.OrdinalIgnoreCase) ||
            clause.Contains(" OR ", StringComparison.OrdinalIgnoreCase))
            return false;

        return Regex.IsMatch(
            clause,
            @"^[A-Za-z_][A-Za-z0-9_]*\s*=\s*@[A-Za-z_][A-Za-z0-9_]*$",
            RegexOptions.CultureInvariant);
    }

    private static int FindFirstSubqueryStart(string sqlText)
    {
        int depth = 0;
        int length = sqlText.Length;

        for (int index = 0; index < length; index++)
        {
            char current = sqlText[index];

            if (current == '(')
            {
                depth++;

                if (index + 7 <= length &&
                    sqlText.AsSpan(index, 7).Equals("(SELECT".AsSpan(), StringComparison.OrdinalIgnoreCase))
                    return index;

                continue;
            }

            if (current == ')' && depth > 0)
                depth--;
        }

        return -1;
    }
}
