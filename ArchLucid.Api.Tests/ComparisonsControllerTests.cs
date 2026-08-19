using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Host.Core.Configuration;

using FluentAssertions;

using FluentValidation;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonsControllerTests
{
    private const string RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private const string ComparisonId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    private const string ExportId = "cccccccccccccccccccccccccccccccc";

    private static ComparisonsController CreateController(
        IRunDetailQueryService? runDetailQueryService = null,
        IRunExportRecordRepository? runExportRecordRepository = null,
        IComparisonRecordRepository? comparisonRecordRepository = null,
        IComparisonReplayApiService? comparisonReplayApiService = null,
        IComparisonReplayCostEstimator? comparisonReplayCostEstimator = null)
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        Mock<IRunExportRecordRepository> exports = new();
        exports
            .Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunExportRecord?)null);

        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ComparisonRecord?)null);
        comparisons
            .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ComparisonRecord>());
        comparisons
            .Setup(r => r.GetByExportRecordIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ComparisonRecord>());
        comparisons
            .Setup(r => r.SearchAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ComparisonRecord>());
        comparisons
            .Setup(r => r.SearchByCursorAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ComparisonRecord>());

        Mock<IComparisonReplayApiService> replay = new();
        replay
            .Setup(s => s.AnalyzeDriftAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DriftAnalysisResult { Summary = "ok" });
        replay
            .Setup(s => s.ReplayAsync(It.IsAny<Application.Analysis.ReplayComparisonRequest>(), It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReplayComparisonResult
            {
                ComparisonRecordId = ComparisonId,
                ComparisonType = "end-to-end-replay",
                Format = "markdown",
                Content = "# summary"
            });

        Mock<IComparisonReplayCostEstimator> costEstimator = new();
        costEstimator
            .Setup(e => e.TryEstimateAsync(
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ComparisonReplayCostEstimate?)null);

        Mock<IDriftReportFormatter> driftFormatter = new();
        driftFormatter
            .Setup(f => f.FormatMarkdown(It.IsAny<DriftAnalysisResult>(), It.IsAny<string>()))
            .Returns("# drift");

        IValidator<ComparisonHistoryQuery> historyValidator = new ComparisonHistoryQueryValidator();
        IValidator<ArchLucid.Api.Models.ReplayComparisonRequest> replayValidator = new ReplayComparisonRequestValidator();
        Mock<IOptionsMonitor<BatchReplayOptions>> batchOptionsMonitor = new();
        batchOptionsMonitor.Setup(o => o.CurrentValue).Returns(new BatchReplayOptions());
        IValidator<BatchReplayComparisonRequest> batchValidator =
            new BatchReplayComparisonRequestValidator(batchOptionsMonitor.Object);

        return new ComparisonsController(
                runDetailQueryService ?? runDetail.Object,
                runExportRecordRepository ?? exports.Object,
                comparisonRecordRepository ?? comparisons.Object,
                comparisonReplayApiService ?? replay.Object,
                comparisonReplayCostEstimator ?? costEstimator.Object,
                driftFormatter.Object,
                new DriftReportDocxExport(),
                historyValidator,
                replayValidator,
                batchValidator)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
    }

    [Fact]
    public async Task GetRunComparisonHistory_returns_not_found_when_run_missing()
    {
        ComparisonsController controller = CreateController();

        IActionResult action = await controller.GetRunComparisonHistory(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRunComparisonHistory_returns_records_when_run_exists()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail());

        ComparisonRecord record = new() { ComparisonRecordId = ComparisonId, ComparisonType = "end-to-end-replay" };
        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { record });

        ComparisonsController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            comparisonRecordRepository: comparisons.Object);

        IActionResult action = await controller.GetRunComparisonHistory(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ComparisonHistoryResponse body = ok.Value.Should().BeOfType<ComparisonHistoryResponse>().Subject;
        body.Records.Should().ContainSingle(r => r.ComparisonRecordId == ComparisonId);
    }

    [Fact]
    public async Task GetExportRecordComparisonHistory_returns_not_found_when_export_missing()
    {
        ComparisonsController controller = CreateController();

        IActionResult action =
            await controller.GetExportRecordComparisonHistory(ExportId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetExportRecordComparisonHistory_returns_not_found_when_export_run_is_out_of_scope()
    {
        Mock<IRunExportRecordRepository> exports = new();
        exports
            .Setup(r => r.GetByIdAsync(ExportId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = ExportId, RunId = RunId });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        ComparisonsController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            runExportRecordRepository: exports.Object);

        IActionResult action =
            await controller.GetExportRecordComparisonHistory(ExportId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetComparisonRecord_returns_not_found_when_linked_run_is_out_of_scope()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = ComparisonId,
            ComparisonType = "end-to-end-replay",
            LeftRunId = RunId
        };

        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync(ComparisonId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        ComparisonsController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            comparisonRecordRepository: comparisons.Object);

        IActionResult action =
            await controller.GetComparisonRecord(ComparisonId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetComparisonRecord_returns_not_found_when_record_missing()
    {
        ComparisonsController controller = CreateController();

        IActionResult action =
            await controller.GetComparisonRecord(ComparisonId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetComparisonSummary_returns_stored_markdown_without_replay()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = ComparisonId,
            ComparisonType = "end-to-end-replay",
            LeftRunId = RunId,
            SummaryMarkdown = "## stored"
        };

        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync(ComparisonId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail());

        ComparisonsController controller = CreateController(
            runDetailQueryService: runDetail.Object,
            comparisonRecordRepository: comparisons.Object);

        IActionResult action = await controller.GetComparisonSummary(ComparisonId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ComparisonSummaryResponse body = ok.Value.Should().BeOfType<ComparisonSummaryResponse>().Subject;
        body.Summary.Should().Be("## stored");
    }

    [Fact]
    public async Task SearchComparisonRecords_returns_bad_request_for_invalid_sort_dir()
    {
        ComparisonsController controller = CreateController();

        IActionResult action = await controller.SearchComparisonRecords(
            new ComparisonHistoryQuery { SortDir = "sideways" },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task SearchComparisonRecords_uses_keyset_when_cursor_query_key_present_even_if_empty()
    {
        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.SearchByCursorAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ComparisonRecord>());

        ComparisonsController controller = CreateController(comparisonRecordRepository: comparisons.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Request =
                {
                    QueryString = new QueryString("?cursor=")
                }
            }
        };

        IActionResult action = await controller.SearchComparisonRecords(
            new ComparisonHistoryQuery { Cursor = string.Empty },
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        comparisons.Verify(
            r => r.SearchByCursorAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        comparisons.Verify(
            r => r.SearchAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateComparisonRecord_returns_bad_request_when_body_null()
    {
        ComparisonsController controller = CreateController();

        IActionResult action =
            await controller.UpdateComparisonRecord(ComparisonId, null, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task AnalyzeComparisonDrift_maps_service_result()
    {
        DriftAnalysisResult drift = new()
        {
            DriftDetected = true,
            Summary = "changed",
            Items =
            [
                new DriftItem
                {
                    Category = "service",
                    Path = "svc-a",
                    Description = "added",
                    StoredValue = null,
                    RegeneratedValue = "new"
                }
            ]
        };

        Mock<IComparisonReplayApiService> replay = new();
        replay
            .Setup(s => s.AnalyzeDriftAsync(ComparisonId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(drift);

        ComparisonsController controller = CreateController(comparisonReplayApiService: replay.Object);

        IActionResult action = await controller.AnalyzeComparisonDrift(ComparisonId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        DriftAnalysisResponse body = ok.Value.Should().BeOfType<DriftAnalysisResponse>().Subject;
        body.DriftDetected.Should().BeTrue();
        body.Items.Should().ContainSingle(i => i.Path == "svc-a");
    }

    [Fact]
    public async Task GetComparisonDriftReport_returns_bad_request_for_unknown_format()
    {
        ComparisonsController controller = CreateController();

        IActionResult action = await controller.GetComparisonDriftReport(
            ComparisonId,
            format: "pdf",
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }
}
