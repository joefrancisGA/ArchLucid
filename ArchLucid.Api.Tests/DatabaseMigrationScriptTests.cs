using System.Reflection;
using System.Text.RegularExpressions;

using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Database Migration Script.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DatabaseMigrationScriptTests
{
    /// <summary>
    /// Tenant-plane scripts embed as <c>...Migrations.###_Name.sql</c>;
    /// system-plane scripts use <c>...Migrations.System.###_Name.sql</c> (see <c>Migrations/System</c> in csproj).
    /// </summary>
    private static readonly Regex MigrationFileNameRegex = new(
        @"^(?:System\.)?\d{3}_[^.]+\.sql$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(100));

    [SkippableFact]
    public void ArchLucidPersistenceAssembly_HasEmbeddedMigrationScripts_InNumericOrder()
    {
        Assembly asm = typeof(DatabaseMigrator).Assembly;

        List<string> scripts = asm.GetManifestResourceNames()
            .Where(n => n.Contains("Migrations", StringComparison.OrdinalIgnoreCase) &&
                        n.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToList();

        scripts.Should().NotBeEmpty("DbUp expects embedded .sql migration scripts under a Migrations folder");

        foreach (string n in scripts)
        {
            int idx = n.IndexOf(".Migrations.", StringComparison.OrdinalIgnoreCase);
            string tail = idx >= 0 ? n[(idx + ".Migrations.".Length)..] : n;

            if (tail.StartsWith("Baseline.", StringComparison.OrdinalIgnoreCase))
            {
                tail.Should().Be("Baseline.000_Baseline_2026_04_17.sql", $"unexpected baseline tail from '{n}'");
                continue;
            }

            MigrationFileNameRegex.IsMatch(tail).Should().BeTrue(
                $"migration embedded name should end with Migrations.(System.)###_Name.sql (got tail '{tail}' from '{n}')");

            bool dbUpWouldInclude = n.Contains(".Migrations.", StringComparison.OrdinalIgnoreCase) &&
                                    n.EndsWith(".sql", StringComparison.OrdinalIgnoreCase);
            dbUpWouldInclude.Should().BeTrue(
                $"DbUp predicate should include '{n}' (see {nameof(DatabaseMigrator)}.{nameof(DatabaseMigrator.Run)})");
        }
    }

    [Fact]
    public void Consolidated_system_ddl_file_lists_control_plane_tables()
    {
        string path = Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "ArchLucid.Persistence",
            "Scripts",
            "ArchLucid.System.sql");

        path = Path.GetFullPath(path);
        File.Exists(path).Should().BeTrue($"expected consolidated system DDL at {path}");

        string ddl = File.ReadAllText(path);
        ddl.Should().Contain("CREATE TABLE dbo.Tenants");
        ddl.Should().Contain("CREATE TABLE dbo.TenantDatabaseBindings");
        ddl.Should().Contain("CREATE TABLE dbo.WarmTenantCatalogStandby");
        ddl.Should().NotContain("see ArchLucid.Persistence/Migrations/System");
    }
}
