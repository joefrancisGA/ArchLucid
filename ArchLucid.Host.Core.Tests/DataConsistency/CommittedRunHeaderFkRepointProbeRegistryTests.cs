using ArchLucid.Core.Persistence;
using ArchLucid.Host.Core.DataConsistency;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.DataConsistency;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommittedRunHeaderFkRepointProbeRegistryTests
{
    [Fact]
    public void ContextSnapshotId_registration_resolves_probe_sql()
    {
        CommittedRunHeaderFkRepointRegistration registration = CommittedRunHeaderFkRepointRegistry.All
            .Single(static entry => entry.PointerColumnName == "ContextSnapshotId");

        string sql = CommittedRunHeaderFkRepointProbeRegistry.ResolveCountSql(registration);

        sql.Should().Be(CommittedRunHeaderFkRepointProbeSql.ContextSnapshotId);
        sql.Should().Contain("GoldenManifestId IS NOT NULL");
        sql.Should().Contain("ContextSnapshots");
    }

    [Theory]
    [MemberData(nameof(AllRegistrations))]
    public void Every_registration_resolves_non_empty_sql(CommittedRunHeaderFkRepointRegistration registration)
    {
        string sql = CommittedRunHeaderFkRepointProbeRegistry.ResolveCountSql(registration);

        sql.Should().Contain("dbo.Runs");
        sql.Should().Contain(registration.PointerColumnName);
        sql.Should().Contain($"dbo.{registration.ChildTableName}");
    }

    public static IEnumerable<object[]> AllRegistrations()
    {
        return CommittedRunHeaderFkRepointRegistry.All.Select(static registration => new object[] { registration });
    }
}
