using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

public sealed class GoldenManifestReadSqlOrderingTests
{
    [Fact]
    public void Capped_manifest_reads_break_created_timestamp_ties_by_manifest_id()
    {
        GoldenManifestReadSql.SelectLatestByContractManifestVersion
            .Should()
            .Contain("ORDER BY CreatedUtc DESC, ManifestId DESC;");

        GoldenManifestReadSql.SelectPriorCommittedForRetrieval
            .Should()
            .Contain("ORDER BY CreatedUtc DESC, ManifestId DESC;");
    }
}
