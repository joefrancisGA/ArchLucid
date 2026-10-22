using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class SqlAzureInventorySnapshotRepositoryHeaderSqlTests
{
    [Fact]
    public void Canonical_detail_batch_includes_shared_snapshot_header_sql()
    {
        string readSource = ReadRepositorySource("SqlAzureInventorySnapshotRepository.Read.cs");
        string mainSource = ReadRepositorySource("SqlAzureInventorySnapshotRepository.cs");

        readSource.Should().Contain("SnapshotHeaderSelectSql");
        mainSource.Should().Contain("SnapshotHeaderSelectSql");
    }

    private static string ReadRepositorySource(string fileName)
    {
        string path = Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "ArchLucid.Persistence",
            "InfraEvidence",
            fileName);

        return File.ReadAllText(Path.GetFullPath(path));
    }
}
