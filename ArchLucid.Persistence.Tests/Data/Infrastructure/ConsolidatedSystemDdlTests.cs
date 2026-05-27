using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class ConsolidatedSystemDdlTests
{
    private static readonly Regex CreateTableRegex = new(
        @"CREATE\s+TABLE\s+dbo\.(\w+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromSeconds(2));

    [Fact]
    public void ArchLucid_System_sql_defines_all_control_plane_tables()
    {
        string path = ResolveRepoSystemScriptPath();
        File.Exists(path).Should().BeTrue(path);

        string ddl = File.ReadAllText(path);
        HashSet<string> tables = CreateTableRegex.Matches(ddl)
            .Select(static m => m.Groups[1].Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        tables.Should().Contain("Tenants");
        tables.Should().Contain("TenantDatabaseBindings");
        tables.Should().Contain("TenantDatabaseProvisioningJobs");
        tables.Should().Contain("WarmTenantCatalogStandby");
    }

    [Fact]
    public void ArchLucid_System_sql_is_not_a_pointer_stub()
    {
        string path = ResolveRepoSystemScriptPath();
        string ddl = File.ReadAllText(path);

        ddl.Should().NotContain("see ArchLucid.Persistence/Migrations/System");
        ddl.Should().Contain("CREATE TABLE dbo.Tenants");
    }

    private static string ResolveRepoSystemScriptPath()
    {
        string? dir = Path.GetDirectoryName(typeof(ConsolidatedSystemDdlTests).Assembly.Location);

        if (string.IsNullOrWhiteSpace(dir))
            dir = AppContext.BaseDirectory;

        DirectoryInfo? current = new(dir);

        while (current is not null)
        {
            string candidate = Path.Combine(
                current.FullName,
                "ArchLucid.Persistence",
                "Scripts",
                "ArchLucid.System.sql");

            if (File.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate ArchLucid.System.sql from test output path.");
    }
}
