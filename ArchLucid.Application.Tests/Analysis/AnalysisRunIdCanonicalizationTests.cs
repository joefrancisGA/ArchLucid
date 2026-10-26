using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class AnalysisRunIdCanonicalizationTests
{
    [Fact]
    public void CanonicalRunIdForPersistenceOrNull_whitespace_only_returns_null()
    {
        AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull("   ").Should().BeNull();
        AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull("\t\n").Should().BeNull();
    }

    [Fact]
    public void CanonicalRunIdForLookup_trims_opaque_run_id()
    {
        AnalysisRunIdCanonicalization.CanonicalRunIdForLookup("  opaque-run-key  ")
            .Should().Be("opaque-run-key");
    }

    [Fact]
    public void CanonicalRunIdForLookupOrNull_whitespace_only_returns_null()
    {
        AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull("  ").Should().BeNull();
    }

    [Fact]
    public void EnumerateRunIdRepositoryLookupKeys_includes_uppercase_dashed_guid()
    {
        Guid runKey = Guid.Parse("14141414-1414-1414-1414-141414141414");
        string canonical = runKey.ToString("N");
        string dashedUpper = runKey.ToString("D").ToUpperInvariant();

        AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(canonical)
            .Should()
            .Contain(dashedUpper);
    }

    [Fact]
    public void EnumerateRunIdRepositoryLookupKeys_includes_uppercase_braced_guid()
    {
        Guid runKey = Guid.Parse("16161616-1616-1616-1616-161616161616");
        string canonical = runKey.ToString("N");
        string bracedUpper = runKey.ToString("B").ToUpperInvariant();

        AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(canonical)
            .Should()
            .Contain(bracedUpper);
    }

    [Fact]
    public void EnumerateRunIdRepositoryLookupKeys_includes_parentheses_guid()
    {
        Guid runKey = Guid.Parse("36363636-3636-3636-3636-363636363636");
        string canonical = runKey.ToString("N");
        string parentheses = runKey.ToString("P");

        AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(canonical)
            .Should()
            .Contain(parentheses);
    }

    [Fact]
    public void AgentResultsAppearAnchoredToRun_returns_false_when_any_result_lacks_run_anchor()
    {
        Guid runKey = Guid.Parse("19191919-1919-1919-1919-191919191919");
        string canonical = runKey.ToString("N");

        AnalysisRunIdCanonicalization.AgentResultsAppearAnchoredToRun(
                [new AgentResult { RunId = string.Empty, AgentType = AgentType.Topology }],
                canonical)
            .Should()
            .BeFalse();

        AnalysisRunIdCanonicalization.AgentResultsAppearAnchoredToRun(
                [new AgentResult { RunId = canonical, AgentType = AgentType.Topology }],
                canonical)
            .Should()
            .BeTrue();
    }

    [Fact]
    public async Task CompareQuality_LoadAgentResultsByRunIdAsync_merges_results_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "cccccccccccccccccccccccccccccccc";
        const string legacyUpperRunId = "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        AgentResult canonicalKeyed = new()
        {
            ResultId = "result-canonical-repo-key",
            RunId = canonicalRunId,
            TaskId = "task-canonical",
            AgentType = AgentType.Compliance,
            CreatedUtc = DateTime.UtcNow,
        };
        AgentResult legacyKeyed = new()
        {
            ResultId = "result-legacy-repo-key",
            RunId = legacyUpperRunId,
            TaskId = "task-legacy",
            AgentType = AgentType.Topology,
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([canonicalKeyed]);
        resultRepository
            .Setup(r => r.GetByRunIdAsync(scope, legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyKeyed]);
        resultRepository
            .Setup(r => r.GetByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentResult> merged =
            await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                resultRepository.Object,
                scope,
                canonicalRunId,
                useRollupProjection: false,
                CancellationToken.None);

        merged.Should().Contain(r => r.ResultId == "result-canonical-repo-key");
        merged.Should().Contain(r => r.ResultId == "result-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_LoadAgentResultsByRunIdAsync_orders_merged_results_by_created_utc_descending()
    {
        const string canonicalRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        const string legacyUpperRunId = "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        AgentResult older = new()
        {
            ResultId = "result-older-canonical-key",
            RunId = canonicalRunId,
            TaskId = "task-older",
            AgentType = AgentType.Compliance,
            CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
        };
        AgentResult newer = new()
        {
            ResultId = "result-newer-legacy-key",
            RunId = legacyUpperRunId,
            TaskId = "task-newer",
            AgentType = AgentType.Topology,
            CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
        };

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([older]);
        resultRepository
            .Setup(r => r.GetByRunIdAsync(scope, legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([newer]);
        resultRepository
            .Setup(r => r.GetByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentResult> merged =
            await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                resultRepository.Object,
                scope,
                canonicalRunId,
                useRollupProjection: false,
                CancellationToken.None);

        merged.Should().HaveCount(2);
        merged[0].ResultId.Should().Be("result-newer-legacy-key");
        merged[1].ResultId.Should().Be("result-older-canonical-key");
    }

    [Fact]
    public async Task CompareQuality_LoadExecutionTracesByRunIdAsync_merges_traces_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "dddddddddddddddddddddddddddddddd";
        const string legacyUpperRunId = "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD";

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        AgentExecutionTrace canonicalKeyed = new()
        {
            TraceId = "trace-canonical-repo-key",
            RunId = canonicalRunId,
            AgentType = AgentType.Compliance,
        };
        AgentExecutionTrace legacyKeyed = new()
        {
            TraceId = "trace-legacy-repo-key",
            RunId = legacyUpperRunId,
            AgentType = AgentType.Topology,
        };

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([canonicalKeyed]);
        traceRepository
            .Setup(r => r.GetByRunIdAsync(scope, legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyKeyed]);
        traceRepository
            .Setup(r => r.GetByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentExecutionTrace> merged =
            await AnalysisRunIdCanonicalization.LoadExecutionTracesByRunIdAsync(
                traceRepository.Object,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().Contain(t => t.TraceId == "trace-canonical-repo-key");
        merged.Should().Contain(t => t.TraceId == "trace-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_LoadDecisionNodesByRunIdAsync_merges_nodes_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "dddddddddddddddddddddddddddddddd";
        const string legacyUpperRunId = "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD";

        DecisionNodeRecord canonicalKeyed = new()
        {
            DecisionId = "decision-canonical-repo-key",
            RunId = canonicalRunId,
            Topic = "TopologyAcceptance",
            CreatedUtc = DateTime.UtcNow,
        };
        DecisionNodeRecord legacyKeyed = new()
        {
            DecisionId = "decision-legacy-repo-key",
            RunId = legacyUpperRunId,
            Topic = "SecurityGate",
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IDecisionNodeRepository> decisionNodeRepository = new();
        decisionNodeRepository
            .Setup(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([canonicalKeyed]);
        decisionNodeRepository
            .Setup(r => r.GetByRunIdAsync(legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyKeyed]);
        decisionNodeRepository
            .Setup(r => r.GetByRunIdAsync(
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<DecisionNodeRecord> merged =
            await AnalysisRunIdCanonicalization.LoadDecisionNodesByRunIdAsync(
                decisionNodeRepository.Object,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().Contain(n => n.DecisionId == "decision-canonical-repo-key");
        merged.Should().Contain(n => n.DecisionId == "decision-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_LoadAgentTasksByRunIdAsync_merges_tasks_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string legacyUpperRunId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        AgentTask canonicalKeyed = new()
        {
            TaskId = "task-canonical-repo-key",
            RunId = canonicalRunId,
            AgentType = AgentType.Compliance,
            CreatedUtc = DateTime.UtcNow,
        };
        AgentTask legacyKeyed = new()
        {
            TaskId = "task-legacy-repo-key",
            RunId = legacyUpperRunId,
            AgentType = AgentType.Topology,
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IAgentTaskRepository> taskRepository = new();
        taskRepository
            .Setup(r => r.GetByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([canonicalKeyed]);
        taskRepository
            .Setup(r => r.GetByRunIdAsync(scope, legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyKeyed]);
        taskRepository
            .Setup(r => r.GetByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentTask> merged =
            await AnalysisRunIdCanonicalization.LoadAgentTasksByRunIdAsync(
                taskRepository.Object,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().Contain(t => t.TaskId == "task-canonical-repo-key");
        merged.Should().Contain(t => t.TaskId == "task-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_LoadEvidencePackageByRunIdAsync_prefers_newer_package_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "ffffffffffffffffffffffffffffffff";
        const string legacyUpperRunId = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

        AgentEvidencePackage olderCanonical = new()
        {
            EvidencePackageId = "pkg-canonical-repo-key",
            RunId = canonicalRunId,
            SystemName = "older",
            CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
        };
        AgentEvidencePackage newerLegacy = new()
        {
            EvidencePackageId = "pkg-legacy-repo-key",
            RunId = legacyUpperRunId,
            SystemName = "newer",
            CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
        };

        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        evidenceRepository
            .Setup(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(olderCanonical);
        evidenceRepository
            .Setup(r => r.GetByRunIdAsync(legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(newerLegacy);
        evidenceRepository
            .Setup(r => r.GetByRunIdAsync(
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);

        AgentEvidencePackage? loaded =
            await AnalysisRunIdCanonicalization.LoadEvidencePackageByRunIdAsync(
                evidenceRepository.Object,
                canonicalRunId,
                CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.EvidencePackageId.Should().Be("pkg-legacy-repo-key");
        loaded.SystemName.Should().Be("newer");
    }

    [Fact]
    public async Task CompareQuality_LoadLlmCostSlicesByRunIdAsync_dedupes_slices_when_alternate_keys_repeat_rows()
    {
        const string canonicalRunId = "abababababababababababababababab";
        const string legacyUpperRunId = "ABABABABABABABABABABABABABABABAB";

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        AgentExecutionTraceLlmCostSlice sharedSlice = new()
        {
            ModelDeploymentName = "gpt-4o",
            InputTokenCount = 100,
            OutputTokenCount = 25,
            ReasoningTokenCount = 0,
        };

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([sharedSlice]);
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(scope, legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([sharedSlice]);
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> merged =
            await AnalysisRunIdCanonicalization.LoadLlmCostSlicesByRunIdAsync(
                traceRepository.Object,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().ContainSingle();
        merged[0].InputTokenCount.Should().Be(100);
    }

    [Fact]
    public async Task CompareQuality_LoadLlmCostSlicesByRunIdAsync_merges_distinct_slices_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd";
        const string legacyUpperRunId = "CDCDCDCDCDCDCDCDCDCDCDCDCDCDCDCD";

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        AgentExecutionTraceLlmCostSlice canonicalSlice = new()
        {
            ModelDeploymentName = "gpt-4o",
            InputTokenCount = 80,
            OutputTokenCount = 10,
        };
        AgentExecutionTraceLlmCostSlice legacySlice = new()
        {
            ModelDeploymentName = "gpt-4o-mini",
            InputTokenCount = 40,
            OutputTokenCount = 5,
        };

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([canonicalSlice]);
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(scope, legacyUpperRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacySlice]);
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpperRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> merged =
            await AnalysisRunIdCanonicalization.LoadLlmCostSlicesByRunIdAsync(
                traceRepository.Object,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().HaveCount(2);
        merged.Should().Contain(s => s.ModelDeploymentName == "gpt-4o" && s.InputTokenCount == 80);
        merged.Should().Contain(s => s.ModelDeploymentName == "gpt-4o-mini" && s.InputTokenCount == 40);
    }
}
