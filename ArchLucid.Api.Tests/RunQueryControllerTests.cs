using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.Services.Authority;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
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
                ProblemDetail = "Run not found."
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRun(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRun_returns_ok_for_successful_detail()
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
        ok.Value.Should().BeSameAs(response);
    }

    [Fact]
    public async Task GetRunRoiEstimate_returns_not_found_for_whitespace_run_id_like_GetRun()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunRoiEstimateAsync("   ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRoiEstimateQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = "Run '   ' was not found."
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRunRoiEstimate("   ", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRunStageTimeline_returns_not_found_for_whitespace_run_id_like_GetRun()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetRunStageTimelineAsync("   ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunStageTimelineQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = "Run '   ' was not found."
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetRunStageTimeline("   ", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetInteractiveGraphSnapshot_returns_not_found_for_whitespace_run_id_like_GetRun()
    {
        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.GetInteractiveGraphSnapshotAsync("   ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunInteractiveGraphQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = "Run '   ' was not found."
            });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.GetInteractiveGraphSnapshot("   ", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetProvenanceNodeExplanation_returns_not_found_for_whitespace_run_id_like_GetArchitectureRunProvenance()
    {
        Mock<IRunProvenanceQueryService> provenance = new();
        provenance
            .Setup(s => s.AuthorityRunExistsInScopeAsync("   ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        RunQueryController controller = CreateController(runProvenanceQueryService: provenance.Object);

        IActionResult action = await controller.GetProvenanceNodeExplanation("   ", "node-1", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRunRoiEstimate_returns_scorecard_from_graph_service()
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
    }

    [Fact]
    public async Task ListRuns_returns_offset_page()
    {
        CursorPagedResponse<RunListItemResponse> body = new()
        {
            Items = [new RunListItemResponse { RunId = RunId, RequestId = "REQ-5" }],
            HasMore = false
        };

        Mock<IRunGraphQueryService> graph = new();
        graph
            .Setup(s => s.ListRunsAsync(
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunListQueryResult { Body = body, Etag = "\"etag\"" });

        RunQueryController controller = CreateController(runGraphQueryService: graph.Object);

        IActionResult action = await controller.ListRuns(cancellationToken: CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ExportRunFindingsCsv_returns_conflict_when_run_not_committed()
    {
        Mock<IRunFindingsQueryService> findings = new();
        findings
            .Setup(s => s.ExportRunFindingsCsvAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunFindingsCsvExportQueryResult
            {
                Outcome = RunFindingsQueryOutcome.Conflict,
                ProblemDetail = "Export requires a finalized review with a committed architecture snapshot."
            });

        RunQueryController controller = CreateController(runFindingsQueryService: findings.Object);

        IActionResult action = await controller.ExportRunFindingsCsv(
            RunId,
            Mock.Of<IAuditService>(),
            CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
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
                ProblemDetail = "Not found."
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
        ITraceabilityBundleExportApplicationService? traceabilityExport = null) =>
        new(
            runGraphQueryService ?? Mock.Of<IRunGraphQueryService>(),
            runFindingsQueryService ?? Mock.Of<IRunFindingsQueryService>(),
            runProvenanceQueryService ?? Mock.Of<IRunProvenanceQueryService>(),
            traceabilityExport ?? Mock.Of<ITraceabilityBundleExportApplicationService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
}
