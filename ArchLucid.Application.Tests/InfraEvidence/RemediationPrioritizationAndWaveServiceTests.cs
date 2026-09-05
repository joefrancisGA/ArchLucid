using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Application.InfraEvidence.RemediationWaves;
using ArchLucid.Contracts.Common;
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
public sealed class RemediationPrioritizationAndWaveServiceTests
{
    private static readonly Guid TenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task CreateWave_with_target_size_7_selects_seven_members()
    {
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        InMemoryRemediationPrioritizationRepository prioritizationRepository = new();
        InMemoryRemediationWaveRepository waveRepository = new();
        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        InMemoryRemediationPatternRepository patternRepository = new();
        InMemoryOperationalSecurityExceptionRepository exceptionRepository = new();

        for (int index = 0; index < 12; index++)
        {
            Guid findingId = Guid.NewGuid();

            findingRepository.Findings.Add(CreateFinding(
                findingId,
                TenantA,
                severity: index < 4 ? "critical" : index < 8 ? "high" : "medium",
                exploitability: index < 2 ? "critical" : "low"));
        }

        RemediationPrioritizationService prioritizationService = CreatePrioritizationService(
            findingRepository,
            exceptionRepository,
            matchRepository,
            patternRepository,
            prioritizationRepository);

        RemediationWaveService waveService = CreateWaveService(
            waveRepository,
            prioritizationService,
            instanceRepository);

        RemediationWaveOperationResult result = await waveService.CreateWaveAsync(
            CreateScope(TenantA),
            "wave-seven",
            targetSize: 7,
            explicitCloudResourceIds: null,
            "operator-1");

        result.Succeeded.Should().BeTrue();
        result.MemberCount.Should().Be(7);

        IReadOnlyList<RemediationWaveMemberRecord> members =
            await waveRepository.ListMembersByWaveAsync(TenantA, result.WaveId!.Value);

        members.Should().HaveCount(7);
        members.Select(item => item.PriorityRank).Should().BeEquivalentTo(Enumerable.Range(1, 7));
    }

    [Fact]
    public async Task Weight_change_reranks_findings()
    {
        Guid lowSeverityId = Guid.NewGuid();
        Guid highSeverityId = Guid.NewGuid();

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        findingRepository.Findings.Add(CreateFinding(lowSeverityId, TenantA, severity: "low", exploitability: "critical"));
        findingRepository.Findings.Add(CreateFinding(highSeverityId, TenantA, severity: "critical", exploitability: "low"));

        InMemoryRemediationPrioritizationRepository prioritizationRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        InMemoryRemediationPatternRepository patternRepository = new();
        InMemoryOperationalSecurityExceptionRepository exceptionRepository = new();

        RemediationPrioritizationService sut = CreatePrioritizationService(
            findingRepository,
            exceptionRepository,
            matchRepository,
            patternRepository,
            prioritizationRepository);

        ScopeContext scope = CreateScope(TenantA);

        IReadOnlyList<RemediationPrioritizedFinding> defaultRanked =
            await sut.RankOpenFindingsAsync(scope, "operator");

        defaultRanked[0].FindingId.Should().Be(highSeverityId);

        Dictionary<RemediationRiskFactor, decimal> exploitHeavy = RemediationRiskScoreEvaluator.DefaultWeights()
            .ToDictionary(item => item.Key, item => item.Value);

        exploitHeavy[RemediationRiskFactor.Severity] = 0.02m;
        exploitHeavy[RemediationRiskFactor.Exploitability] = 0.40m;

        await sut.UpdateWeightsAsync(scope, exploitHeavy, "operator");

        IReadOnlyList<RemediationPrioritizedFinding> reranked =
            await sut.RankOpenFindingsAsync(scope, "operator");

        reranked[0].FindingId.Should().Be(lowSeverityId);
        reranked[0].TotalScore.Should().NotBe(defaultRanked.Single(item => item.FindingId == lowSeverityId).TotalScore);
    }

    [Fact]
    public async Task Metrics_are_isolated_by_tenant()
    {
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        findingRepository.Findings.Add(CreateFinding(Guid.NewGuid(), TenantA, severity: "critical"));
        findingRepository.Findings.Add(CreateFinding(Guid.NewGuid(), TenantA, severity: "high"));
        findingRepository.Findings.Add(CreateFinding(Guid.NewGuid(), TenantB, severity: "critical"));
        findingRepository.Findings.Add(CreateFinding(Guid.NewGuid(), TenantB, severity: "critical"));

        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryOperationalSecurityExceptionRepository exceptionRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        InMemoryRemediationPrioritizationRepository prioritizationRepository = new();

        RemediationFactoryMetricsService metricsService = new(
            findingRepository,
            exceptionRepository,
            matchRepository,
            instanceRepository,
            prioritizationRepository);

        RemediationFactoryMetrics tenantAMetrics =
            await metricsService.GetMetricsAsync(CreateScope(TenantA));

        tenantAMetrics.OpenFindings.Should().Be(2);
        tenantAMetrics.CriticalExposureCount.Should().Be(1);

        RemediationFactoryMetrics tenantBMetrics =
            await metricsService.GetMetricsAsync(CreateScope(TenantB));

        tenantBMetrics.OpenFindings.Should().Be(2);
        tenantBMetrics.CriticalExposureCount.Should().Be(2);
    }

    [Fact]
    public void Risk_score_evaluator_exposes_all_eleven_factors()
    {
        OperationalSecurityFindingRecord finding = CreateFinding(Guid.NewGuid(), TenantA, severity: "high");

        RemediationRiskScoreResult result = RemediationRiskScoreEvaluator.Evaluate(
            finding,
            [],
            hasActiveException: false,
            compensatingControls: null,
            RemediationAutomationLevel.Guided,
            patternHasRollback: true);

        result.Contributions.Should().HaveCount(11);
        result.ExplanationSummary.Should().Contain(RemediationPrioritizationConstants.RuleVersion);
    }

    private static RemediationPrioritizationService CreatePrioritizationService(
        InMemoryOperationalSecurityFindingRepository findingRepository,
        InMemoryOperationalSecurityExceptionRepository exceptionRepository,
        InMemoryRemediationPatternMatchRepository matchRepository,
        InMemoryRemediationPatternRepository patternRepository,
        InMemoryRemediationPrioritizationRepository prioritizationRepository) =>
        new(
            findingRepository,
            exceptionRepository,
            matchRepository,
            patternRepository,
            prioritizationRepository);

    private static RemediationWaveService CreateWaveService(
        InMemoryRemediationWaveRepository waveRepository,
        RemediationPrioritizationService prioritizationService,
        InMemoryRemediationInstanceRepository instanceRepository)
    {
        RemediationInstanceService instanceService = new(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            new InMemoryRemediationPatternRepository(),
            new InMemoryOperationalSecurityExceptionRepository(),
            new InMemorySnapshotRepository(),
            new InMemoryAdvisoryTerraformService(),
            Mock.Of<IAuditService>(),
            Mock.Of<IOperationalSecurityFindingRepository>(),
            Mock.Of<IAuditManualEvidenceRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>());

        return new RemediationWaveService(
            waveRepository,
            prioritizationService,
            instanceService,
            instanceRepository);
    }

    private static ScopeContext CreateScope(Guid tenantId) =>
        new()
        {
            TenantId = tenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static OperationalSecurityFindingRecord CreateFinding(
        Guid findingId,
        Guid tenantId,
        string severity,
        string exploitability = "medium") =>
        new()
        {
            FindingId = findingId,
            TenantId = tenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "Defender",
            SourceFindingId = findingId.ToString("N"),
            Title = "Test finding",
            Severity = severity,
            Exploitability = exploitability,
            Exposure = "medium",
            BusinessCriticality = "medium",
            BlastRadius = "medium",
            Status = OperationalSecurityFindingStatus.Open,
            FirstObservedUtc = DateTime.UtcNow.AddDays(-3),
            LastObservedUtc = DateTime.UtcNow,
            CreatedUtc = DateTime.UtcNow.AddDays(-3),
            UpdatedUtc = DateTime.UtcNow,
        };

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> Findings { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Findings.FirstOrDefault(item => item.TenantId == tenantId && item.FindingId == findingId));

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<OperationalSecurityFindingRecord> query = Findings.Where(item => item.TenantId == tenantId);

            if (status.HasValue)
                query = query.Where(item => item.Status == status.Value);

            return Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(query.ToList());
        }

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class InMemoryRemediationPrioritizationRepository : IRemediationPrioritizationRepository
    {
        public Dictionary<Guid, RemediationPrioritizationWeightsRecord> Weights { get; } = [];

        public Dictionary<(Guid TenantId, Guid FindingId), RemediationPrioritizationScoreRecord> Scores { get; } = [];

        public Task<RemediationPrioritizationWeightsRecord?> TryGetWeightsAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Weights.TryGetValue(tenantId, out RemediationPrioritizationWeightsRecord? value) ? value : null);

        public Task UpsertWeightsAsync(
            RemediationPrioritizationWeightsRecord weights,
            CancellationToken cancellationToken = default)
        {
            Weights[weights.TenantId] = weights;
            return Task.CompletedTask;
        }

        public Task UpsertScoreAsync(
            RemediationPrioritizationScoreRecord score,
            CancellationToken cancellationToken = default)
        {
            Scores[(score.TenantId, score.FindingId)] = score;
            return Task.CompletedTask;
        }

        public Task<RemediationPrioritizationScoreRecord?> TryGetScoreAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
        {
            Scores.TryGetValue((tenantId, findingId), out RemediationPrioritizationScoreRecord? score);
            return Task.FromResult(score);
        }

        public Task<IReadOnlyList<RemediationPrioritizationScoreRecord>> ListScoresByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPrioritizationScoreRecord>>(
                Scores.Values.Where(item => item.TenantId == tenantId).ToList());
    }

    private sealed class InMemoryRemediationWaveRepository : IRemediationWaveRepository
    {
        public List<RemediationWaveRecord> Waves { get; } = [];

        public List<RemediationWaveMemberRecord> Members { get; } = [];

        public Task InsertWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default)
        {
            Waves.Add(wave);
            return Task.CompletedTask;
        }

        public Task UpdateWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<RemediationWaveRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid waveId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Waves.FirstOrDefault(item => item.TenantId == tenantId && item.WaveId == waveId));

        public Task<IReadOnlyList<RemediationWaveRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationWaveRecord>>(Waves.Where(item => item.TenantId == tenantId).ToList());

        public Task InsertMemberAsync(RemediationWaveMemberRecord member, CancellationToken cancellationToken = default)
        {
            Members.Add(member);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<RemediationWaveMemberRecord>> ListMembersByWaveAsync(
            Guid tenantId,
            Guid waveId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationWaveMemberRecord>>(
                Members.Where(item => item.TenantId == tenantId && item.WaveId == waveId).ToList());
    }

    private sealed class InMemoryRemediationInstanceRepository : IRemediationInstanceRepository
    {
        public List<RemediationInstanceRecord> Instances { get; } = [];

        public Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
        {
            Instances.Add(instance);
            return Task.CompletedTask;
        }

        public Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
        {
            Instances.RemoveAll(item => item.InstanceId == instance.InstanceId);
            Instances.Add(instance);
            return Task.CompletedTask;
        }

        public Task<RemediationInstanceRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid instanceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Instances.FirstOrDefault(item => item.TenantId == tenantId && item.InstanceId == instanceId));

        public Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
            Guid tenantId,
            Guid instanceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationEvidenceRecord>>([]);

        public Task<IReadOnlyList<RemediationInstanceRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationInstanceRecord>>(Instances.Where(item => item.TenantId == tenantId).ToList());
    }

    private sealed class InMemoryRemediationPatternMatchRepository : IRemediationPatternMatchRepository
    {
        public Task DeactivateMatchesForFindingAsync(Guid tenantId, Guid findingId, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertMatchResultAsync(RemediationPatternMatchResultRecord matchResult, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertConflictAsync(RemediationPatternMatchConflictRecord conflict, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RemediationPatternMatchResultRecord?>(null);

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
            Task.FromResult<RemediationPatternVersionRecord?>(null);

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
            Task.FromResult(false);
    }

    private sealed class InMemorySnapshotRepository : IAzureInventorySnapshotRepository
    {
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
            Task.FromResult<AzureInventorySnapshotDetailReadModel?>(null);

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
    }

    private sealed class InMemoryAdvisoryTerraformService : IAdvisoryTerraformRepresentationService
    {
        public Task<AdvisoryTerraformRepresentationResult> TryBuildFromSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            bool aztfexportAvailable,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new AdvisoryTerraformRepresentationResult { Succeeded = true });
    }
}
