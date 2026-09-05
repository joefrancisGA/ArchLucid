using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlOperationalSecurityFindingRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantA = Guid.Parse("f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1");
    private static readonly Guid TenantB = Guid.Parse("f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2");
    private static readonly Guid WorkspaceId = Guid.Parse("f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3");
    private static readonly Guid ProjectId = Guid.Parse("f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4");

    [SkippableFact]
    public async Task Duplicate_natural_key_throws_and_foreign_tenant_lookup_returns_null()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlOperationalSecurityFindingRepository repository = new(factory);

        Guid findingId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;
        byte[] payloadHash = [1, 2, 3, 4];

        OperationalSecurityFindingRecord finding = CreateFinding(
            findingId,
            TenantA,
            provider: CloudProvider.Azure,
            sourceSystem: "Defender",
            sourceFindingId: "finding-001",
            utcNow,
            payloadHash);

        OperationalSecurityFindingObservationRecord observation = CreateObservation(
            findingId,
            TenantA,
            utcNow,
            payloadHash);

        await repository.InsertAsync(finding, [], observation, CancellationToken.None);

        OperationalSecurityFindingRecord duplicate = CreateFinding(
            Guid.NewGuid(),
            TenantA,
            provider: CloudProvider.Azure,
            sourceSystem: "Defender",
            sourceFindingId: "finding-001",
            utcNow,
            payloadHash);

        Func<Task> duplicateInsert = () => repository.InsertAsync(
            duplicate,
            [],
            CreateObservation(duplicate.FindingId, TenantA, utcNow, payloadHash),
            CancellationToken.None);

        await duplicateInsert.Should().ThrowAsync<Exception>();

        OperationalSecurityFindingRecord? foreignTenantLookup = await repository.TryGetByIdAsync(
            TenantB,
            findingId,
            CancellationToken.None);

        foreignTenantLookup.Should().BeNull("findings are tenant-isolated.");
    }

    [SkippableFact]
    public async Task Natural_key_lookup_is_scoped_to_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlOperationalSecurityFindingRepository repository = new(factory);

        Guid findingId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;
        byte[] payloadHash = [5, 6, 7, 8];

        await repository.InsertAsync(
            CreateFinding(
                findingId,
                TenantA,
                provider: CloudProvider.Azure,
                sourceSystem: "Custom.Scanner",
                sourceFindingId: "scan-42",
                utcNow,
                payloadHash),
            [],
            CreateObservation(findingId, TenantA, utcNow, payloadHash),
            CancellationToken.None);

        OperationalSecurityFindingRecord? sameTenant = await repository.TryGetByNaturalKeyAsync(
            TenantA,
            CloudProvider.Azure,
            "Custom.Scanner",
            "scan-42",
            CancellationToken.None);

        sameTenant.Should().NotBeNull();
        sameTenant!.FindingId.Should().Be(findingId);

        OperationalSecurityFindingRecord? otherTenant = await repository.TryGetByNaturalKeyAsync(
            TenantB,
            CloudProvider.Azure,
            "Custom.Scanner",
            "scan-42",
            CancellationToken.None);

        otherTenant.Should().BeNull();
    }

    private static OperationalSecurityFindingRecord CreateFinding(
        Guid findingId,
        Guid tenantId,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        DateTime utcNow,
        byte[] payloadHash) =>
        new()
        {
            FindingId = findingId,
            TenantId = tenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = provider,
            SourceSystem = sourceSystem,
            SourceFindingId = sourceFindingId,
            Title = "Public storage exposure",
            Severity = "High",
            FirstObservedUtc = utcNow,
            LastObservedUtc = utcNow,
            Status = OperationalSecurityFindingStatus.Open,
            PayloadHashSha256 = payloadHash,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static OperationalSecurityFindingObservationRecord CreateObservation(
        Guid findingId,
        Guid tenantId,
        DateTime observedUtc,
        byte[] payloadHash) =>
        new()
        {
            ObservationId = Guid.NewGuid(),
            FindingId = findingId,
            TenantId = tenantId,
            ObservedUtc = observedUtc,
            Status = OperationalSecurityFindingStatus.Open,
            Severity = "High",
            Summary = "Initial observation",
            PayloadHashSha256 = payloadHash,
            SourceSystem = "Defender",
        };
}
