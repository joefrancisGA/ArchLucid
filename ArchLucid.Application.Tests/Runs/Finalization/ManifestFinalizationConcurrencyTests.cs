using System.Data;

using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.DecisionTraces;
using PersistenceDecisionTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.DecisionTraceDto;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>
///     Concurrency contract tests for <see cref="ManifestFinalizationService" /> (legacy in-memory path).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ManifestFinalizationConcurrencyTests
{
    [SkippableFact]
    public async Task FinalizeAsync_legacy_two_distinct_runs_finalize_successfully_sequentially()
    {
        Guid runIdA = Guid.NewGuid();
        Guid runIdB = Guid.NewGuid();
        Guid findingsA = Guid.NewGuid();
        Guid findingsB = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord headerA = CreateHeader(scope, runIdA, findingsA);
        RunRecord headerB = CreateHeader(scope, runIdB, findingsB);

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(scope, runIdA, It.IsAny<CancellationToken>())).ReturnsAsync(headerA);
        runs.Setup(r => r.GetByIdAsync(scope, runIdB, It.IsAny<CancellationToken>())).ReturnsAsync(headerB);

        Mock<IDecisionTraceRepository> traces = new();
        traces.Setup(t => t.SaveAsync(It.IsAny<PersistenceDecisionTraceDto>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IGoldenManifestRepository> golden = new();
        golden.Setup(g => g.SaveAsync(
                It.IsAny<GoldenManifest>(),
                scope,
                It.IsAny<SaveContractsManifestOptions>(),
                It.IsAny<IManifestHashService>(),
                It.IsAny<CancellationToken>(),
                null,
                null,
                It.IsAny<ManifestDocument>()))
            .ReturnsAsync((
                GoldenManifest _,
                ScopeContext _,
                SaveContractsManifestOptions _,
                IManifestHashService _,
                CancellationToken _,
                IDbConnection? _,
                IDbTransaction? _,
                ManifestDocument? body) => body!);

        golden.Setup(g => g.SupersedeUnreferencedActiveGoldenManifestsAsync(
                scope,
                It.IsAny<Guid>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<Guid>());

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        outbox.Setup(o => o.EnqueueAsync(
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ManifestFinalizationService sut = CreateSut(
            scopeProvider.Object,
            runs.Object,
            traces.Object,
            golden.Object,
            audit.Object,
            outbox.Object);

        ManifestFinalizationRequest reqA = CreateMinimalRequest(runIdA, findingsA);
        ManifestFinalizationRequest reqB = CreateMinimalRequest(runIdB, findingsB);

        ManifestFinalizationResult resA = await sut.FinalizeAsync(reqA, CancellationToken.None);
        ManifestFinalizationResult resB = await sut.FinalizeAsync(reqB, CancellationToken.None);

        resA.WasIdempotentReturn.Should().BeFalse();
        resB.WasIdempotentReturn.Should().BeFalse();
        resA.ManifestId.Should().NotBe(resB.ManifestId);
    }

    [SkippableFact]
    public async Task FinalizeAsync_legacy_status_Created_throws_ConflictException_as_unexpected_for_commit()
    {
        Guid runId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord header = new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            FindingsSnapshotId = findingsId
        };

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(header);

        ManifestFinalizationService sut = CreateSut(scopeProvider.Object, runs.Object);

        ManifestFinalizationRequest request = CreateMinimalRequest(runId, findingsId);

        Func<Task> act = async () => await sut.FinalizeAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    private static RunRecord CreateHeader(ScopeContext scope, Guid runId, Guid findingsId) => new()
    {
        RunId = runId,
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ScopeProjectId = scope.ProjectId,
        ProjectId = "proj",
        LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
        FindingsSnapshotId = findingsId
    };

    private static ManifestFinalizationService CreateSut(
        IScopeContextProvider scopeProvider,
        IRunRepository runRepository,
        IDecisionTraceRepository? traces = null,
        IGoldenManifestRepository? golden = null,
        IAuditService? audit = null,
        IIntegrationEventOutboxRepository? outbox = null)
    {
        return new ManifestFinalizationService(
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            scopeProvider,
            runRepository,
            CreateDefaultFindingsSnapshotRepository(),
            traces ?? Mock.Of<IDecisionTraceRepository>(),
            golden ?? Mock.Of<IGoldenManifestRepository>(),
            Mock.Of<IManifestHashService>(),
            audit ?? Mock.Of<IAuditService>(),
            outbox ?? Mock.Of<IIntegrationEventOutboxRepository>(),
            Mock.Of<IManifestFinalizationSqlRepository>(),
            new RunStateTransitionService());
    }

    private static IFindingsSnapshotRepository CreateDefaultFindingsSnapshotRepository()
    {
        Mock<IFindingsSnapshotRepository> mock = new();
        mock.Setup(f => f.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
                new FindingsSnapshot { FindingsSnapshotId = id, GenerationStatus = FindingsSnapshotGenerationStatus.Complete, Findings = [] });

        return mock.Object;
    }

    private static ManifestFinalizationRequest CreateMinimalRequest(Guid runId, Guid findingsId, Guid? decisionTraceId = null)
    {
        Guid tid = decisionTraceId ?? Guid.NewGuid();
        DecisionTrace trace = RuleAuditTrace.From(
            new RuleAuditTracePayload
            {
                DecisionTraceId = tid,
                RunId = runId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                RuleSetId = "rs",
                RuleSetVersion = "1",
                RuleSetHash = "h",
                AppliedRuleIds = [],
                AcceptedFindingIds = [],
                RejectedFindingIds = [],
                Notes = [],
            });

        ManifestDocument model = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = findingsId,
            DecisionTraceId = tid,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "hash",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
        };

        return new ManifestFinalizationRequest
        {
            RunId = runId,
            ExpectedFindingsSnapshotId = findingsId,
            ActorUserId = "u1",
            ActorUserName = "User One",
            ManifestModel = model,
            Contract = new GoldenManifest
            {
                RunId = runId.ToString("N"),
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ManifestMetadata { ManifestVersion = "v1" },
            },
            Keying = new SaveContractsManifestOptions
            {
                ManifestId = model.ManifestId,
                RunId = model.RunId,
                ContextSnapshotId = model.ContextSnapshotId,
                GraphSnapshotId = model.GraphSnapshotId,
                FindingsSnapshotId = model.FindingsSnapshotId,
                DecisionTraceId = tid,
                RuleSetId = model.RuleSetId,
                RuleSetVersion = model.RuleSetVersion,
                RuleSetHash = model.RuleSetHash,
                CreatedUtc = model.CreatedUtc,
            },
            Trace = trace,
        };
    }
}
