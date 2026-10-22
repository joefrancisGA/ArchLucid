using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CommitPipelineManifestReuseServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [SkippableFact]
    public async Task TryReusePipelineManifestAsync_missing_pipeline_ids_returns_null()
    {
        CommitPipelineManifestReuseService sut = CreateSut(out _, out _, out _, out _, out _, out _, out _);
        ArchitectureRun run = new() { RunId = Guid.NewGuid().ToString("N") };
        GraphSnapshot graph = CreateGraph();
        FindingsSnapshot findings = CreateFindings();

        CommitPipelineManifestReuseResult? result = await sut.TryReusePipelineManifestAsync(
            run,
            Guid.Parse(run.RunId),
            Guid.NewGuid(),
            graph,
            graph,
            findings,
            Scope,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryReusePipelineManifestAsync_without_topology_merge_reuses_pipeline_manifest()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        ManifestDocument pipelineManifest = CreateAlignedManifest(runId, manifestId, contextId, graphId, findingsId, "pipeline-hash");
        DecisionTraceDto traceDto = CreateTraceDto(traceId, runId);
        GraphSnapshot graph = CreateGraph(graphId);
        FindingsSnapshot findings = CreateFindings(findingsId);
        ArchitectureRun run = CreateRun(runId, manifestId, traceId);

        CommitPipelineManifestReuseService sut = CreateSut(
            out Mock<IGoldenManifestRepository> manifests,
            out Mock<IDecisionTraceRepository> traces,
            out Mock<IGoldenManifestBuilder> builder,
            out Mock<IGoldenManifestValidator> validator,
            out Mock<IManifestHashService> hashService,
            out Mock<IAuthorityFeasibilityVerdictComposer> feasibility,
            out Mock<IDecisionIntakeTrailProvider> intake);

        manifests.Setup(m => m.GetByIdAsync(Scope, manifestId, It.IsAny<CancellationToken>())).ReturnsAsync(pipelineManifest);
        traces.Setup(t => t.GetByIdAsync(Scope, traceId, It.IsAny<CancellationToken>())).ReturnsAsync(traceDto);

        CommitPipelineManifestReuseResult? result = await sut.TryReusePipelineManifestAsync(
            run,
            runId,
            contextId,
            graph,
            graph,
            findings,
            Scope,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.Manifest.Should().BeSameAs(pipelineManifest);
        result.TraceDto.Should().BeSameAs(traceDto);
        builder.Verify(b => b.RefreshGraphDerivedTopology(It.IsAny<ManifestDocument>(), It.IsAny<GraphSnapshot>()), Times.Never);
        hashService.Verify(h => h.ComputeHash(It.IsAny<ManifestDocument>()), Times.Never);
        feasibility.Verify(f => f.Compose(It.IsAny<ManifestDocument>(), It.IsAny<TransparencyTrail?>()), Times.Never);
        validator.Verify(v => v.Validate(It.IsAny<ManifestDocument>()), Times.Never);
        intake.Verify(i => i.TryGetTransparencyTrailAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryReusePipelineManifestAsync_with_topology_merge_refreshes_graph_topology_and_recomputes_hash_once()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        ManifestDocument pipelineManifest = CreateAlignedManifest(runId, manifestId, contextId, graphId, findingsId, null);
        DecisionTraceDto traceDto = CreateTraceDto(traceId, runId);
        GraphSnapshot graph = CreateGraph(graphId);
        GraphSnapshot mergedGraph = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [CreateTopologyResult("orders-api")]);
        FindingsSnapshot findings = CreateFindings(findingsId);
        ArchitectureRun run = CreateRun(runId, manifestId, traceId);

        CommitPipelineManifestReuseService sut = CreateSut(
            out Mock<IGoldenManifestRepository> manifests,
            out Mock<IDecisionTraceRepository> traces,
            out Mock<IGoldenManifestBuilder> builder,
            out Mock<IGoldenManifestValidator> validator,
            out Mock<IManifestHashService> hashService,
            out Mock<IAuthorityFeasibilityVerdictComposer> feasibility,
            out Mock<IDecisionIntakeTrailProvider> intake);

        manifests.Setup(m => m.GetByIdAsync(Scope, manifestId, It.IsAny<CancellationToken>())).ReturnsAsync(pipelineManifest);
        traces.Setup(t => t.GetByIdAsync(Scope, traceId, It.IsAny<CancellationToken>())).ReturnsAsync(traceDto);
        intake.Setup(i => i.TryGetTransparencyTrailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync((TransparencyTrail?)null);
        hashService.Setup(h => h.ComputeHash(pipelineManifest)).Returns("merged-hash");

        CommitPipelineManifestReuseResult? result = await sut.TryReusePipelineManifestAsync(
            run,
            runId,
            contextId,
            graph,
            mergedGraph,
            findings,
            Scope,
            CancellationToken.None);

        result.Should().NotBeNull();
        pipelineManifest.ManifestHash.Should().Be("merged-hash");
        builder.Verify(b => b.RefreshGraphDerivedTopology(pipelineManifest, mergedGraph), Times.Once);
        validator.Verify(v => v.Validate(pipelineManifest), Times.Once);
        feasibility.Verify(f => f.Compose(pipelineManifest, null), Times.Once);
        hashService.Verify(h => h.ComputeHash(pipelineManifest), Times.Once);
    }

    private static CommitPipelineManifestReuseService CreateSut(
        out Mock<IGoldenManifestRepository> manifests,
        out Mock<IDecisionTraceRepository> traces,
        out Mock<IGoldenManifestBuilder> builder,
        out Mock<IGoldenManifestValidator> validator,
        out Mock<IManifestHashService> hashService,
        out Mock<IAuthorityFeasibilityVerdictComposer> feasibility,
        out Mock<IDecisionIntakeTrailProvider> intake)
    {
        manifests = new Mock<IGoldenManifestRepository>();
        traces = new Mock<IDecisionTraceRepository>();
        builder = new Mock<IGoldenManifestBuilder>();
        validator = new Mock<IGoldenManifestValidator>();
        hashService = new Mock<IManifestHashService>();
        feasibility = new Mock<IAuthorityFeasibilityVerdictComposer>();
        intake = new Mock<IDecisionIntakeTrailProvider>();

        return new CommitPipelineManifestReuseService(
            manifests.Object,
            traces.Object,
            builder.Object,
            validator.Object,
            hashService.Object,
            feasibility.Object,
            intake.Object);
    }

    private static ArchitectureRun CreateRun(Guid runId, Guid manifestId, Guid traceId)
    {
        return new ArchitectureRun
        {
            RunId = runId.ToString("N"),
            GoldenManifestId = manifestId,
            DecisionTraceId = traceId,
        };
    }

    private static ManifestDocument CreateAlignedManifest(
        Guid runId,
        Guid manifestId,
        Guid contextId,
        Guid graphId,
        Guid findingsId,
        string? manifestHash)
    {
        return new ManifestDocument
        {
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            ManifestHash = manifestHash ?? string.Empty,
        };
    }

    private static DecisionTraceDto CreateTraceDto(Guid traceId, Guid runId)
    {
        return new RuleAuditTraceDto
        {
            RuleAudit = new RuleAuditTracePayload
            {
                DecisionTraceId = traceId,
                RunId = runId,
            },
        };
    }

    private static GraphSnapshot CreateGraph(Guid? graphId = null)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = graphId ?? Guid.NewGuid(),
            Nodes = [],
            Edges = [],
        };
    }

    private static FindingsSnapshot CreateFindings(Guid? findingsId = null)
    {
        return new FindingsSnapshot
        {
            FindingsSnapshotId = findingsId ?? Guid.NewGuid(),
            Findings = [],
        };
    }

    private static AgentResult CreateTopologyResult(string serviceName)
    {
        return new AgentResult
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                AddedServices =
                [
                    new Contracts.Manifest.ManifestService
                    {
                        ServiceName = serviceName,
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    }
                ],
            },
        };
    }
}
