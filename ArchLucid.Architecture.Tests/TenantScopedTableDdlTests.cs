using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// Lightweight DDL guard: hot authority table includes full tenant scope triple (see <c>docs/DATA_MODEL.md</c>).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantScopedTableDdlTests
{
    [Fact]
    public void ArchLucid_sql_Runs_create_table_includes_TenantId_WorkspaceId_ProjectId_columns()
    {
        string path = ResolveArchLucidSqlPath();
        string sql = File.ReadAllText(path);

        Match m = Regex.Match(
            sql,
            @"CREATE\s+TABLE\s+(?:\[dbo\]\.\[Runs\]|dbo\.Runs)\s*\(",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        m.Success.Should().BeTrue("ArchLucid.sql should define dbo.Runs");

        int start = m.Index;
        int depth = 0;
        int end = start;

        for (int i = start; i < sql.Length; i++)
        {
            char c = sql[i];

            if (c == '(')
            {
                depth++;
            }
            else if (c == ')')
            {
                depth--;

                if (depth == 0)
                {
                    end = i + 1;
                    break;
                }
            }
        }

        depth.Should().Be(0, "unbalanced parentheses in dbo.Runs CREATE TABLE");

        string header = sql[start..end];

        // Master DDL uses unbracketed identifiers for this table; match either style.
        header.Should().MatchRegex(@"(?<!\w)TenantId(?!\w)", because: "Runs is tenant-scoped");
        header.Should().MatchRegex(@"(?<!\w)WorkspaceId(?!\w)", because: "Runs is workspace-scoped");
        header.Should().MatchRegex(@"(?<!\w)ProjectId(?!\w)", because: "Runs carries project key (NVARCHAR line-of-business id)");
    }

    private static string ResolveArchLucidSqlPath()
    {
        string[] seeds =
        [
            AppContext.BaseDirectory,
            Directory.GetCurrentDirectory(),
        ];

        foreach (string seed in seeds)
        {
            string? dir = Path.GetFullPath(seed);

            for (int depth = 0; depth < 16 && !string.IsNullOrEmpty(dir); depth++)
            {
                string candidate = Path.Combine(dir, "ArchLucid.Persistence", "Scripts", "ArchLucid.sql");

                if (File.Exists(candidate))
                {
                    return candidate;
                }

                string? parent = Path.GetDirectoryName(dir);

                if (string.IsNullOrEmpty(parent) || string.Equals(parent, dir, StringComparison.Ordinal))
                {
                    break;
                }

                dir = parent;
            }
        }

        throw new InvalidOperationException(
            "Could not locate ArchLucid.Persistence/Scripts/ArchLucid.sql. Run tests from repo root or ensure the file is present.");
    }
}
