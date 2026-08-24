using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Traceability;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunQueryControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static readonly string RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("N");

    [Fact]
    public async Task GetRun_returns_not_found_when_detail_missing()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForOperatorEnrichAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        RunQueryController controller = CreateController(runDetailQueryService: runDetail.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRun_returns_not_found_when_manifest_reference_broken()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunId,
                RequestId = "REQ-1",
                CurrentManifestVersion = "v1"
            }
        };

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForOperatorEnrichAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), RowVersion = [1] });

        RunQueryController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            authorityRunRepository: runs.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRun_returns_ok_for_uncommitted_run()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = RunId, RequestId = "REQ-2" }
        };

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForOperatorEnrichAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), RowVersion = [2] });

        Mock<IAgentExecutionTraceRepository> traces = CreateAgentExecutionTraceRepositoryMock();

        RunQueryController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            agentExecutionTraceRepository: traces.Object,
            authorityRunRepository: runs.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetRun_maps_kernel_completeness_flags_onto_RunDetailsResponse()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = RunId, RequestId = "REQ-EK07" },
            AgentTaskLoopComplete = true,
            AuthorityPipelineComplete = false
        };

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForOperatorEnrichAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), RowVersion = [2] });

        Mock<IAgentExecutionTraceRepository> traces = CreateAgentExecutionTraceRepositoryMock();

        RunQueryController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            agentExecutionTraceRepository: traces.Object,
            authorityRunRepository: runs.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        RunDetailsResponse payload = ok.Value.Should().BeOfType<RunDetailsResponse>().Subject;
        payload.AgentTaskLoopComplete.Should().BeTrue();
        payload.AuthorityPipelineComplete.Should().BeFalse();
    }

    [Fact]
    public async Task GetRunRoiEstimate_returns_scorecard_from_estimator()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = RunId, RequestId = "REQ-3" }
        };

        RunRoiScorecardDto scorecard = new()
        {
            RunId = RunId,
            ComputationNotes = "test",
            EstimatedManualHoursSaved = 4.5
        };

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForOperatorEnrichAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IRunRoiEstimator> estimator = new();
        estimator.Setup(e => e.Estimate(detail)).Returns(scorecard);

        RunQueryController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            runRoiEstimator: estimator.Object);

        IActionResult action = await controller.GetRunRoiEstimate(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(scorecard);
    }

    [Fact]
    public async Task GetRun_returns_not_found_for_invalid_run_id_like_GetRun()
    {
        RunQueryController controller = CreateController();

        IActionResult action = await controller.GetRun("not-a-guid", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetInteractiveGraphSnapshot_returns_not_found_for_invalid_run_id_like_GetRun()
    {
        RunQueryController controller = CreateController();

        IActionResult action = await controller.GetInteractiveGraphSnapshot("not-a-guid", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRunStageTimeline_returns_bad_request_when_run_id_blank()
    {
        RunQueryController controller = CreateController();

        IActionResult action = await controller.GetRunStageTimeline("  ", CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetRunStageTimeline_returns_timeline_when_run_exists()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Persistence.Models.RunRecord run = new() { RunId = runGuid, ArchitectureRequestId = "REQ-4" };
        DateTime started = DateTime.UtcNow;
        List<StageTimelineSummary> timeline =
        [
            new("Execute", started, started.AddMinutes(1), "Succeeded", 60_000)
        ];

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);

        Mock<IRunStageOutcomesRepository> stages = new();
        stages
            .Setup(s => s.ListByRunIdAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(timeline);

        RunQueryController controller = CreateController(
            authorityRunRepository: runs.Object,
            runStageOutcomesRepository: stages.Object);

        IActionResult action = await controller.GetRunStageTimeline(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<StageTimelineSummary> body =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<StageTimelineSummary>>().Subject;

        body.Should().ContainSingle();
        body[0].StageName.Should().Be("Execute");
        body[0].OutcomeStatus.Should().Be("Succeeded");
    }

    [Fact]
    public async Task ListRuns_returns_offset_page()
    {
        List<RunSummary> summaries =
        [
            new()
            {
                RunId = RunId,
                RequestId = "REQ-5",
                Status = "Created",
                CreatedUtc = DateTime.UtcNow,
                SystemName = "Core"
            }
        ];

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.ListRunSummariesOffsetAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((summaries, false));

        RunQueryController controller = CreateController(runDetailQueryService: runDetail.Object);

        IActionResult action = await controller.ListRuns(cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task ListRuns_returns_keyset_page_when_cursor_present()
    {
        List<RunSummary> summaries =
        [
            new() { RunId = RunId, RequestId = "REQ-6", Status = "Committed", CreatedUtc = DateTime.UtcNow }
        ];

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.ListRunSummariesKeysetAsync("cursor-1", 25, It.IsAny<CancellationToken>()))
            .ReturnsAsync((summaries, true, "cursor-2"));

        RunQueryController controller = CreateController(runDetailQueryService: runDetail.Object);

        IActionResult action = await controller.ListRuns(cursor: "cursor-1", cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetFindingEvidenceChain_returns_not_found_when_service_returns_null()
    {
        Mock<IFindingEvidenceChainService> chain = new();
        chain
            .Setup(s => s.BuildAsync(RunId, "finding-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((FindingEvidenceChainResponse?)null);

        RunQueryController controller = CreateController(findingEvidenceChainService: chain.Object);

        IActionResult action = await controller.GetFindingEvidenceChain(
            RunId,
            "finding-1",
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static RunQueryController CreateController(
        IRunDetailQueryService? runDetailQueryService = null,
        IRunRoiEstimator? runRoiEstimator = null,
        IRunRepository? authorityRunRepository = null,
        IAgentExecutionTraceRepository? agentExecutionTraceRepository = null,
        IFindingEvidenceChainService? findingEvidenceChainService = null,
        IRunStageOutcomesRepository? runStageOutcomesRepository = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunFindingExternalTrackingReadRepository> trackingRead = new();
        Mock<IExternalTicketConnectorRegistry> connectorRegistry = new();
        connectorRegistry.Setup(r => r.Connectors).Returns([]);

        RunFindingExternalTrackingEnrichmentService enrichment = new(
            trackingRead.Object,
            new ItsmExternalTicketUrlBuilder(connectorRegistry.Object));

        return new RunQueryController(
            runDetailQueryService ?? Mock.Of<IRunDetailQueryService>(),
            runRoiEstimator ?? Mock.Of<IRunRoiEstimator>(),
            Mock.Of<IArchitectureRunProvenanceService>(),
            authorityRunRepository ?? Mock.Of<IRunRepository>(),
            Mock.Of<IDecisionNodeRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            agentExecutionTraceRepository ?? CreateAgentExecutionTraceRepositoryMock().Object,
            Mock.Of<IAgentToolInvocationRecordRepository>(),
            findingEvidenceChainService ?? Mock.Of<IFindingEvidenceChainService>(),
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IFindingTrustLabelMapper>(),
            Mock.Of<IReasoningSummaryBuilder>(),
            scopeProvider.Object,
            Mock.Of<ITraceabilityBundleBuilder>(),
            Mock.Of<IRunTrustEvidenceCardBuilder>(),
            Mock.Of<ILlmCostEstimator>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(a => a.GetEffectiveMode() == "Simulator"),
            Mock.Of<IAuditService>(),
            new ExportFormatterService(),
            Mock.Of<IFindingsSnapshotRepository>(),
            runStageOutcomesRepository ?? Mock.Of<IRunStageOutcomesRepository>(),
            enrichment)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }

    private static Mock<IAgentExecutionTraceRepository> CreateAgentExecutionTraceRepositoryMock()
    {
        Mock<IAgentExecutionTraceRepository> traces = new();
        WireDefaultLlmCostSliceRepositoryMock(traces);

        return traces;
    }

    private static void WireDefaultLlmCostSliceRepositoryMock(Mock<IAgentExecutionTraceRepository> traces)
    {
        traces
            .Setup(t => t.GetLlmCostSlicesByRunIdAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTraceLlmCostSlice>());
    }
}
