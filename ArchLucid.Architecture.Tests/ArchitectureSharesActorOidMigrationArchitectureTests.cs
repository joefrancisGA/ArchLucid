using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>Regression coverage for upgrading legacy UserId share tables to ActorOid.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSharesActorOidMigrationArchitectureTests
{
    [Fact]
    public void Migration_401_executes_legacy_user_id_references_dynamically()
    {
        string migrationText = ReadMigration();

        migrationText.Should().Contain(
            "EXEC sys.sp_executesql N'",
            "SQL Server compiles guarded batches before evaluating COL_LENGTH");
        migrationText.Should().Contain(
            "CONVERT(NVARCHAR(36), UserId)",
            "legacy UserId values must be backfilled when upgrading migration 380");
        migrationText.Should().Contain(
            "DROP COLUMN UserId",
            "the legacy column must be removed after the actor key is populated");
    }

    private static string ReadMigration()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "ArchLucid.sln")))
            directory = directory.Parent;

        directory.Should().NotBeNull("the architecture tests must run from an ArchLucid repository");

        string path = Path.Combine(
            directory!.FullName,
            "ArchLucid.Persistence",
            "Migrations",
            "401_ArchitectureShares_ActorOid.sql");

        File.Exists(path).Should().BeTrue($"expected SQL at {path}");
        return File.ReadAllText(path);
    }
}
