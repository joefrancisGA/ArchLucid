using System.Text.Json;
using System.Text.RegularExpressions;

namespace ArchLucid.Architecture.Tests;
[Trait("Category", "Architecture")]

public sealed class TenantScopedTablesJsonParityTests
{
    private static readonly Regex BacktickTablePattern = new(
        @"`(?:dbo\.)?([A-Za-z_][A-Za-z0-9_]*)`",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Tenant_scoped_tables_json_matches_classification_matrix_buckets()
    {
        string matrixText = File.ReadAllText(GetRepoPath("docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md"));
        string jsonText = File.ReadAllText(GetRepoPath("scripts/ci/data/tenant_scoped_tables.v1.json"));

        IReadOnlySet<string> expectedTriple = ParseBucket(matrixText, "scope-triple-on-row");
        IReadOnlySet<string> expectedTenant = ParseBucket(matrixText, "tenant-id-on-row");

        using JsonDocument document = JsonDocument.Parse(jsonText);
        JsonElement root = document.RootElement;

        IReadOnlySet<string> actualTriple = ParseJsonArray(root, "scopeTripleOnRow");
        IReadOnlySet<string> actualTenant = ParseJsonArray(root, "tenantIdOnRow");

        Assert.Equal(expectedTriple, actualTriple);
        Assert.Equal(expectedTenant, actualTenant);
    }

    private static IReadOnlySet<string> ParseBucket(string matrixText, string classification)
    {
        HashSet<string> tables = new(StringComparer.OrdinalIgnoreCase);

        foreach (string line in matrixText.Split('\n'))
        {
            string trimmed = line.Trim();

            if (!trimmed.StartsWith('|'))
                continue;

            string[] cells = trimmed.Trim('|').Split('|');

            if (cells.Length < 2)
                continue;

            if (!string.Equals(cells[0].Trim().Trim('`'), classification, StringComparison.Ordinal))
                continue;

            foreach (Match match in BacktickTablePattern.Matches(cells[1]))
                tables.Add($"dbo.{match.Groups[1].Value}");
        }

        return tables;
    }

    private static IReadOnlySet<string> ParseJsonArray(JsonElement root, string propertyName)
    {
        HashSet<string> tables = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement element in root.GetProperty(propertyName).EnumerateArray())
            tables.Add(element.GetString()!);

        return tables;
    }

    private static string GetRepoPath(string relativePath) =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", relativePath));
}
