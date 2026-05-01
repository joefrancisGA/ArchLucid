using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard: authority-chain headers keep explicit <c>dbo.Runs(RunId)</c> FK names in greenfield DDL scripts.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityChainRunForeignKeyDdlTests
{
    private static readonly Regex FkNameRegex = new(@"FK_(ContextSnapshots|GraphSnapshots|FindingsSnapshots|GoldenManifests)_Runs_RunId\b",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    [Fact]
    public void ArchLucid_sql_contains_RunId_foreign_keys_for_authority_headers()
    {
        string sql = File.ReadAllText(ResolveArchLucidSqlPath());

        foreach (string name in new[] { "FK_ContextSnapshots_Runs_RunId", "FK_GraphSnapshots_Runs_RunId", "FK_FindingsSnapshots_Runs_RunId", "FK_GoldenManifests_Runs_RunId" })
        {
            sql.Should().MatchRegex($@"\b{Regex.Escape(name)}\b", $"expected {name} in ArchLucid.sql");
        }

        MatchCollection matches = FkNameRegex.Matches(sql);
        matches.Count.Should().BeGreaterThanOrEqualTo(4);
    }

    private static string ResolveArchLucidSqlPath()
    {
        string[] seeds = [AppContext.BaseDirectory, Directory.GetCurrentDirectory(),];

        foreach (string seed in seeds)
        {
            string dir = Path.GetFullPath(seed);

            for (int depth = 0; depth < 16 && !string.IsNullOrEmpty(dir); depth++)
            {
                string candidate = Path.Combine(dir, "ArchLucid.Persistence", "Scripts", "ArchLucid.sql");

                if (File.Exists(candidate))
                    return candidate;

                string? parent = Path.GetDirectoryName(dir);

                if (string.IsNullOrEmpty(parent) || string.Equals(parent, dir, StringComparison.Ordinal))
                    break;

                dir = parent;
            }
        }

        throw new InvalidOperationException(
            "Could not locate ArchLucid.Persistence/Scripts/ArchLucid.sql. Run tests from repo root or ensure the file is present.");
    }
}
