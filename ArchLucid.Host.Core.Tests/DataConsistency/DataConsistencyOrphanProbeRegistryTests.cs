using ArchLucid.Host.Core.DataConsistency;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.DataConsistency;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DataConsistencyOrphanProbeRegistryTests
{
    [Fact]
    public void ArtifactBundles_registration_resolves_probe_sql()
    {
        DataConsistencyOrphanProbeRegistration registration = DataConsistencyOrphanProbeRegistry.BackgroundProbed
            .Single(static entry => entry.TableName == "ArtifactBundles");

        string sql = DataConsistencyOrphanProbeRegistry.ResolveBackgroundProbeCountSql(registration);

        sql.Should().Be(DataConsistencyOrphanProbeSql.ArtifactBundlesRunId);
        sql.Should().Contain("NOT EXISTS");
    }
}
