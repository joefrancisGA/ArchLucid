using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityDeclaredConnectionServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid FromCloudResourceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ToCloudResourceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Fact]
    public async Task CreateAsync_rejects_when_active_duplicate_exists()
    {
        DateTime utcNow = DateTime.UtcNow;
        InMemorySecurityDeclaredConnectionRepository repository = new();
        repository.Records.Add(CreateActiveConnection(Guid.NewGuid(), utcNow.AddDays(10)));

        SecurityDeclaredConnectionService sut = CreateSut(repository);

        SecurityDeclaredConnectionCreateResult result = await sut.CreateAsync(
            CreateScope(),
            CreateValidCreateRequest(utcNow));

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("active declared connection");
    }

    [Fact]
    public async Task CreateAsync_persists_valid_connection()
    {
        DateTime utcNow = DateTime.UtcNow;
        InMemorySecurityDeclaredConnectionRepository repository = new();
        SecurityDeclaredConnectionService sut = CreateSut(repository);

        SecurityDeclaredConnectionCreateResult result = await sut.CreateAsync(
            CreateScope(),
            CreateValidCreateRequest(utcNow));

        result.Succeeded.Should().BeTrue();
        result.ConnectionId.Should().NotBeNull();
        repository.Records.Should().ContainSingle();
    }

    [Fact]
    public async Task CreateAsync_same_connection_in_other_project_does_not_block_current_project()
    {
        DateTime utcNow = DateTime.UtcNow;
        InMemorySecurityDeclaredConnectionRepository repository = new();
        repository.Records.Add(CreateActiveConnection(
            Guid.NewGuid(),
            utcNow.AddDays(10),
            Guid.Parse("11111111-2222-3333-4444-555555555555")));

        SecurityDeclaredConnectionService sut = CreateSut(repository);

        SecurityDeclaredConnectionCreateResult result =
            await sut.CreateAsync(CreateScope(), CreateValidCreateRequest(utcNow));

        result.Succeeded.Should().BeTrue();
        repository.Records.Should().HaveCount(2);
    }

    [Fact]
    public async Task ListAsync_excludes_same_tenant_rows_from_other_project()
    {
        DateTime utcNow = DateTime.UtcNow;
        InMemorySecurityDeclaredConnectionRepository repository = new();
        SecurityDeclaredConnectionRecord local = CreateActiveConnection(Guid.NewGuid(), utcNow.AddDays(10));
        SecurityDeclaredConnectionRecord foreign = CreateActiveConnection(
            Guid.NewGuid(),
            utcNow.AddDays(10),
            Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa"));
        repository.Records.AddRange([local, foreign]);

        SecurityDeclaredConnectionService sut = CreateSut(repository);
        IReadOnlyList<SecurityDeclaredConnectionRecord> rows = await sut.ListAsync(CreateScope());

        rows.Should().ContainSingle();
        rows[0].ConnectionId.Should().Be(local.ConnectionId);
    }

    private static SecurityDeclaredConnectionService CreateSut(
        InMemorySecurityDeclaredConnectionRepository repository)
    {
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new SecurityDeclaredConnectionService(
            repository,
            auditService.Object,
            NullLogger<SecurityDeclaredConnectionService>.Instance);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static SecurityDeclaredConnectionCreateRequest CreateValidCreateRequest(DateTime utcNow) =>
        new()
        {
            FromCloudResourceId = FromCloudResourceId,
            ToCloudResourceId = ToCloudResourceId,
            RelationshipType = SecurityDeclaredConnectionRelationshipType.ConnectsTo,
            Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            ExpirationUtc = utcNow.AddDays(30),
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
        };

    private static SecurityDeclaredConnectionRecord CreateActiveConnection(
        Guid connectionId,
        DateTime expirationUtc,
        Guid? projectId = null) =>
        new()
        {
            ConnectionId = connectionId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = projectId ?? ProjectId,
            FromCloudResourceId = FromCloudResourceId,
            ToCloudResourceId = ToCloudResourceId,
            RelationshipType = SecurityDeclaredConnectionRelationshipType.ConnectsTo,
            Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            ExpirationUtc = expirationUtc,
            Status = SecurityDeclaredConnectionStatus.Active,
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
            PayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private sealed class InMemorySecurityDeclaredConnectionRepository : ISecurityDeclaredConnectionRepository
    {
        public List<SecurityDeclaredConnectionRecord> Records { get; } = [];

        public Task InsertAsync(SecurityDeclaredConnectionRecord record, CancellationToken cancellationToken = default)
        {
            Records.Add(record);
            return Task.CompletedTask;
        }

        public Task<SecurityDeclaredConnectionRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid connectionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Records.FirstOrDefault(record =>
                record.TenantId == tenantId && record.ConnectionId == connectionId));

        public Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityDeclaredConnectionRecord>>(
                Records.Where(record => record.TenantId == tenantId).ToList());

        public Task<SecurityDeclaredConnectionRecord?> TryGetActiveDuplicateAsync(
            Guid tenantId,
            Guid fromCloudResourceId,
            Guid toCloudResourceId,
            SecurityDeclaredConnectionRelationshipType relationshipType,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Records.FirstOrDefault(record =>
                record.TenantId == tenantId
                && record.FromCloudResourceId == fromCloudResourceId
                && record.ToCloudResourceId == toCloudResourceId
                && record.RelationshipType == relationshipType
                && record.Status == SecurityDeclaredConnectionStatus.Active
                && record.ExpirationUtc > asOfUtc));

        public Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListActiveByTenantAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityDeclaredConnectionRecord>>(
                Records.Where(record =>
                    record.TenantId == tenantId
                    && record.Status == SecurityDeclaredConnectionStatus.Active
                    && record.ExpirationUtc > asOfUtc).ToList());

        public Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> MarkExpiredAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityDeclaredConnectionRecord>>([]);

        public Task MarkExpiryProcessedAsync(
            Guid tenantId,
            Guid connectionId,
            DateTime processedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RevokeAsync(
            Guid tenantId,
            Guid connectionId,
            string revokedByActorKey,
            DateTime revokedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateRenewalAsync(
            SecurityDeclaredConnectionRecord record,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
