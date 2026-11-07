using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowPilotPathDispositionServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid SnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid PathId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [Fact]
    public async Task SaveAsync_then_TryGetLatestAsync_round_trips_disposition()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository paths = CreateSamplePathRepository();
        InMemoryAuditRepository auditRepository = new();
        SecureNowPilotPathDispositionService sut = CreateSut(paths, auditRepository);

        SecureNowPilotPathDispositionSaveResult saved = await sut.SaveAsync(
            scope,
            PathId,
            new SecureNowPilotPathDispositionWriteRequest
            {
                Outcome = "Stop",
                Rationale = "Pilot scope ended.",
            },
            "sponsor-actor",
            CancellationToken.None);

        saved.Succeeded.Should().BeTrue();
        saved.Disposition.Should().NotBeNull();
        saved.Disposition!.Outcome.Should().Be("Stop");
        saved.Disposition.Rationale.Should().Be("Pilot scope ended.");

        SecureNowPilotPathDispositionResponse? latest =
            await sut.TryGetLatestAsync(scope, PathId, CancellationToken.None);

        latest.Should().NotBeNull();
        latest!.Outcome.Should().Be("Stop");
        latest.Rationale.Should().Be("Pilot scope ended.");
    }

    [Fact]
    public async Task TryGetLatestAsync_returns_latest_matching_path_only()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository paths = CreateSamplePathRepository();
        InMemoryAuditRepository auditRepository = new();
        SecureNowPilotPathDispositionService sut = CreateSut(paths, auditRepository);

        await sut.SaveAsync(
            scope,
            PathId,
            new SecureNowPilotPathDispositionWriteRequest { Outcome = "Extend", Rationale = "Need more time." },
            "sponsor-actor",
            CancellationToken.None);
        await sut.SaveAsync(
            scope,
            PathId,
            new SecureNowPilotPathDispositionWriteRequest { Outcome = "Stop", Rationale = "Final stop." },
            "sponsor-actor",
            CancellationToken.None);

        SecureNowPilotPathDispositionResponse? latest =
            await sut.TryGetLatestAsync(scope, PathId, CancellationToken.None);

        latest.Should().NotBeNull();
        latest!.Outcome.Should().Be("Stop");
        latest.Rationale.Should().Be("Final stop.");
    }

    [Fact]
    public async Task SaveAsync_rejects_invalid_outcome()
    {
        ScopeContext scope = CreateScope();
        SecureNowPilotPathDispositionService sut =
            CreateSut(CreateSamplePathRepository(), new InMemoryAuditRepository());

        SecureNowPilotPathDispositionSaveResult result = await sut.SaveAsync(
            scope,
            PathId,
            new SecureNowPilotPathDispositionWriteRequest { Outcome = "Maybe", Rationale = "Unclear." },
            "sponsor-actor",
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Proceed");
    }

    [Fact]
    public async Task SaveAsync_does_not_report_success_when_required_audit_write_fails()
    {
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit storage unavailable"));
        SecureNowPilotPathDispositionService sut =
            new(CreateSamplePathRepository(), auditService.Object, new InMemoryAuditRepository());

        Func<Task> act = async () =>
            await sut.SaveAsync(
                CreateScope(),
                PathId,
                new SecureNowPilotPathDispositionWriteRequest
                {
                    Outcome = "Stop",
                    Rationale = "Controlled pilot concluded.",
                },
                "sponsor-actor",
                CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("audit storage unavailable");
    }

    private static SecureNowPilotPathDispositionService CreateSut(
        InMemoryPathRepository paths,
        InMemoryAuditRepository auditRepository)
    {
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns<AuditEvent, CancellationToken>((auditEvent, ct) => auditRepository.AppendAsync(auditEvent, ct));

        return new SecureNowPilotPathDispositionService(paths, auditService.Object, auditRepository);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static InMemoryPathRepository CreateSamplePathRepository()
    {
        InMemoryPathRepository repository = new();
        DateTime utcNow = DateTime.UtcNow;
        List<SecurityEvidencePathHopRecord> hops =
        [
            new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = PathId,
                TenantId = TenantId,
                HopOrdinal = 1,
                FromNodeId = "principal:user",
                ToNodeId = "resource:sa1",
                EdgeType = GraphEdgeTypes.CanRead,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                HopConfidenceBand = PathConfidenceBand.Probable,
                EvidenceReference = "test",
            },
        ];

        SecurityEvidencePathRecord header = new()
        {
            PathId = PathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = SnapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Probable,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

        repository.StoredPaths[PathId] = validated.Path;
        repository.StoredHops[PathId] = validated.Hops.ToList();

        return repository;
    }

    private sealed class InMemoryPathRepository : ISecurityEvidencePathRepository
    {
        public Dictionary<Guid, SecurityEvidencePathRecord> StoredPaths { get; } = [];

        public Dictionary<Guid, List<SecurityEvidencePathHopRecord>> StoredHops { get; } = [];

        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            if (!StoredPaths.TryGetValue(pathId, out SecurityEvidencePathRecord? path) || path.TenantId != tenantId)
            {
                return Task.FromResult<SecurityEvidencePathRecord?>(null);
            }

            return Task.FromResult<SecurityEvidencePathRecord?>(path);
        }

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRecord?>(null);

        public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            if (!StoredHops.TryGetValue(pathId, out List<SecurityEvidencePathHopRecord>? hops))
            {
                return Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>([]);
            }

            return Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>(hops);
        }

        public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
            SecurityEvidencePathRecord pathHeader,
            IReadOnlyList<SecurityEvidencePathHopRecord> hops,
            CancellationToken cancellationToken = default)
            => Task.FromResult(new SecurityEvidencePathInsertResult { PathId = pathHeader.PathId, Created = true });

        public Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            SecurityEvidencePathListFilter filter,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            ProjectSnapshotScopeKey scope,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidencePathRecord>>([]);
    }
}
