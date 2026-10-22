using System.Text.RegularExpressions;

namespace ArchLucid.Analyzers;

internal sealed class TenantScopedTableRegistry
{
    private static readonly Regex TableNameRegex = new(
        @"^dbo\.([A-Za-z_][A-Za-z0-9_]*)$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex JsonTripleArrayRegex = new(
        @"""scopeTripleOnRow""\s*:\s*\[(?<triple>[^\]]*)\]",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Singleline);

    private static readonly Regex JsonTenantArrayRegex = new(
        @"""tenantIdOnRow""\s*:\s*\[(?<tenant>[^\]]*)\]",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Singleline);

    private static readonly Regex JsonQuotedValueRegex = new(
        @"""dbo\.([A-Za-z_][A-Za-z0-9_]*)""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly HashSet<string> _scopeTripleOnRow;
    private readonly HashSet<string> _tenantIdOnRow;

    private TenantScopedTableRegistry(HashSet<string> scopeTripleOnRow, HashSet<string> tenantIdOnRow)
    {
        _scopeTripleOnRow = scopeTripleOnRow;
        _tenantIdOnRow = tenantIdOnRow;
    }

    internal static TenantScopedTableRegistry Empty { get; } = new(new HashSet<string>(), new HashSet<string>());

    internal static TenantScopedTableRegistry LoadFromAdditionalFile(string? jsonText)
    {
        if (string.IsNullOrWhiteSpace(jsonText))
            return Empty;

        Match tripleMatch = JsonTripleArrayRegex.Match(jsonText);
        Match tenantMatch = JsonTenantArrayRegex.Match(jsonText);

        if (!tripleMatch.Success && !tenantMatch.Success)
            return Empty;

        HashSet<string> triple = tripleMatch.Success
            ? ParseTableArray(tripleMatch.Groups["triple"].Value)
            : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        HashSet<string> tenant = tenantMatch.Success
            ? ParseTableArray(tenantMatch.Groups["tenant"].Value)
            : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        return new TenantScopedTableRegistry(triple, tenant);
    }

    internal bool RequiresTripleScope(string normalizedTableName) =>
        _scopeTripleOnRow.Contains(normalizedTableName);

    internal bool RequiresTenantIdScope(string normalizedTableName) =>
        _tenantIdOnRow.Contains(normalizedTableName);

    internal bool IsTenantScoped(string normalizedTableName) =>
        RequiresTripleScope(normalizedTableName) || RequiresTenantIdScope(normalizedTableName);

    internal static string? NormalizeTableName(string rawTableName)
    {
        if (string.IsNullOrWhiteSpace(rawTableName))
            return null;

        string trimmed = rawTableName.Trim();

        if (trimmed.StartsWith("[", StringComparison.Ordinal) && trimmed.EndsWith("]", StringComparison.Ordinal))
            trimmed = trimmed.Substring(1, trimmed.Length - 2);

        if (trimmed.StartsWith("dbo.", StringComparison.OrdinalIgnoreCase))
            trimmed = "dbo." + trimmed.Substring(4);

        if (!trimmed.StartsWith("dbo.", StringComparison.OrdinalIgnoreCase))
            trimmed = "dbo." + trimmed;

        Match match = TableNameRegex.Match(trimmed);

        return match.Success ? match.Value : null;
    }

    private static HashSet<string> ParseTableArray(string arrayBody)
    {
        HashSet<string> tables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in JsonQuotedValueRegex.Matches(arrayBody))
        {
            string? normalized = NormalizeTableName(match.Groups[1].Value);

            if (normalized is not null)
                tables.Add(normalized);
        }

        return tables;
    }
}
