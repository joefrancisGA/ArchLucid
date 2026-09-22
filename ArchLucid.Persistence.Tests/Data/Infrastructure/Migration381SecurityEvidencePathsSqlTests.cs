using System.Reflection;
using System.Text;

using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

/// <summary>
///     Guards migration 381 against SQL error 207: PathId must not be referenced
///     in the same GO batch that adds it.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class Migration381SecurityEvidencePathsSqlTests
{
    [Fact]
    public void PathId_add_batch_does_not_reference_path_id_for_fk_or_index()
    {
        string sql = ReadEmbeddedMigration("381_SecurityEvidencePaths.sql");
        string addBatch = ReadBatchContaining(sql, "ADD PathId UNIQUEIDENTIFIER NULL");

        addBatch.Should().Contain("ADD PathId UNIQUEIDENTIFIER NULL");
        addBatch.Should().NotContain("FK_OperationalSecurityFindings_SecurityEvidencePaths");
        addBatch.Should().NotContain("IX_OperationalSecurityFindings_Tenant_PathId");
    }

    [Fact]
    public void Embedded_381_migration_still_adds_path_fk_and_index_in_later_batches()
    {
        string sql = ReadEmbeddedMigration("381_SecurityEvidencePaths.sql");

        sql.Should().Contain("FK_OperationalSecurityFindings_SecurityEvidencePaths");
        sql.Should().Contain("IX_OperationalSecurityFindings_Tenant_PathId");
        sql.Should().Contain("CREATE TABLE dbo.SecurityEvidencePaths");
        sql.Should().Contain("CREATE TABLE dbo.SecurityEvidencePathHops");
    }

    private static string ReadEmbeddedMigration(string fileName)
    {
        Assembly asm = typeof(DatabaseMigrator).Assembly;
        string? resourceName = asm.GetManifestResourceNames()
            .SingleOrDefault(n => n.EndsWith(fileName, StringComparison.Ordinal));

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

    private static string ReadBatchContaining(string sql, string marker)
    {
        foreach (string batch in SplitGoBatches(sql))
        {
            if (batch.Contains(marker, StringComparison.Ordinal))
            {
                return batch;
            }
        }

        throw new InvalidOperationException($"No GO batch contained marker: {marker}");
    }

    private static IEnumerable<string> SplitGoBatches(string sql)
    {
        using StringReader reader = new(sql);
        StringBuilder batch = new();
        string? line = reader.ReadLine();

        while (line is not null)
        {
            if (line.Trim().Equals("GO", StringComparison.OrdinalIgnoreCase))
            {
                yield return batch.ToString();
                batch.Clear();
            }
            else
            {
                batch.AppendLine(line);
            }

            line = reader.ReadLine();
        }

        if (batch.Length > 0)
        {
            yield return batch.ToString();
        }
    }
}
