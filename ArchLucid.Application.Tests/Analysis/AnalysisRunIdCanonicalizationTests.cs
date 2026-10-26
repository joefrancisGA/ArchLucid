using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Persistence;
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
    public void CompareQuality_AgentResultsAppearAnchoredToRun_returns_false_when_all_results_are_null()
    {
        Guid runKey = Guid.Parse("21212121-2121-2121-2121-212121212121");
        string canonical = runKey.ToString("N");

        AnalysisRunIdCanonicalization.AgentResultsAppearAnchoredToRun([null!, null!], canonical)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void CompareQuality_AgentResultsAppearAnchoredToRun_returns_false_when_hydrated_list_contains_null_with_anchored_sibling()
    {
        Guid runKey = Guid.Parse("23232323-2323-2323-2323-232323232323");
        string canonical = runKey.ToString("N");

        AnalysisRunIdCanonicalization.AgentResultsAppearAnchoredToRun(
                [null!, new AgentResult { RunId = canonical, AgentType = AgentType.Topology }],
                canonical)
            .Should()
            .BeFalse();
    }

    [Fact]
    public async Task CompareQuality_ResolveAgentResultsForCompareReadAsync_reloads_when_hydrated_subset_omits_persisted_results()
    {
        Guid runKey = Guid.Parse("24242424-2424-2424-2424-242424242424");
        string canonical = runKey.ToString("N");

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        AgentResult persistedA = new()
        {
            ResultId = "result-subset-a",
            RunId = canonical,
            TaskId = "task-a",
            AgentType = AgentType.Topology,
            CreatedUtc = DateTime.UtcNow,
        };
        AgentResult persistedB = new()
        {
            ResultId = "result-subset-b",
            RunId = canonical,
            TaskId = "task-b",
            AgentType = AgentType.Compliance,
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetRollupProjectionByRunIdAsync(scope, canonical, It.IsAny<CancellationToken>()))
            .ReturnsAsync([persistedA, persistedB]);
        resultRepository
            .Setup(r => r.GetRollupProjectionByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonical),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentResult> hydrated =
        [
            new AgentResult
            {
                ResultId = "result-subset-a",
                RunId = canonical,
                TaskId = "task-a",
                AgentType = AgentType.Topology,
            },
        ];

        IReadOnlyList<AgentResult> resolved =
            await AnalysisRunIdCanonicalization.ResolveAgentResultsForCompareReadAsync(
                resultRepository.Object,
                scope,
                hydrated,
                canonical,
                useRollupProjection: true,
                CancellationToken.None);

        resolved.Should().HaveCount(2);
        resolved.Should().Contain(r => r.ResultId == "result-subset-b");
    }

    [Fact]
    public async Task CompareQuality_ResolveAgentResultsForCompareReadAsync_reloads_when_hydrated_rows_are_all_null()
    {
        Guid runKey = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string canonical = runKey.ToString("N");

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        AgentResult persisted = new()
        {
            ResultId = "result-reload-after-null-hydration",
            RunId = canonical,
            TaskId = "task-reload",
            AgentType = AgentType.Topology,
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetRollupProjectionByRunIdAsync(scope, canonical, It.IsAny<CancellationToken>()))
            .ReturnsAsync([persisted]);
        resultRepository
            .Setup(r => r.GetRollupProjectionByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonical),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<AgentResult> resolved =
            await AnalysisRunIdCanonicalization.ResolveAgentResultsForCompareReadAsync(
                resultRepository.Object,
                scope,
                [null!],
                canonical,
                useRollupProjection: true,
                CancellationToken.None);

        resolved.Should().ContainSingle();
        resolved[0].ResultId.Should().Be("result-reload-after-null-hydration");
    }

    [Fact]
    public async Task CompareQuality_LoadAgentResultsByRunIdAsync_merges_results_when_rows_are_split_across_alternate_run_id_keys()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        Mock<IAgentResultEnrichmentRepository> enrichment = new();
        enrichment
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichment.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-canonical-repo-key",
                RunId = canonicalRunId,
                TaskId = "task-canonical",
                AgentType = AgentType.Compliance,
            },
            CancellationToken.None);
        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-legacy-repo-key",
                RunId = legacyUpperRunId,
                TaskId = "task-legacy",
                AgentType = AgentType.Topology,
            },
            CancellationToken.None);

        IReadOnlyList<AgentResult> merged =
            await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                resultRepository,
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
        Guid runGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        DateTime olderUtc = new(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc);

        Mock<IAgentResultEnrichmentRepository> enrichment = new();
        enrichment
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichment.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-older-canonical-key",
                RunId = canonicalRunId,
                TaskId = "task-older",
                AgentType = AgentType.Compliance,
                CreatedUtc = olderUtc,
            },
            CancellationToken.None);
        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-newer-legacy-key",
                RunId = legacyUpperRunId,
                TaskId = "task-newer",
                AgentType = AgentType.Topology,
                CreatedUtc = newerUtc,
            },
            CancellationToken.None);

        IReadOnlyList<AgentResult> merged =
            await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                resultRepository,
                scope,
                canonicalRunId,
                useRollupProjection: false,
                CancellationToken.None);

        merged.Should().HaveCount(2);
        merged[0].ResultId.Should().Be("result-newer-legacy-key");
        merged[1].ResultId.Should().Be("result-older-canonical-key");
    }

    [Fact]
    public async Task CompareQuality_LoadAgentResultsByRunIdAsync_returns_empty_when_repository_returns_null()
    {
        const string canonicalRunId = "dadadadadadadadadadadadadadadada";
        ScopeContext scope = new();

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .Returns(Task.FromResult<IReadOnlyList<AgentResult>>(null!));

        IReadOnlyList<AgentResult> merged =
            await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                resultRepository.Object,
                scope,
                canonicalRunId,
                useRollupProjection: false,
                CancellationToken.None);

        merged.Should().BeEmpty();
    }

    [Fact]
    public async Task CompareQuality_LoadExecutionTracesByRunIdAsync_merges_traces_when_rows_are_split_across_alternate_run_id_keys()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-canonical-repo-key",
                RunId = canonicalRunId,
                AgentType = AgentType.Compliance,
            },
            CancellationToken.None);
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-legacy-repo-key",
                RunId = legacyUpperRunId,
                AgentType = AgentType.Topology,
            },
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> merged =
            await AnalysisRunIdCanonicalization.LoadExecutionTracesByRunIdAsync(
                traceRepository,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().Contain(t => t.TraceId == "trace-canonical-repo-key");
        merged.Should().Contain(t => t.TraceId == "trace-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_LoadExecutionTracesByRunIdAsync_returns_empty_when_repository_returns_null()
    {
        const string canonicalRunId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        ScopeContext scope = new();

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .Returns(Task.FromResult<IReadOnlyList<AgentExecutionTrace>>(null!));

        IReadOnlyList<AgentExecutionTrace> merged =
            await AnalysisRunIdCanonicalization.LoadExecutionTracesByRunIdAsync(
                traceRepository.Object,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().BeEmpty();
    }

    [Fact]
    public async Task CompareQuality_LoadExecutionTracesByRunIdAsync_orders_traces_by_created_utc_ascending()
    {
        Guid runGuid = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        DateTime olderUtc = new(2024, 6, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2024, 6, 2, 12, 0, 0, DateTimeKind.Utc);

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-newer",
                RunId = legacyUpperRunId,
                AgentType = AgentType.Topology,
                CreatedUtc = newerUtc,
            },
            CancellationToken.None);
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-older",
                RunId = legacyUpperRunId,
                AgentType = AgentType.Compliance,
                CreatedUtc = olderUtc,
            },
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> merged =
            await AnalysisRunIdCanonicalization.LoadExecutionTracesByRunIdAsync(
                traceRepository,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().HaveCount(2);
        merged[0].TraceId.Should().Be("trace-older");
        merged[1].TraceId.Should().Be("trace-newer");
    }

    [Fact]
    public async Task CompareQuality_LoadDecisionNodesByRunIdAsync_merges_nodes_when_rows_are_split_across_alternate_run_id_keys()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryDecisionNodeRepository decisionNodeRepository = new();
        await decisionNodeRepository.CreateManyAsync(
            [
                new DecisionNodeRecord
                {
                    DecisionId = "decision-canonical-repo-key",
                    RunId = canonicalRunId,
                    Topic = "TopologyAcceptance",
                    CreatedUtc = DateTime.UtcNow,
                },
                new DecisionNodeRecord
                {
                    DecisionId = "decision-legacy-repo-key",
                    RunId = legacyUpperRunId,
                    Topic = "SecurityGate",
                    CreatedUtc = DateTime.UtcNow,
                },
            ],
            CancellationToken.None);

        IReadOnlyList<DecisionNodeRecord> merged =
            await AnalysisRunIdCanonicalization.LoadDecisionNodesByRunIdAsync(
                decisionNodeRepository,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().Contain(n => n.DecisionId == "decision-canonical-repo-key");
        merged.Should().Contain(n => n.DecisionId == "decision-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_decision_nodes_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("13131313-1313-1313-1313-131313131313");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryDecisionNodeRepository decisionNodeRepository = new();
        await decisionNodeRepository.CreateManyAsync(
            [
                new DecisionNodeRecord
                {
                    DecisionId = "decision-legacy-only",
                    RunId = legacyUpperRunId,
                    Topic = "SecurityGate",
                },
            ],
            CancellationToken.None);

        IReadOnlyList<DecisionNodeRecord> nodes =
            await decisionNodeRepository.GetByRunIdAsync(canonicalRunId, CancellationToken.None);

        nodes.Should().ContainSingle(n => n.DecisionId == "decision-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_technology_ledger_rows_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("24242424-2424-2424-2424-242424242424");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                EntryId = "ledger-legacy-only",
                RunId = legacyUpperRunId,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            });

        IReadOnlyList<TechnologyLedgerEntry> entries =
            await ledgerRepository.GetByRunIdAsync(scope, canonicalRunId, CancellationToken.None);

        entries.Should().ContainSingle(entry => entry.EntryId == "ledger-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_governance_promotions_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("35353535-3535-3535-3535-353535353535");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryGovernancePromotionRecordRepository promotionRepository = new();
        await promotionRepository.CreateAsync(
            new GovernancePromotionRecord
            {
                PromotionRecordId = "promo-legacy-only",
                RunId = legacyUpperRunId,
                PromotedUtc = DateTime.UtcNow,
            });

        IReadOnlyList<GovernancePromotionRecord> promotions =
            await promotionRepository.GetByRunIdAsync(canonicalRunId, CancellationToken.None);

        promotions.Should().ContainSingle(promo => promo.PromotionRecordId == "promo-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_governance_approval_requests_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("46464646-4646-4646-4646-464646464646");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryGovernanceApprovalRequestRepository approvalRepository = new();
        await approvalRepository.CreateAsync(
            new GovernanceApprovalRequest
            {
                ApprovalRequestId = "approval-legacy-only",
                RunId = legacyUpperRunId,
                RequestedUtc = DateTime.UtcNow,
            });

        IReadOnlyList<GovernanceApprovalRequest> approvals =
            await approvalRepository.GetByRunIdAsync(canonicalRunId, CancellationToken.None);

        approvals.Should().ContainSingle(req => req.ApprovalRequestId == "approval-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_governance_activations_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("57575757-5757-5757-5757-575757575757");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryGovernanceEnvironmentActivationRepository activationRepository = new();
        await activationRepository.CreateAsync(
            new GovernanceEnvironmentActivation
            {
                ActivationId = "activation-legacy-only",
                RunId = legacyUpperRunId,
                ActivatedUtc = DateTime.UtcNow,
            });

        IReadOnlyList<GovernanceEnvironmentActivation> activations =
            await activationRepository.GetByRunIdAsync(canonicalRunId, CancellationToken.None);

        activations.Should().ContainSingle(act => act.ActivationId == "activation-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_LoadRunExportRecordsByRunIdAsync_merges_exports_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("69696969-6969-6969-6969-696969696969");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryRunExportRecordRepository exportRepository = new();
        await exportRepository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = "export-legacy-only",
                RunId = legacyUpperRunId,
                ExportType = "analysis-report",
                Format = "pdf",
                FileName = "legacy.pdf",
                CreatedUtc = DateTime.UtcNow,
            });

        IReadOnlyList<RunExportRecord> exports =
            await AnalysisRunIdCanonicalization.LoadRunExportRecordsByRunIdAsync(
                exportRepository,
                canonicalRunId,
                CancellationToken.None);

        exports.Should().ContainSingle(export => export.ExportRecordId == "export-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_LoadComparisonRecordsByRunIdAsync_lists_comparisons_when_left_run_id_uses_legacy_key()
    {
        Guid runGuid = Guid.Parse("70707070-7070-7070-7070-707070707070");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryComparisonRecordRepository comparisonRepository = new();
        await comparisonRepository.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-legacy-left-run",
                ComparisonType = "end-to-end-replay",
                LeftRunId = legacyUpperRunId,
                RightRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                CreatedUtc = DateTime.UtcNow,
            });

        IReadOnlyList<ComparisonRecord> records =
            await AnalysisRunIdCanonicalization.LoadComparisonRecordsByRunIdAsync(
                comparisonRepository,
                canonicalRunId,
                CancellationToken.None);

        records.Should().ContainSingle(record => record.ComparisonRecordId == "cmp-legacy-left-run");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_prefers_newer_task_when_alternate_keys_repeat_task_id()
    {
        Guid runGuid = Guid.Parse("77777777-7777-7777-7777-777777777777");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        const string taskId = "task-shared-across-keys";
        ScopeContext scope = new();

        DateTime olderUtc = new(2026, 2, 1, 8, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 2, 2, 8, 0, 0, DateTimeKind.Utc);

        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [
                new AgentTask
                {
                    TaskId = taskId,
                    RunId = canonicalRunId,
                    AgentType = AgentType.Compliance,
                    Status = AgentTaskStatus.Created,
                    CreatedUtc = olderUtc,
                },
                new AgentTask
                {
                    TaskId = taskId,
                    RunId = legacyUpperRunId,
                    AgentType = AgentType.Topology,
                    Status = AgentTaskStatus.Completed,
                    CreatedUtc = newerUtc,
                },
            ],
            CancellationToken.None);

        IReadOnlyList<AgentTask> tasks =
            await taskRepository.GetByRunIdAsync(scope, canonicalRunId, CancellationToken.None);

        tasks.Should().ContainSingle();
        tasks[0].AgentType.Should().Be(AgentType.Topology);
        tasks[0].Status.Should().Be(AgentTaskStatus.Completed);
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_tasks_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("66666666-6666-6666-6666-666666666666");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [
                new AgentTask
                {
                    TaskId = "task-legacy-only",
                    RunId = legacyUpperRunId,
                    AgentType = AgentType.Topology,
                },
            ],
            CancellationToken.None);

        IReadOnlyList<AgentTask> tasks =
            await taskRepository.GetByRunIdAsync(scope, canonicalRunId, CancellationToken.None);

        tasks.Should().ContainSingle(t => t.TaskId == "task-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_LoadAgentTasksByRunIdAsync_merges_tasks_when_rows_are_split_across_alternate_run_id_keys()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [
                new AgentTask
                {
                    TaskId = "task-canonical-repo-key",
                    RunId = canonicalRunId,
                    AgentType = AgentType.Compliance,
                },
                new AgentTask
                {
                    TaskId = "task-legacy-repo-key",
                    RunId = legacyUpperRunId,
                    AgentType = AgentType.Topology,
                },
            ],
            CancellationToken.None);

        IReadOnlyList<AgentTask> merged =
            await AnalysisRunIdCanonicalization.LoadAgentTasksByRunIdAsync(
                taskRepository,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().Contain(t => t.TaskId == "task-canonical-repo-key");
        merged.Should().Contain(t => t.TaskId == "task-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_results_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        Mock<IAgentResultEnrichmentRepository> enrichment = new();
        enrichment
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichment.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-legacy-full-row",
                RunId = legacyUpperRunId,
                TaskId = "task-legacy",
                AgentType = AgentType.Topology,
            },
            CancellationToken.None);

        IReadOnlyList<AgentResult> results =
            await resultRepository.GetByRunIdAsync(scope, canonicalRunId, CancellationToken.None);

        results.Should().ContainSingle(r => r.ResultId == "result-legacy-full-row");
    }

    [Fact]
    public async Task CompareQuality_LoadEvidencePackageByRunIdAsync_prefers_newer_package_when_rows_are_split_across_alternate_run_id_keys()
    {
        Guid runGuid = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryAgentEvidencePackageRepository evidenceRepository = new();

        await evidenceRepository.CreateAsync(
            new AgentEvidencePackage
            {
                EvidencePackageId = "pkg-canonical-repo-key",
                RunId = canonicalRunId,
                SystemName = "older",
                CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);
        await evidenceRepository.CreateAsync(
            new AgentEvidencePackage
            {
                EvidencePackageId = "pkg-legacy-repo-key",
                RunId = legacyUpperRunId,
                SystemName = "newer",
                CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        AgentEvidencePackage? loaded =
            await AnalysisRunIdCanonicalization.LoadEvidencePackageByRunIdAsync(
                evidenceRepository,
                canonicalRunId,
                CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.EvidencePackageId.Should().Be("pkg-legacy-repo-key");
        loaded.SystemName.Should().Be("newer");
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_evidence_package_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("12121212-1212-1212-1212-121212121212");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        InMemoryAgentEvidencePackageRepository evidenceRepository = new();
        await evidenceRepository.CreateAsync(
            new AgentEvidencePackage
            {
                EvidencePackageId = "pkg-legacy-only",
                RunId = legacyUpperRunId,
                SystemName = "legacy",
            },
            CancellationToken.None);

        AgentEvidencePackage? loaded =
            await evidenceRepository.GetByRunIdAsync(canonicalRunId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.EvidencePackageId.Should().Be("pkg-legacy-only");
    }

    [Fact]
    public async Task CompareQuality_GetAgentTypeMarkersByRunIdAsync_merges_markers_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("44444444-4444-4444-4444-444444444444");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        Mock<IAgentResultEnrichmentRepository> enrichment = new();
        enrichment
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichment.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-legacy-marker",
                RunId = legacyUpperRunId,
                TaskId = "task-legacy",
                AgentType = AgentType.Topology,
            },
            CancellationToken.None);

        IReadOnlyList<AgentResult> markers =
            await resultRepository.GetAgentTypeMarkersByRunIdAsync(scope, canonicalRunId, CancellationToken.None);

        markers.Should().ContainSingle(marker => marker.ResultId == "result-legacy-marker");
    }

    [Fact]
    public async Task CompareQuality_LoadAgentTypeMarkersByRunIdAsync_orders_markers_by_created_utc_descending()
    {
        Guid runGuid = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        DateTime olderUtc = new(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2024, 3, 2, 0, 0, 0, DateTimeKind.Utc);

        Mock<IAgentResultEnrichmentRepository> enrichment = new();
        enrichment
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichment.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-older",
                RunId = legacyUpperRunId,
                TaskId = "task-older",
                AgentType = AgentType.Topology,
                CreatedUtc = olderUtc,
            },
            CancellationToken.None);
        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = "result-newer",
                RunId = legacyUpperRunId,
                TaskId = "task-newer",
                AgentType = AgentType.Compliance,
                CreatedUtc = newerUtc,
            },
            CancellationToken.None);

        IReadOnlyList<AgentResult> markers =
            await AnalysisRunIdCanonicalization.LoadAgentTypeMarkersByRunIdAsync(
                resultRepository,
                scope,
                canonicalRunId,
                CancellationToken.None);

        markers.Should().HaveCount(2);
        markers[0].ResultId.Should().Be("result-newer");
        markers[1].ResultId.Should().Be("result-older");
    }

    [Fact]
    public async Task CompareQuality_LoadLlmCostSlicesByRunIdAsync_returns_empty_when_repository_returns_null()
    {
        const string canonicalRunId = "fafafafafafafafafafafafafafafafa";
        ScopeContext scope = new();

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .Returns(Task.FromResult<IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(null!));

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> merged =
            await AnalysisRunIdCanonicalization.LoadLlmCostSlicesByRunIdAsync(
                traceRepository.Object,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().BeEmpty();
    }

    [Fact]
    public async Task CompareQuality_LoadLlmCostSlicesByRunIdAsync_dedupes_slices_when_repository_merges_duplicate_traces()
    {
        Guid runGuid = Guid.Parse("abababab-abab-abab-abab-abababababab");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-dup-a",
                RunId = legacyUpperRunId,
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 100,
                OutputTokenCount = 25,
            },
            CancellationToken.None);
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-dup-b",
                RunId = legacyUpperRunId,
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 100,
                OutputTokenCount = 25,
            },
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> merged =
            await AnalysisRunIdCanonicalization.LoadLlmCostSlicesByRunIdAsync(
                traceRepository,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().ContainSingle();
        merged[0].InputTokenCount.Should().Be(100);
    }

    [Fact]
    public async Task CompareQuality_LoadLlmCostSlicesByRunIdAsync_merges_distinct_slices_when_rows_are_split_across_alternate_run_id_keys()
    {
        Guid runGuid = Guid.Parse("cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-canonical-model",
                RunId = canonicalRunId,
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 80,
                OutputTokenCount = 10,
            },
            CancellationToken.None);
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-legacy-model",
                RunId = legacyUpperRunId,
                ModelDeploymentName = "gpt-4o-mini",
                InputTokenCount = 40,
                OutputTokenCount = 5,
            },
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> merged =
            await AnalysisRunIdCanonicalization.LoadLlmCostSlicesByRunIdAsync(
                traceRepository,
                scope,
                canonicalRunId,
                CancellationToken.None);

        merged.Should().HaveCount(2);
        merged.Should().Contain(s => s.ModelDeploymentName == "gpt-4o" && s.InputTokenCount == 80);
        merged.Should().Contain(s => s.ModelDeploymentName == "gpt-4o-mini" && s.InputTokenCount == 40);
    }

    [Fact]
    public async Task CompareQuality_LoadAgentResultsByRunIdAsync_prefers_newer_row_when_alternate_keys_repeat_result_id()
    {
        Guid runGuid = Guid.Parse("edededed-eded-eded-eded-edededededed");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();
        const string resultId = "result-shared-across-keys";
        ScopeContext scope = new();

        Mock<IAgentResultEnrichmentRepository> enrichment = new();
        enrichment
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichment.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = resultId,
                RunId = canonicalRunId,
                TaskId = "task-shared-canonical",
                AgentType = AgentType.Compliance,
                Claims = ["stale"],
                CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);
        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = resultId,
                RunId = legacyUpperRunId,
                TaskId = "task-shared-legacy",
                AgentType = AgentType.Compliance,
                Claims = ["fresh"],
                CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        IReadOnlyList<AgentResult> merged =
            await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                resultRepository,
                scope,
                canonicalRunId,
                useRollupProjection: false,
                CancellationToken.None);

        merged.Should().ContainSingle();
        merged[0].Claims.Should().ContainSingle(c => c == "fresh");
    }
}
