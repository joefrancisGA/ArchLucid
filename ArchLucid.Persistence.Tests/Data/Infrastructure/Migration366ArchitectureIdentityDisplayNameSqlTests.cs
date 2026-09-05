using System.Reflection;
using System.Text;

using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

/// <summary>
///     Guards migration 366 against SQL error 207: DisplayName must not be referenced
///     in the same GO batch that adds it.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class Migration366ArchitectureIdentityDisplayNameSqlTests
{
    [Fact]
    public void First_batch_adds_display_name_not_null_with_default_and_does_not_assign_it()
    {
        string sql = ReadEmbeddedMigration("366_ArchitectureIdentityDisplayNameAndDraftFk.sql");
        string firstBatch = ReadFirstGoBatch(sql);

        firstBatch.Should().Contain("ADD DisplayName NVARCHAR(200) NOT NULL");
        firstBatch.Should().Contain("CONSTRAINT DF_Architectures_DisplayName DEFAULT (N'Untitled architecture')");
        firstBatch.Should().Contain("ADD Description NVARCHAR(500) NULL");
        firstBatch.Should().NotContain("UPDATE dbo.Architectures");
        firstBatch.Should().NotContain("ALTER COLUMN DisplayName");
    }

    [Fact]
    public void Embedded_366_migration_still_adds_draft_architecture_fk()
    {
        string sql = ReadEmbeddedMigration("366_ArchitectureIdentityDisplayNameAndDraftFk.sql");

        sql.Should().Contain("FK_DraftRequests_Architectures");
        sql.Should().Contain("IX_DraftRequests_Scope_ArchitectureId");
        sql.Should().Contain("ADD ArchitectureId UNIQUEIDENTIFIER NULL");
    }

    private static string ReadEmbeddedMigration(string fileName)
    {
        Assembly asm = typeof(DatabaseMigrator).Assembly;
        string? resourceName = asm.GetManifestResourceNames()
            .SingleOrDefault(static n => n.EndsWith(fileName, StringComparison.Ordinal));

        resourceName.Should().NotBeNull($"embedded resource {fileName} must exist");

        if (resourceName is null)
        {
            throw new InvalidOperationException($"Embedded resource {fileName} was not found.");
        }

        using Stream? stream = asm.GetManifestResourceStream(resourceName);

        if (stream is null)
        {
            throw new InvalidOperationException($"Embedded resource {fileName} stream was null.");
        }

        using StreamReader reader = new(stream);
        return reader.ReadToEnd();
    }

    /// <summary>
    ///     DbUp and sqlcmd compile statements between GO separators as one batch.
    ///     Error 207 is a compile-time failure for that first batch.
    /// </summary>
    private static string ReadFirstGoBatch(string sql)
    {
        using StringReader reader = new(sql);
        StringBuilder batch = new();
        string? line = reader.ReadLine();

        while (line is not null)
        {
            // GO is a client batch separator, not T-SQL.

            if (line.Trim().Equals("GO", StringComparison.OrdinalIgnoreCase))
            {
                break;
            }

            batch.AppendLine(line);
            line = reader.ReadLine();
        }

        return batch.ToString();
    }
}
