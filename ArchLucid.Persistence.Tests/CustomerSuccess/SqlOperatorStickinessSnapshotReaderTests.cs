using ArchLucid.Persistence.CustomerSuccess;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.CustomerSuccess;

[Trait("Suite", "Persistence")]
[Trait("Category", "Unit")]
public sealed class SqlOperatorStickinessSnapshotReaderTests
{
    [Fact]
    public void CommittedRunsWhereClause_uses_legacy_run_status_not_manifest_reference()
    {
        OperatorStickinessCommittedRunSql.CommittedRunsWhereClause.Should().Contain("LegacyRunStatus");
        OperatorStickinessCommittedRunSql.CommittedRunsWhereClause.Should().NotContain("GoldenManifestId");
        OperatorStickinessCommittedRunSql.CommittedRunsWhereClause.Should().NotContain("CurrentManifestVersion");
    }

    [Fact]
    public void ToNullableUtcDateTime_ReturnsNull_WhenDbNull()
    {
        DateTime? result = SqlOperatorStickinessSnapshotReader.ToNullableUtcDateTimeForTests(DBNull.Value);

        result.Should().BeNull();
    }
}
