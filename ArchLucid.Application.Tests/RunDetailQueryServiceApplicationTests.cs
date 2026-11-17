using ArchLucid.Application;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Application.Tests;

/// <summary>
/// <see cref="RunDetailQueryService"/> coverage in the Application test assembly (broken manifest flag, trace load guard).
/// </summary>
/// <remarks>
/// ADR 0030 PR A3 (2026-04-24): the legacy <c>ICoordinatorDecisionTraceRepository</c> dependency was
/// removed; decision traces are now read from <see cref="IDecisionTraceRepository"/> using
/// <see cref="RunRecord.DecisionTraceId"/>.
/// </remarks>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunDetailQueryServiceApplicationTests
{
    private static ScopeContext NewScope() =>
        new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

    [Fact]
    public async Task CompareQuality_GetRunDetailAsync_passes_canonical_run_id_to_lane_b_compose_when_casing_differs()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("99999999-9999-9999-9999-999999999999");
        string runN = runGuid.ToString("N");
        Guid findingsSnapshotId = Guid.Parse("99999999-9999-9999-9999-99999999aaaa");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentTaskRepository> taskRepo = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IRunStageOutcomesRepository> stageOutcomes = new();
        Mock<IAgentExecutionTraceRepository> executionTraceRepo = new();
        Mock<IFindingRecordMuteRepository> muteRepo = new();
        Mock<IFindingSemanticSupportBandLaneBComposeService> laneBCompose = new();
        string? capturedRunId = null;

        muteRepo
            .Setup(r => r.GetMuteFlagsAsync(findingsSnapshotId, scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, FindingMuteFlag>(StringComparer.Ordinal));

        laneBCompose
            .Setup(s => s.ApplyToAgentResultsAsync(
                It.IsAny<string>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, ScopeContext, IReadOnlyList<AgentResult>, CancellationToken>(
                (id, _, _, _) => capturedRunId = id)
            .Returns(Task.CompletedTask);

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-lane-b",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            FindingsSnapshotId = findingsSnapshotId,
        };

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        taskRepo.Setup(r => r.GetByRunIdAsync(scope, runN, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        executionTraceRepo
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(scope, runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        stageOutcomes
            .Setup(r => r.ListByRunIdAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepo = new(enrichmentRepo.Object);
        await resultRepo.CreateAsync(CommitReady(runN, AgentType.Topology), CancellationToken.None);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            taskRepo.Object,
            resultRepo,
            unifiedReader.Object,
            Mock.Of<IDecisionTraceRepository>(),
            muteRepo.Object,
            executionTraceRepo.Object,
            Mock.Of<ILlmCostEstimator>(),
            new FindingTrustLabelMapper(),
            stageOutcomes.Object,
            new RunStateTransitionService(),
            Mock.Of<ILogger<RunDetailQueryService>>(),
            semanticSupportBandLaneBComposeService: laneBCompose.Object);

        await sut.GetRunDetailAsync(runN.ToUpperInvariant());

        capturedRunId.Should().Be(runN);
    }

    [Fact]
    public async Task CompareQuality_GetRunDetailAsync_loads_tasks_when_stored_run_id_differs_only_by_casing()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc");
        string runN = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        InMemoryAgentTaskRepository taskRepo = new();

        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepo = new(enrichmentRepo.Object);

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-task-casing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        await taskRepo.CreateManyAsync(
            [new AgentTask { RunId = runN.ToUpperInvariant(), TaskId = "task-casing-1", AgentType = AgentType.Topology }],
            CancellationToken.None);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            taskRepo,
            resultRepo,
            unifiedReader.Object,
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IFindingRecordMuteRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ILlmCostEstimator>(),
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            Mock.Of<ILogger<RunDetailQueryService>>());

        ArchitectureRunDetail? detail = await sut.GetRunDetailAsync(runN);

        detail.Should().NotBeNull();
        detail!.Tasks.Should().ContainSingle();
        detail.Tasks[0].TaskId.Should().Be("task-casing-1");
    }

    [Fact]
    public async Task CompareQuality_GetRunDetailAsync_merges_tasks_when_rows_are_split_across_alternate_run_id_keys()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd");
        string runN = runGuid.ToString("N");
        string runUpper = runN.ToUpperInvariant();

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        InMemoryAgentTaskRepository taskRepo = new();

        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepo = new(enrichmentRepo.Object);

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-task-split-keys",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        await taskRepo.CreateManyAsync(
            [
                new AgentTask { RunId = runN, TaskId = "task-canonical-key", AgentType = AgentType.Compliance },
                new AgentTask { RunId = runUpper, TaskId = "task-legacy-key", AgentType = AgentType.Topology },
            ],
            CancellationToken.None);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            taskRepo,
            resultRepo,
            unifiedReader.Object,
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IFindingRecordMuteRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ILlmCostEstimator>(),
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            Mock.Of<ILogger<RunDetailQueryService>>());

        ArchitectureRunDetail? detail = await sut.GetRunDetailAsync(runN);

        detail.Should().NotBeNull();
        detail!.Tasks.Should().Contain(t => t.TaskId == "task-canonical-key");
        detail.Tasks.Should().Contain(t => t.TaskId == "task-legacy-key");
    }

    [Fact]
    public async Task CompareQuality_GetRunDetailAsync_loads_llm_cost_when_trace_run_id_differs_only_by_casing()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("abababab-abab-abab-abab-abababababab");
        string runN = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentTaskRepository> taskRepo = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        InMemoryAgentExecutionTraceRepository traceRepo = new();

        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepo = new(enrichmentRepo.Object);

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-trace-cost-casing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        taskRepo.Setup(r => r.GetByRunIdAsync(scope, runN, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        await traceRepo.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-cost-casing",
                RunId = runN.ToUpperInvariant(),
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 100,
                OutputTokenCount = 20,
            },
            CancellationToken.None);

        Mock<ILlmCostEstimator> llmCostEstimator = new();
        llmCostEstimator
            .Setup(e => e.EstimateUsd(100, 20, 0, "gpt-4o"))
            .Returns(0.42m);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            taskRepo.Object,
            resultRepo,
            unifiedReader.Object,
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IFindingRecordMuteRepository>(),
            traceRepo,
            llmCostEstimator.Object,
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            Mock.Of<ILogger<RunDetailQueryService>>());

        ArchitectureRunDetail? detail = await sut.GetRunDetailAsync(runN);

        detail.Should().NotBeNull();
        detail!.AgentExecutionLlmCostEstimate.Should().NotBeNull();
        detail.AgentExecutionLlmCostEstimate!.EstimatedCostUsd.Should().Be(0.42m);
    }

    [Fact]
    public async Task CompareQuality_GetRunDetailForRollupAsync_loads_results_when_run_id_differs_only_by_casing()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("88888888-8888-8888-8888-888888888888");
        string runN = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepo = new(enrichmentRepo.Object);

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-z",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        await resultRepo.CreateAsync(CommitReady(runN, AgentType.Topology), CancellationToken.None);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            Mock.Of<IAgentTaskRepository>(),
            resultRepo,
            unifiedReader.Object,
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IFindingRecordMuteRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ILlmCostEstimator>(),
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            Mock.Of<ILogger<RunDetailQueryService>>());

        ArchitectureRunDetail? detail = await sut.GetRunDetailForRollupAsync(runN.ToUpperInvariant());

        detail.Should().NotBeNull();
        detail!.Results.Should().ContainSingle();
    }

    [Fact]
    public async Task CompareQuality_GetRunDetailForRollupAsync_loads_results_when_stored_run_id_differs_only_by_casing()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("99999999-9999-9999-9999-999999999999");
        string runN = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepo = new(enrichmentRepo.Object);

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-stored-casing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        await resultRepo.CreateAsync(CommitReady(runN.ToUpperInvariant(), AgentType.Topology), CancellationToken.None);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            Mock.Of<IAgentTaskRepository>(),
            resultRepo,
            unifiedReader.Object,
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IFindingRecordMuteRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ILlmCostEstimator>(),
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            Mock.Of<ILogger<RunDetailQueryService>>());

        ArchitectureRunDetail? detail = await sut.GetRunDetailForRollupAsync(runN);

        detail.Should().NotBeNull();
        detail!.Results.Should().ContainSingle();
    }

    [SkippableFact]
    public async Task GetRunDetailAsync_returns_null_for_whitespace_run_id_without_querying_repository()
    {
        Mock<IRunRepository> runRepo = new();
        RunDetailQueryService sut = CreateMinimalSut(runRepo);

        ArchitectureRunDetail? detail = await sut.GetRunDetailAsync("   ", CancellationToken.None);

        detail.Should().BeNull();
        runRepo.Verify(
            r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task GetRunDetailAsync_when_manifest_version_set_but_manifest_missing_sets_HasBrokenManifestReference()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string runN = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentTaskRepository> taskRepo = new();
        Mock<IAgentResultRepository> resultRepo = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IDecisionTraceRepository> authorityTraceRepo = new();
        Mock<IFindingRecordMuteRepository> muteRepo = new();
        Mock<IAgentExecutionTraceRepository> executionTraceRepo = new();
        Mock<ILlmCostEstimator> llmCostEstimator = new();

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        executionTraceRepo
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-x",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentManifestVersion = "v-missing",
        };

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        taskRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            taskRepo.Object,
            resultRepo.Object,
            unifiedReader.Object,
            authorityTraceRepo.Object,
            muteRepo.Object,
            executionTraceRepo.Object,
            llmCostEstimator.Object,
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            new Mock<ILogger<RunDetailQueryService>>().Object);

        ArchitectureRunDetail? detail = await sut.GetRunDetailAsync(runN);

        detail.Should().NotBeNull();
        detail.Manifest.Should().BeNull();
        detail.HasBrokenManifestReference.Should().BeTrue();
        authorityTraceRepo.Verify(
            t => t.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task GetRunDetailAsync_when_manifest_resolved_and_authority_trace_present_loads_trace()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("66666666-6666-6666-6666-666666666666");
        Guid traceId = Guid.Parse("66666666-6666-6666-6666-66666666aaaa");
        string runN = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentTaskRepository> taskRepo = new();
        Mock<IAgentResultRepository> resultRepo = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IDecisionTraceRepository> authorityTraceRepo = new();
        Mock<IFindingRecordMuteRepository> muteRepo = new();
        Mock<IAgentExecutionTraceRepository> executionTraceRepo = new();
        Mock<ILlmCostEstimator> llmCostEstimator = new();

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        executionTraceRepo
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-y",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentManifestVersion = "v1",
            DecisionTraceId = traceId,
        };

        GoldenManifest manifest = new()
        {
            RunId = runN,
            SystemName = "S",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "v1" },
        };

        DecisionTraceDto authorityTrace = RunEventTraceDto.From(new RunEventTracePayload
        {
            TraceId = traceId.ToString("N"), RunId = runN, EventType = "Commit", EventDescription = "authority commit",
        });

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        taskRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);
        authorityTraceRepo
            .Setup(r => r.GetByIdAsync(scope, traceId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityTrace);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            taskRepo.Object,
            resultRepo.Object,
            unifiedReader.Object,
            authorityTraceRepo.Object,
            muteRepo.Object,
            executionTraceRepo.Object,
            llmCostEstimator.Object,
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            new Mock<ILogger<RunDetailQueryService>>().Object);

        ArchitectureRunDetail? detail = await sut.GetRunDetailAsync(runN);

        detail.Should().NotBeNull();
        detail.HasBrokenManifestReference.Should().BeFalse();
        detail.DecisionTraces.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetRunDetailAsync_agent_task_ready_without_authority_stages_sets_only_AgentTaskLoopComplete()
    {
        ScopeContext scope = NewScope();
        Guid runGuid = Guid.Parse("77777777-7777-7777-7777-777777777777");
        string runN = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentTaskRepository> taskRepo = new();
        Mock<IAgentResultRepository> resultRepo = new();
        Mock<IUnifiedGoldenManifestReader> unifiedReader = new();
        Mock<IDecisionTraceRepository> authorityTraceRepo = new();
        Mock<IFindingRecordMuteRepository> muteRepo = new();
        Mock<IAgentExecutionTraceRepository> executionTraceRepo = new();
        Mock<ILlmCostEstimator> llmCostEstimator = new();
        Mock<IRunStageOutcomesRepository> stagesRepo = new();

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        executionTraceRepo
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());
        stagesRepo
            .Setup(r => r.ListByRunIdAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            ArchitectureRequestId = "req-agent-task",
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        List<AgentResult> results =
        [
            CommitReady(runN, AgentType.Topology),
            CommitReady(runN, AgentType.Cost),
            CommitReady(runN, AgentType.Compliance),
            CommitReady(runN, AgentType.Critic)
        ];

        runRepo.Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(record);
        taskRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runN, It.IsAny<CancellationToken>())).ReturnsAsync(results);
        unifiedReader
            .Setup(r => r.ReadByRunIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        RunDetailQueryService sut = new(
            runRepo.Object,
            scopeProvider.Object,
            taskRepo.Object,
            resultRepo.Object,
            unifiedReader.Object,
            authorityTraceRepo.Object,
            muteRepo.Object,
            executionTraceRepo.Object,
            llmCostEstimator.Object,
            new FindingTrustLabelMapper(),
            stagesRepo.Object,
            new RunStateTransitionService(),
            new Mock<ILogger<RunDetailQueryService>>().Object);

        ArchitectureRunDetail? detail = await sut.GetRunDetailAsync(runN);

        detail.Should().NotBeNull();
        detail.AgentTaskLoopComplete.Should().BeTrue();
        detail.AuthorityPipelineComplete.Should().BeFalse();
    }

    private static RunDetailQueryService CreateMinimalSut(Mock<IRunRepository> runRepo)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(NewScope());

        return new RunDetailQueryService(
            runRepo.Object,
            scopeProvider.Object,
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IUnifiedGoldenManifestReader>(),
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IFindingRecordMuteRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ILlmCostEstimator>(),
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            Mock.Of<ILogger<RunDetailQueryService>>());
    }

    private static AgentResult CommitReady(string runId, AgentType agentType)
    {
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            TaskId = Guid.NewGuid().ToString("N"),
            AgentType = agentType,
            Claims = ["ok"],
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }
}
