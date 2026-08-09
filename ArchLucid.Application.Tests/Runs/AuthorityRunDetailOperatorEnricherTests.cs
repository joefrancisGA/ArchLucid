using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

using Moq;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
public sealed class AuthorityRunDetailOperatorEnricherTests
{
    [SkippableFact]
    public async Task EnrichAsync_populates_results_cost_estimate_and_trust_card_for_committed_run()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            },
        };

        List<AgentResult> results =
        [
            new()
            {
                ResultId = "result-1",
                TaskId = "task-1",
                RunId = runId.ToString("N"),
                AgentType = AgentType.Topology,
                Claims = ["Claim A"],
                EvidenceRefs = ["evidence-1"],
            },
        ];

        ArchitectureRunDetail architectureDetail = new()
        {
            Run = new ArchitectureRun { RunId = runId.ToString("N") },
            Results = results,
            Manifest = new GoldenManifest { RunId = runId.ToString("N"), SystemName = "Test" },
        };

        RunTrustEvidenceCard trustCard = new()
        {
            SelfAttestationNotice = "Self-attested",
            ExecutionMode = new TrustEvidenceFieldSnapshot { Title = "Execution", Status = "Real" },
            GoldenManifest = new TrustEvidenceFieldSnapshot { Title = "Manifest", Status = "Present" },
            AuditTrail = new TrustEvidenceFieldSnapshot { Title = "Audit", Status = "Present" },
            AgentTraces = new TrustEvidenceFieldSnapshot { Title = "Traces", Status = "Present" },
            ArtifactBundlePointer = new TrustEvidenceFieldSnapshot { Title = "Artifacts", Status = "Present" },
            TraceabilityExport = new TrustEvidenceFieldSnapshot { Title = "Export", Status = "Present" },
            AiExplainability = new TrustEvidenceFieldSnapshot { Title = "Explainability", Status = "Present" },
            Links = [],
        };

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(q => q.GetRunDetailForOperatorEnrichAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(architectureDetail);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    ModelDeploymentName = "gpt-4o",
                    InputTokenCount = 100,
                    OutputTokenCount = 20,
                },
            ]);

        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(e => e.EstimateUsd(100, 20, 0, "gpt-4o"))
            .Returns(0.42m);

        Mock<IRunTrustEvidenceCardBuilder> trustBuilder = new();
        trustBuilder
            .Setup(b => b.BuildAsync(architectureDetail, "Real", It.IsAny<CancellationToken>()))
            .ReturnsAsync(trustCard);

        Mock<IRetrievalGroundingTraceReader> groundingReader = new();
        groundingReader
            .Setup(r => r.GetByRunIdAsync(
                detail.Run.TenantId,
                detail.Run.WorkspaceId,
                detail.Run.ScopeProjectId,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultRepository> agentResults = new();

        AuthorityRunDetailOperatorEnricher sut = new(
            runDetailQuery.Object,
            traces.Object,
            agentResults.Object,
            estimator.Object,
            trustBuilder.Object,
            groundingReader.Object,
            savingsResolver.Object,
            tenantCostSettings.Object,
            decisionNodes.Object,
            new ConfigurationBuilder().Build());

        await sut.EnrichAsync(detail, "Real", CancellationToken.None);

        detail.Results.Should().BeEquivalentTo(results);
        detail.AgentExecutionLlmCostEstimate.Should().NotBeNull();
        detail.AgentExecutionLlmCostEstimate!.EstimatedCostUsd.Should().Be(0.42m);
        detail.TrustEvidenceCard.Should().BeSameAs(trustCard);
        detail.RetrievalGroundingSummary.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task EnrichAsync_skips_trust_card_when_run_not_committed()
    {
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            },
        };

        ArchitectureRunDetail architectureDetail = new()
        {
            Run = new ArchitectureRun { RunId = runId.ToString("N") },
            Results = [],
        };

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(q => q.GetRunDetailForOperatorEnrichAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(architectureDetail);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());

        Mock<ILlmCostEstimator> estimator = new();
        Mock<IRunTrustEvidenceCardBuilder> trustBuilder = new();
        Mock<IRetrievalGroundingTraceReader> groundingReader = new();
        groundingReader
            .Setup(r => r.GetByRunIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultRepository> agentResults = new();

        AuthorityRunDetailOperatorEnricher sut = new(
            runDetailQuery.Object,
            traces.Object,
            agentResults.Object,
            estimator.Object,
            trustBuilder.Object,
            groundingReader.Object,
            savingsResolver.Object,
            tenantCostSettings.Object,
            decisionNodes.Object,
            new ConfigurationBuilder().Build());

        await sut.EnrichAsync(detail, "Simulator", CancellationToken.None);

        detail.TrustEvidenceCard.Should().BeNull();
        trustBuilder.Verify(
            b => b.BuildAsync(It.IsAny<ArchitectureRunDetail>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task EnrichAsync_does_not_load_full_run_detail_result_json()
    {
        Guid runId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            },
        };

        ArchitectureRunDetail architectureDetail = new()
        {
            Run = new ArchitectureRun { RunId = runId.ToString("N") },
            Results = [],
        };

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(q => q.GetRunDetailForOperatorEnrichAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(architectureDetail);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());

        Mock<ILlmCostEstimator> estimator = new();
        Mock<IRunTrustEvidenceCardBuilder> trustBuilder = new();
        Mock<IRetrievalGroundingTraceReader> groundingReader = new();
        groundingReader
            .Setup(r => r.GetByRunIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultRepository> agentResults = new();

        AuthorityRunDetailOperatorEnricher sut = new(
            runDetailQuery.Object,
            traces.Object,
            agentResults.Object,
            estimator.Object,
            trustBuilder.Object,
            groundingReader.Object,
            savingsResolver.Object,
            tenantCostSettings.Object,
            decisionNodes.Object,
            new ConfigurationBuilder().Build());

        await sut.EnrichAsync(detail, "Real", CancellationToken.None);

        runDetailQuery.Verify(
            q => q.GetRunDetailForOperatorEnrichAsync(runId.ToString("N"), It.IsAny<CancellationToken>()),
            Times.Once);
        runDetailQuery.Verify(
            q => q.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task EnrichBuyerSummaryAsync_does_not_load_operator_run_detail_result_json()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid manifestId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ProjectId = "default",
                GoldenManifestId = manifestId,
            },
        };

        RunTrustEvidenceCard trustCard = new()
        {
            SelfAttestationNotice = "Self-attested",
            ExecutionMode = new TrustEvidenceFieldSnapshot { Title = "Execution", Status = "Real" },
            GoldenManifest = new TrustEvidenceFieldSnapshot { Title = "Manifest", Status = "Present" },
            AuditTrail = new TrustEvidenceFieldSnapshot { Title = "Audit", Status = "Present" },
            AgentTraces = new TrustEvidenceFieldSnapshot { Title = "Traces", Status = "Present" },
            ArtifactBundlePointer = new TrustEvidenceFieldSnapshot { Title = "Artifacts", Status = "Present" },
            TraceabilityExport = new TrustEvidenceFieldSnapshot { Title = "Export", Status = "Present" },
            AiExplainability = new TrustEvidenceFieldSnapshot { Title = "Explainability", Status = "Present" },
            Links = [],
        };

        Mock<IRunDetailQueryService> runDetailQuery = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.GetAgentTypeMarkersByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runId.ToString("N"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ILlmCostEstimator> estimator = new();
        Mock<IRunTrustEvidenceCardBuilder> trustBuilder = new();
        trustBuilder
            .Setup(b => b.BuildAsync(It.IsAny<ArchitectureRunDetail>(), "Real", It.IsAny<CancellationToken>()))
            .ReturnsAsync(trustCard);

        Mock<IRetrievalGroundingTraceReader> groundingReader = new();
        groundingReader
            .Setup(r => r.GetByRunIdAsync(
                detail.Run.TenantId,
                detail.Run.WorkspaceId,
                detail.Run.ScopeProjectId,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        AuthorityRunDetailOperatorEnricher sut = new(
            runDetailQuery.Object,
            traces.Object,
            agentResults.Object,
            estimator.Object,
            trustBuilder.Object,
            groundingReader.Object,
            savingsResolver.Object,
            tenantCostSettings.Object,
            decisionNodes.Object,
            new ConfigurationBuilder().Build());

        await sut.EnrichBuyerSummaryAsync(detail, "Real", CancellationToken.None);

        detail.Results.Should().BeEmpty();
        detail.TrustEvidenceCard.Should().BeSameAs(trustCard);
        runDetailQuery.Verify(
            q => q.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        agentResults.Verify(
            r => r.GetAgentTypeMarkersByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runId.ToString("N"),
                It.IsAny<CancellationToken>()),
            Times.Once);
        agentResults.Verify(
            r => r.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task EnrichBuyerSummaryAsync_swallows_agent_type_marker_failures()
    {
        Guid runId = Guid.Parse("77777777-7777-7777-7777-777777777777");
        Guid manifestId = Guid.Parse("88888888-8888-8888-8888-888888888888");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ProjectId = "default",
                GoldenManifestId = manifestId,
            },
        };

        Mock<IRunDetailQueryService> runDetailQuery = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.GetAgentTypeMarkersByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runId.ToString("N"),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidCastException("Object must implement IConvertible."));

        Mock<ILlmCostEstimator> estimator = new();
        Mock<IRunTrustEvidenceCardBuilder> trustBuilder = new();
        trustBuilder
            .Setup(b => b.BuildAsync(It.IsAny<ArchitectureRunDetail>(), "Real", It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunTrustEvidenceCard?)null);

        Mock<IRetrievalGroundingTraceReader> groundingReader = new();
        groundingReader
            .Setup(r => r.GetByRunIdAsync(
                detail.Run.TenantId,
                detail.Run.WorkspaceId,
                detail.Run.ScopeProjectId,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        AuthorityRunDetailOperatorEnricher sut = new(
            runDetailQuery.Object,
            traces.Object,
            agentResults.Object,
            estimator.Object,
            trustBuilder.Object,
            groundingReader.Object,
            savingsResolver.Object,
            tenantCostSettings.Object,
            decisionNodes.Object,
            new ConfigurationBuilder().Build());

        await sut.Invoking(s => s.EnrichBuyerSummaryAsync(detail, "Real", CancellationToken.None))
            .Should()
            .NotThrowAsync();

        detail.Results.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task EnrichBuyerSummaryAsync_swallows_trust_card_failures()
    {
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        Guid manifestId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ProjectId = "default",
                GoldenManifestId = manifestId,
            },
        };

        Mock<IRunDetailQueryService> runDetailQuery = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.GetAgentTypeMarkersByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runId.ToString("N"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ILlmCostEstimator> estimator = new();
        Mock<IRunTrustEvidenceCardBuilder> trustBuilder = new();
        trustBuilder
            .Setup(b => b.BuildAsync(It.IsAny<ArchitectureRunDetail>(), "Real", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("trust card boom"));

        Mock<IRetrievalGroundingTraceReader> groundingReader = new();
        groundingReader
            .Setup(r => r.GetByRunIdAsync(
                detail.Run.TenantId,
                detail.Run.WorkspaceId,
                detail.Run.ScopeProjectId,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        AuthorityRunDetailOperatorEnricher sut = new(
            runDetailQuery.Object,
            traces.Object,
            agentResults.Object,
            estimator.Object,
            trustBuilder.Object,
            groundingReader.Object,
            savingsResolver.Object,
            tenantCostSettings.Object,
            decisionNodes.Object,
            new ConfigurationBuilder().Build());

        await sut.Invoking(s => s.EnrichBuyerSummaryAsync(detail, "Real", CancellationToken.None))
            .Should()
            .NotThrowAsync();

        detail.TrustEvidenceCard.Should().BeNull();
        detail.Results.Should().BeEmpty();
    }
}
