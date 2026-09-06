using System.Text.Json;

using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationInstanceServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid FindingId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid PatternId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid VersionId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    private static readonly Guid SnapshotA = Guid.Parse("77777777-7777-7777-7777-777777777777");
    private static readonly Guid SnapshotB = Guid.Parse("88888888-8888-8888-8888-888888888888");
    private static readonly Guid CloudResourceId = Guid.Parse("99999999-9999-9999-9999-999999999999");

    [Fact]
    public async Task CreateFromMatch_rejects_non_approved_pattern()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch);

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(RemediationPatternStatus.Draft));

        RemediationInstanceService sut = CreateSut(instanceRepository, matchRepository, patternRepository);

        RemediationInstanceOperationResult result =
            await sut.CreateFromMatchAsync(CreateScope(), FindingId, "creator");

        result.Succeeded.Should().BeFalse();
        result.Blockers.Should().ContainSingle(blocker => blocker.Contains("Approved"));
    }

    [Fact]
    public async Task CreateFromMatch_blocks_conflict_match()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.Conflict);

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            matchRepository,
            new InMemoryRemediationPatternRepository());

        RemediationInstanceOperationResult result =
            await sut.CreateFromMatchAsync(CreateScope(), FindingId, "creator");

        result.Succeeded.Should().BeFalse();
        result.Blockers.Should().ContainSingle(blocker => blocker.Contains("conflict", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Execute_does_not_set_verified_status()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(instanceId, RemediationInstanceStatus.WaveAssigned));

        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch);

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(RemediationPatternStatus.Approved, RemediationAutomationLevel.Guided));

        InMemorySnapshotRepository snapshotRepository = new();

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            matchRepository,
            patternRepository,
            exceptionRepository: new InMemoryOperationalSecurityExceptionRepository { HasActiveException = true },
            snapshotRepository: snapshotRepository);

        RemediationInstanceOperationResult result = await sut.ExecuteAsync(
            CreateScope(),
            instanceId,
            SnapshotA,
            "executor",
            "corr-1");

        result.Succeeded.Should().BeTrue();
        result.Status.Should().Be(RemediationInstanceStatus.Executed);
        result.Status.Should().NotBe(RemediationInstanceStatus.Verified);

        instanceRepository.Instances.Single().Status.Should().Be(RemediationInstanceStatus.Executed);
        instanceRepository.Evidence.Should().Contain(evidence => evidence.Phase == RemediationEvidencePhase.ExecuteResult);
    }

    [Fact]
    public async Task Verify_with_later_snapshot_closes_workflow()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();

        instanceRepository.Instances.Add(CreateInstance(
            instanceId,
            RemediationInstanceStatus.Executed,
            executionSnapshotId: SnapshotA,
            cloudResourceId: CloudResourceId));

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(
            RemediationPatternStatus.Approved,
            RemediationAutomationLevel.Guided,
            content: new RemediationPatternVersionContent
            {
                ControlObjective = "Restrict inbound",
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries = ["snapshot.resource.present"],
                },
                Rollback = new RemediationPatternRollbackDefinition { RunbookRef = "rb-1" },
            }));

        InMemorySnapshotRepository snapshotRepository = new();
        snapshotRepository.Snapshots[SnapshotA] = CreateSnapshot(SnapshotA, resourceRowId, present: true);
        snapshotRepository.Snapshots[SnapshotB] = CreateSnapshot(SnapshotB, resourceRowId, present: true);

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository { ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch) },
            patternRepository,
            snapshotRepository: snapshotRepository);

        RemediationInstanceOperationResult verifyResult = await sut.VerifyAsync(
            CreateScope(),
            instanceId,
            SnapshotB,
            "verifier");

        verifyResult.Succeeded.Should().BeTrue();
        verifyResult.Status.Should().Be(RemediationInstanceStatus.Verified);

        RemediationInstanceOperationResult closeResult = await sut.CloseAsync(CreateScope(), instanceId, "closer");

        closeResult.Succeeded.Should().BeTrue();
        closeResult.Status.Should().Be(RemediationInstanceStatus.Closed);
    }

    [Fact]
    public void Remediation_instance_service_source_has_no_cloud_apply_commands()
    {
        string source = File.ReadAllText(
            Path.Combine(
                AppContext.BaseDirectory,
                "..",
                "..",
                "..",
                "..",
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceService.cs"));

        string normalized = source.Replace(" ", string.Empty, StringComparison.Ordinal);
        normalized.Should().NotContain("terraformapply", "execute must not invoke terraform apply");
        normalized.Should().NotContain("arm.Put", "execute must not invoke ARM PUT");
        normalized.Should().NotContain("arm.Patch", "execute must not invoke ARM PATCH");
        normalized.Should().NotContain("arm.Delete", "execute must not invoke ARM DELETE");
    }

    private static RemediationInstanceService CreateSut(
        InMemoryRemediationInstanceRepository instanceRepository,
        InMemoryRemediationPatternMatchRepository matchRepository,
        InMemoryRemediationPatternRepository patternRepository,
        InMemoryOperationalSecurityExceptionRepository? exceptionRepository = null,
        InMemorySnapshotRepository? snapshotRepository = null) =>
        new(
            instanceRepository,
            matchRepository,
            patternRepository,
            exceptionRepository ?? new InMemoryOperationalSecurityExceptionRepository(),
            snapshotRepository ?? new InMemorySnapshotRepository(),
            Mock.Of<IAdvisoryTerraformRepresentationService>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IOperationalSecurityFindingRepository>(),
            Mock.Of<IAuditManualEvidenceRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>());

    private static ScopeContext CreateScope() =>
        new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

    private static RemediationPatternMatchResultRecord CreateMatch(RemediationPatternMatchKind kind) =>
        new()
        {
            MatchResultId = Guid.NewGuid(),
            TenantId = TenantId,
            FindingId = FindingId,
            PatternId = PatternId,
            VersionId = VersionId,
            PatternKey = "network.nsg-deny",
            PatternVersion = "1.0.0",
            MatchKind = kind,
            MatchSource = RemediationPatternMatchSource.Deterministic,
            ExplainText = "matched",
            IsActive = true,
            MatchedUtc = DateTime.UtcNow,
        };

    private static RemediationPatternVersionRecord CreateVersion(
        RemediationPatternStatus status,
        RemediationAutomationLevel automation = RemediationAutomationLevel.Guided,
        RemediationPatternVersionContent? content = null) =>
        new()
        {
            VersionId = VersionId,
            PatternId = PatternId,
            TenantId = TenantId,
            Version = "1.0.0",
            Status = status,
            ControlObjective = "Restrict inbound",
            ContentJson = JsonSerializer.Serialize(content ?? new RemediationPatternVersionContent
            {
                ControlObjective = "Restrict inbound",
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries = ["snapshot.resource.present"],
                },
                Rollback = new RemediationPatternRollbackDefinition { RunbookRef = "rb-rollback" },
            }),
            AutomationLevel = automation,
            AuthorActorKey = "author",
            ApprovedByActorKey = "approver",
            ApprovedUtc = DateTime.UtcNow,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static RemediationInstanceRecord CreateInstance(
        Guid instanceId,
        RemediationInstanceStatus status,
        Guid? executionSnapshotId = null,
        Guid? cloudResourceId = null) =>
        new()
        {
            InstanceId = instanceId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            FindingId = FindingId,
            PatternId = PatternId,
            PatternVersionId = VersionId,
            PatternKey = "network.nsg-deny",
            FrozenPatternVersion = "1.0.0",
            AutomationLevel = RemediationAutomationLevel.Guided,
            Status = status,
            CloudResourceId = cloudResourceId,
            ExecutionSnapshotId = executionSnapshotId,
            CreatedByActorKey = "creator",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        Guid snapshotId,
        Guid resourceRowId,
        bool present)
    {
        AzureInventoryResourceRecord resource = new()
        {
            ResourceRowId = resourceRowId,
            SnapshotId = snapshotId,
            TenantId = TenantId,
            CloudResourceId = CloudResourceId,
            AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1",
            ResourceType = "Microsoft.Network/networkSecurityGroups",
            SubscriptionId = "sub",
        };

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                PackageId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = present ? [resource] : [],
            Properties = [],
            Tags = [],
            Relationships = [],
            RoleAssignments = [],
            Diagnostics = [],
        };
    }

    private sealed class InMemoryRemediationInstanceRepository : IRemediationInstanceRepository
    {
        public List<RemediationInstanceRecord> Instances { get; } = [];

        public List<RemediationEvidenceRecord> Evidence { get; } = [];

        public Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
        {
            Instances.Add(instance);
            return Task.CompletedTask;
        }

        public Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
        {
            int index = Instances.FindIndex(row => row.InstanceId == instance.InstanceId);

            if (index >= 0)
                Instances[index] = instance;

            return Task.CompletedTask;
        }

        public Task<RemediationInstanceRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid instanceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Instances.FirstOrDefault(row => row.TenantId == tenantId && row.InstanceId == instanceId));

        public Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default)
        {
            Evidence.Add(evidence);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
            Guid tenantId,
            Guid instanceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationEvidenceRecord>>(
                Evidence.Where(row => row.TenantId == tenantId && row.InstanceId == instanceId).ToList());

        public Task<IReadOnlyList<RemediationInstanceRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationInstanceRecord>>(
                Instances.Where(row => row.TenantId == tenantId).ToList());

        public Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)>(([], 0));
    }

    private sealed class InMemoryRemediationPatternMatchRepository : IRemediationPatternMatchRepository
    {
        public RemediationPatternMatchResultRecord? ActiveMatch
        {
            get;
            set;
        }

        public Task DeactivateMatchesForFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertMatchResultAsync(
            RemediationPatternMatchResultRecord matchResult,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertConflictAsync(
            RemediationPatternMatchConflictRecord conflict,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(ActiveMatch);

        public Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternMatchResultRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternMatchConflictRecord>>([]);
    }

    private sealed class InMemoryRemediationPatternRepository : IRemediationPatternRepository
    {
        public List<RemediationPatternVersionRecord> Versions { get; } = [];

        public Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<RemediationPatternRecord?> TryGetPatternByIdAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RemediationPatternRecord?>(null);

        public Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(
            Guid tenantId,
            string patternKey,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RemediationPatternRecord?>(null);

        public Task<RemediationPatternVersionRecord?> TryGetVersionAsync(
            Guid tenantId,
            Guid patternId,
            string version,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Versions.FirstOrDefault(row =>
                row.TenantId == tenantId && row.PatternId == patternId && row.Version == version));

        public Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternVersionRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternApprovedVersionRecord>> ListApprovedVersionsForTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternApprovedVersionRecord>>([]);
    }

    private sealed class InMemoryOperationalSecurityExceptionRepository : IOperationalSecurityExceptionRepository
    {
        public bool HasActiveException
        {
            get;
            set;
        }

        public Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid exceptionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityExceptionRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

        public Task MarkExpiryProcessedAsync(
            Guid tenantId,
            Guid exceptionId,
            DateTime processedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RevokeAsync(
            Guid tenantId,
            Guid exceptionId,
            string revokedByActorKey,
            DateTime revokedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<bool> HasActiveExceptionForFindingAsync(
            Guid tenantId,
            Guid findingId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(HasActiveException);
    }

    private sealed class InMemorySnapshotRepository : IAzureInventorySnapshotRepository
    {
        public Dictionary<Guid, AzureInventorySnapshotDetailReadModel> Snapshots { get; } = [];

        public Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
            ScopeContext scope,
            Guid packageId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotDetailReadModel? snapshot) ? snapshot : null);

        public Task MaterializeSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            AzureInventorySnapshotMaterializeWriteRequest writeRequest,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
            ScopeContext scope,
            string subscriptionId,
            Guid newerSnapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<Guid?>(null);

        public Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
            ScopeContext scope,
            int page,
            int pageSize,
            string? subscriptionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<AzureInventorySnapshotRecord>, int)>(([], 0));
    }
}
