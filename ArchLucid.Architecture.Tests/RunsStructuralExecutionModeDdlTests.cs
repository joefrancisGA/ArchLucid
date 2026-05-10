using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-002: master DDL enforces structural execution mode on <c>dbo.Runs</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunsStructuralExecutionModeDdlTests
{
    [Fact]
    public void ArchLucid_sql_requires_structural_execution_mode_on_runs()
    {
        string sql = File.ReadAllText(ResolveArchLucidSqlPath());

        sql.Should().MatchRegex(
            new Regex(@"(?<!\w)StructuralExecutionMode(?!\w).*NOT\s+NULL", RegexOptions.IgnoreCase | RegexOptions.Singleline),
            because: "INV-002 requires dbo.Runs.StructuralExecutionMode NOT NULL in ArchLucid.sql");

        sql.Should().Contain("CK_Runs_StructuralExecutionMode", because: "enum domain must be CHECK-constrained");
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
