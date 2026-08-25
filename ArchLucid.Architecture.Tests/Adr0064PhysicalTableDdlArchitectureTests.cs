using System.Globalization;
using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guards ADR 0064: after migration 295, <c>dbo.Runs</c> is a synonym for <c>dbo.Reviews</c>.
///     <c>ALTER TABLE dbo.Runs</c> raises SQL 4909. Forward DDL must resolve the physical table.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class Adr0064PhysicalTableDdlArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly Regex AlterRunsTableRegex = new(
        @"ALTER\s+TABLE\s+dbo\.Runs\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromSeconds(1));

    private static readonly Regex MigrationFileNumberRegex = new(
        @"^(?<number>\d{3})_",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromSeconds(1));

    [Fact]
    public void Migration_323_adds_architecture_id_on_physical_reviews_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "323_Architectures.sql");

        migrationText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        migrationText.Should().Contain("ArchitectureId");
        migrationText.Should().Contain("sp_executesql");
        migrationText.Should().Contain("CREATE TABLE dbo.Architectures");
        AlterRunsTableRegex.IsMatch(StripSqlComments(migrationText)).Should().BeFalse();
    }

    [Fact]
    public void Migration_324_adds_improve_loop_evidence_on_physical_reviews_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "324_ArchitectureRecurrenceAndImproveLoop.sql");

        migrationText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        migrationText.Should().Contain("ImproveLoopEvidenceJson");
        migrationText.Should().Contain("sp_executesql");
        AlterRunsTableRegex.IsMatch(StripSqlComments(migrationText)).Should().BeFalse();
    }

    [Fact]
    public void Rollback_323_targets_physical_table()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R323_Architectures.sql");

        rollbackText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        rollbackText.Should().Contain("DROP COLUMN ArchitectureId");
        rollbackText.Should().Contain("DROP TABLE dbo.Architectures");
        AlterRunsTableRegex.IsMatch(StripSqlComments(rollbackText)).Should().BeFalse();
    }

    [Fact]
    public void Rollback_324_targets_physical_table()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R324_ArchitectureRecurrenceAndImproveLoop.sql");

        rollbackText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        rollbackText.Should().Contain("DROP COLUMN ImproveLoopEvidenceJson");
        AlterRunsTableRegex.IsMatch(StripSqlComments(rollbackText)).Should().BeFalse();
    }

    [Fact]
    public void Migration_325_adds_knowledge_model_id_on_physical_reviews_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "325_Runs_KnowledgeModelId.sql");

        migrationText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        migrationText.Should().Contain("KnowledgeModelId");
        migrationText.Should().Contain("sp_executesql");
        AlterRunsTableRegex.IsMatch(StripSqlComments(migrationText)).Should().BeFalse();
    }

    [Fact]
    public void Rollback_325_targets_physical_table()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R325_Runs_KnowledgeModelId.sql");

        rollbackText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        rollbackText.Should().Contain("DROP COLUMN KnowledgeModelId");
        AlterRunsTableRegex.IsMatch(StripSqlComments(rollbackText)).Should().BeFalse();
    }

    [Fact]
    public void ArchLucid_sql_adds_architecture_id_on_physical_table()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid.sql");

        ddl.Should().Contain("CREATE TABLE dbo.Architectures");
        ddl.Should().Contain("ArchitectureId");
        ddl.Should().Contain("ImproveLoopEvidenceJson");
        ddl.Should().Contain("KnowledgeModelId");
        ddl.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
    }

    [Fact]
    public void Forward_migrations_from_323_do_not_alter_runs_synonym()
    {
        string migrationsDir = Path.Combine(RepoRoot, "ArchLucid.Persistence", "Migrations");

        foreach (string path in Directory.GetFiles(migrationsDir, "*.sql"))
        {
            string fileName = Path.GetFileName(path);
            Match match = MigrationFileNumberRegex.Match(fileName);

            if (!match.Success)
                continue;

            int number = int.Parse(match.Groups["number"].Value, CultureInfo.InvariantCulture);

            if (number < 323)
                continue;

            string text = File.ReadAllText(path);

            AlterRunsTableRegex.IsMatch(StripSqlComments(text)).Should().BeFalse(
                $"{fileName} must ALTER the physical Reviews/Runs table after ADR 0064, not the dbo.Runs synonym");
        }
    }

    private static string StripSqlComments(string sql)
    {
        string withoutBlocks = Regex.Replace(
            sql,
            @"/\*.*?\*/",
            " ",
            RegexOptions.Singleline | RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));

        return Regex.Replace(
            withoutBlocks,
            @"--[^\n]*",
            " ",
            RegexOptions.CultureInvariant,
            TimeSpan.FromSeconds(1));
    }

    private static string ReadPersistenceSql(params string[] relativeSegments)
    {
        string[] parts = new string[relativeSegments.Length + 2];
        parts[0] = RepoRoot;
        parts[1] = "ArchLucid.Persistence";
        Array.Copy(relativeSegments, 0, parts, 2, relativeSegments.Length);
        string path = Path.Combine(parts);
        File.Exists(path).Should().BeTrue($"expected SQL at {path}");

        return File.ReadAllText(path);
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
