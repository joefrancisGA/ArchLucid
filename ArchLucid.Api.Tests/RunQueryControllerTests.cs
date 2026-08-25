using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.Services.Authority;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunQueryControllerTests
{
    private static readonly string RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("N");

    [Fact]
    public async Task GetRun_returns_not_found_when_detail_missing()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunGraphDetailQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = "missing"
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRun_returns_not_found_when_manifest_reference_broken()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunGraphDetailQueryResult
            {
                Outcome = RunGraphQueryOutcome.ManifestNotFound,
                ProblemDetail = "broken manifest"
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRun_returns_ok_for_uncommitted_run()
    {
        RunDetailsResponse response = new()
        {
            Run = new ArchitectureRun { RunId = RunId, RequestId = "REQ-2" }
        };

        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunGraphDetailQueryResult
            {
                Outcome = RunGraphQueryOutcome.Success,
                Response = response,
                Etag = "\"etag\""
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetRun_maps_kernel_completeness_flags_onto_RunDetailsResponse()
    {
        RunDetailsResponse response = new()
        {
            Run = new ArchitectureRun { RunId = RunId, RequestId = "REQ-EK07" },
            AgentTaskLoopComplete = true,
            AuthorityPipelineComplete = false
        };

        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunGraphDetailQueryResult
            {
                Outcome = RunGraphQueryOutcome.Success,
                Response = response,
                Etag = "\"etag\""
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        RunDetailsResponse payload = ok.Value.Should().BeOfType<RunDetailsResponse>().Subject;
        payload.AgentTaskLoopComplete.Should().BeTrue();
        payload.AuthorityPipelineComplete.Should().BeFalse();
    }

    [Fact]
    public async Task GetRunRoiEstimate_returns_scorecard_from_estimator()
    {
        RunRoiScorecardDto scorecard = new()
        {
            RunId = RunId,
            ComputationNotes = "test",
            EstimatedManualHoursSaved = 4.5
        };

        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunRoiEstimateAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRoiEstimateQueryResult
            {
                Outcome = RunGraphQueryOutcome.Success,
                Estimate = scorecard
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRunRoiEstimate(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(scorecard);
    }

    [Fact]
    public async Task GetRun_returns_not_found_for_invalid_run_id_like_GetRun()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunDetailAsync("not-a-guid", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunGraphDetailQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = "invalid"
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRun("not-a-guid", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetInteractiveGraphSnapshot_returns_not_found_for_invalid_run_id_like_GetRun()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetInteractiveGraphSnapshotAsync("not-a-guid", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunInteractiveGraphQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = "invalid"
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetInteractiveGraphSnapshot("not-a-guid", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRunStageTimeline_returns_bad_request_when_run_id_blank()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunStageTimelineAsync("  ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunStageTimelineQueryResult
            {
                Outcome = RunGraphQueryOutcome.BadRequest,
                ProblemDetail = "blank"
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRunStageTimeline("  ", CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetRunStageTimeline_returns_timeline_when_run_exists()
    {
        DateTime started = DateTime.UtcNow;
        List<StageTimelineSummary> timeline =
        [
            new("Execute", started, started.AddMinutes(1), "Succeeded", 60_000)
        ];

        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunStageTimelineAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunStageTimelineQueryResult
            {
                Outcome = RunGraphQueryOutcome.Success,
                Timeline = timeline
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

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
        CursorPagedResponse<RunListItemResponse> body = new()
        {
            Items =
            [
                new RunListItemResponse
                {
                    RunId = RunId,
                    RequestId = "REQ-5",
                    Status = "Created"
                }
            ],
            HasMore = false,
            RequestedTake = 25
        };

        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.ListRunsAsync(
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunListQueryResult { Body = body, Etag = "\"list\"" });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.ListRuns(cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task ListRuns_returns_keyset_page_when_cursor_present()
    {
        CursorPagedResponse<RunListItemResponse> body = new()
        {
            Items =
            [
                new RunListItemResponse
                {
                    RunId = RunId,
                    RequestId = "REQ-6",
                    Status = "Committed"
                }
            ],
            HasMore = true,
            NextCursor = "cursor-2",
            RequestedTake = 25
        };

        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.ListRunsAsync(
                "cursor-1",
                null,
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunListQueryResult { Body = body, Etag = "\"list\"" });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.ListRuns(cursor: "cursor-1", cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetFindingEvidenceChain_returns_not_found_when_service_returns_null()
    {
        Mock<IRunFindingsQueryService> findings = new();
        findings
            .Setup(s => s.GetFindingEvidenceChainAsync(RunId, "finding-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingEvidenceChainQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = "missing"
            });

        RunQueryController controller = CreateController(runFindingsQueryService: findings.Object);

        IActionResult action = await controller.GetFindingEvidenceChain(
            RunId,
            "finding-1",
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static RunQueryController CreateController(
        IRunGraphQueryService? runGraphQueryService = null,
        IRunFindingsQueryService? runFindingsQueryService = null,
        IRunProvenanceQueryService? runProvenanceQueryService = null,
        ITraceabilityBundleExportApplicationService? traceabilityBundleExport = null)
    {
        return new RunQueryController(
            runGraphQueryService ?? Mock.Of<IRunGraphQueryService>(),
            runFindingsQueryService ?? Mock.Of<IRunFindingsQueryService>(),
            runProvenanceQueryService ?? Mock.Of<IRunProvenanceQueryService>(),
            traceabilityBundleExport ?? Mock.Of<ITraceabilityBundleExportApplicationService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
