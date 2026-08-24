using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class SqlDevelopmentCatalogResetCommandsTests
{
    [Fact]
    public void ProcedureName_MatchesMasterScript()
    {
        string script = ReadMasterScriptFromRepo();

        script.Should().Contain($"CREATE OR ALTER PROCEDURE dbo.{SqlDevelopmentCatalogResetCommands.ProcedureName}");
        script.Should().Contain("@Confirm");
        script.Should().Contain(SqlDevelopmentCatalogResetCommands.ConfirmToken);
        script.Should().Contain("SET SINGLE_USER WITH ROLLBACK IMMEDIATE");
        script.Should().Contain("DROP DATABASE");
        script.Should().Contain("CREATE DATABASE");
        script.Should().Contain("master");
        script.Should().Contain("tempdb");
    }

    [Fact]
    public void ResolveMasterScriptPath_EndsWithMasterFileName()
    {
        string path = PersistenceScriptPaths.ResolveMasterScriptPath();

        Path.GetFileName(path).Should().Be("ArchLucid.Master.sql");
    }

    [Fact]
    public void DatabaseMigrator_ScriptExecutionTimeout_IsTenMinutes()
    {
        DatabaseMigrator.ScriptExecutionTimeout.Should().Be(TimeSpan.FromSeconds(SqlCommandTimeouts.ExtendedSeconds));
    }

    private static string ReadMasterScriptFromRepo()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string candidate = Path.Combine(dir.FullName, "ArchLucid.Persistence", "Scripts", "ArchLucid.Master.sql");

            if (File.Exists(candidate))
                return File.ReadAllText(candidate);

            dir = dir.Parent;
        }

        throw new FileNotFoundException("Could not locate ArchLucid.Persistence/Scripts/ArchLucid.Master.sql from the test output directory.");
    }
}
