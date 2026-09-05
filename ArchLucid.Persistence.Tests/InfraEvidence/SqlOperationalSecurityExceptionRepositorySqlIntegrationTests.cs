using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlOperationalSecurityExceptionRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantA = Guid.Parse("e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1");
    private static readonly Guid TenantB = Guid.Parse("e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2");
    private static readonly Guid WorkspaceId = Guid.Parse("e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3");
    private static readonly Guid ProjectId = Guid.Parse("e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4");

    [SkippableFact]
    public async Task Foreign_tenant_lookup_returns_null()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlOperationalSecurityExceptionRepository repository = new(factory);

        Guid exceptionId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        await repository.InsertAsync(
            CreateException(exceptionId, TenantA, cloudResourceId: Guid.NewGuid(), utcNow),
            CancellationToken.None);

        OperationalSecurityExceptionRecord? foreignLookup = await repository.TryGetByIdAsync(
            TenantB,
            exceptionId,
            CancellationToken.None);

        foreignLookup.Should().BeNull("exceptions are tenant-isolated.");
    }

    [SkippableFact]
    public async Task MarkExpiredAsync_only_expires_active_past_due_records()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlOperationalSecurityExceptionRepository repository = new(factory);

        DateTime utcNow = DateTime.UtcNow;
        Guid expiredId = Guid.NewGuid();
        Guid activeId = Guid.NewGuid();

        await repository.InsertAsync(
            CreateException(expiredId, TenantA, cloudResourceId: Guid.NewGuid(), utcNow, expirationUtc: utcNow.AddMinutes(-10)),
            CancellationToken.None);

        await repository.InsertAsync(
            CreateException(activeId, TenantA, cloudResourceId: Guid.NewGuid(), utcNow, expirationUtc: utcNow.AddDays(7)),
            CancellationToken.None);

        IReadOnlyList<OperationalSecurityExceptionRecord> expired =
            await repository.MarkExpiredAsync(TenantA, utcNow, CancellationToken.None);

        expired.Should().ContainSingle(record => record.ExceptionId == expiredId);
        expired[0].Status.Should().Be(OperationalSecurityExceptionStatus.Expired);

        OperationalSecurityExceptionRecord? stillActive = await repository.TryGetByIdAsync(TenantA, activeId, CancellationToken.None);
        stillActive.Should().NotBeNull();
        stillActive!.Status.Should().Be(OperationalSecurityExceptionStatus.Active);
    }

    private static OperationalSecurityExceptionRecord CreateException(
        Guid exceptionId,
        Guid tenantId,
        Guid cloudResourceId,
        DateTime utcNow,
        DateTime? expirationUtc = null) =>
        new()
        {
            ExceptionId = exceptionId,
            TenantId = tenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CloudResourceId = cloudResourceId,
            OwnerActorKeysJson = "[\"owner-1\"]",
            Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            ExpirationUtc = expirationUtc ?? utcNow.AddDays(30),
            Status = OperationalSecurityExceptionStatus.Active,
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
            PayloadHashSha256 = [4, 5, 6],
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
}
