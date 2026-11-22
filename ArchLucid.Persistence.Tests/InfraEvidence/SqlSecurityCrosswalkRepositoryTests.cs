using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlSecurityCrosswalkRepositoryTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task InsertManyAsync_rolls_back_the_first_mapping_when_a_later_insert_fails()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlSecurityCrosswalkRepository repository = new(new TestSqlConnectionFactory(fixture.ConnectionString));
        Guid tenantId = Guid.NewGuid();
        Guid mappingId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;

        SecurityCrosswalkMappingRecord Mapping(string sourceId) => new()
        {
            MappingId = mappingId,
            TenantId = tenantId,
            SourceEndpointKind = SecurityCrosswalkEndpointKind.AuditControl,
            SourceEndpointId = sourceId,
            TargetEndpointKind = SecurityCrosswalkEndpointKind.McsbControl,
            TargetEndpointId = "mcsb-control",
            MappingType = SecurityCrosswalkMappingType.Related,
            Confidence = 1m,
            MappingSource = SecurityCrosswalkMappingSource.Authoritative,
            Version = "v1",
            Rationale = "Regression fixture",
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        SecurityCrosswalkMappingRecord first = Mapping("first-control");
        Func<Task> write = () => repository.InsertManyAsync([first, Mapping("second-control")]);

        await write.Should().ThrowAsync<SqlException>();

        IReadOnlyList<SecurityCrosswalkMappingRecord> afterFailure = await repository.ListBySourceAsync(
            tenantId, first.SourceEndpointKind, first.SourceEndpointId);
        afterFailure.Should().BeEmpty();

        await repository.InsertManyAsync([first]);
        IReadOnlyList<SecurityCrosswalkMappingRecord> afterRetry = await repository.ListBySourceAsync(
            tenantId, first.SourceEndpointKind, first.SourceEndpointId);
        afterRetry.Should().ContainSingle().Which.MappingId.Should().Be(mappingId);
    }
}
