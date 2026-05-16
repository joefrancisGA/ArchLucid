using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewExportServiceTests
{
    private static ArchitectureRunDetail CreateCommittedDetail(string runId)
    {
        GoldenManifest manifest = new()
        {
            RunId = runId,
            SystemName = "Contoso",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "v9", CreatedUtc = DateTime.UtcNow }
        };

        ArchitectureRun run = new()
        {
            RunId = runId,
            RequestId = "req-x",
            Status = ArchitectureRunStatus.Committed,
            CurrentManifestVersion = "v9",
            CreatedUtc = DateTime.UtcNow,
            CompletedUtc = DateTime.UtcNow
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
            HasBrokenManifestReference = false,
            DecisionTraces = []
        };
    }

    [Fact]
    public async Task GenerateReportAsync_returns_pdf_when_finalized()
    {
        string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        ArchitectureRunDetail detail = CreateCommittedDetail(runId);

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        GoldenManifest manifest = detail.Manifest!;
        ArchitectureAnalysisReport report = new() { Run = detail.Run, Manifest = manifest, Summary = "Summary text." };

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis.Setup(x => x.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(report);

        ArchitectureReviewExportService sut = new(runDetailQuery.Object, analysis.Object, new ArchitectureReviewDocxBuilder(), new ArchitectureReviewPdfBuilder());

        ExportResult result =
            await sut.GenerateReportAsync(runId, ExportFormat.Pdf, whitelabel: null, logoImageBytes: null, httpCorrelationId: "c1",
                CancellationToken.None);

        analysis.Verify(
            x => x.BuildAsync(It.Is<ArchitectureAnalysisRequest>(r => r.PreloadedRunDetail == detail && r.RunId == runId), It.IsAny<CancellationToken>()),
            Times.Once);

        result.ContentType.Should().Be("application/pdf");
        result.FileName.Should().StartWith("architecture-review-board-");

        using MemoryStream ms = new();
        await result.Content.CopyToAsync(ms);

        ms.Length.Should().BeGreaterThan(400);
        await result.Content.DisposeAsync();
    }

    [Fact]
    public async Task GenerateReportAsync_throws_when_run_missing()
    {
        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRunDetail?)null);

        ArchitectureReviewExportService sut = new(runDetailQuery.Object, Mock.Of<IArchitectureAnalysisService>(), new ArchitectureReviewDocxBuilder(),
            new ArchitectureReviewPdfBuilder());

        Func<Task> act = async () =>
            await sut.GenerateReportAsync("missing", ExportFormat.Docx, null, null, null, CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    [Fact]
    public async Task GenerateReportAsync_throws_conflict_when_not_finalized()
    {
        ArchitectureRunDetail detail = CreateCommittedDetail("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        detail.Manifest = null;

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(detail.Run.RunId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureReviewExportService sut = new(runDetailQuery.Object, Mock.Of<IArchitectureAnalysisService>(), new ArchitectureReviewDocxBuilder(),
            new ArchitectureReviewPdfBuilder());

        Func<Task> act = async () =>
            await sut.GenerateReportAsync(detail.Run.RunId, ExportFormat.Docx, null, null, null, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*finalized review*");
    }

    [Fact]
    public async Task GenerateReportAsync_throws_conflict_when_broken_manifest_reference()
    {
        ArchitectureRunDetail detail = CreateCommittedDetail("cccccccccccccccccccccccccccccccc");
        detail.Manifest = null;
        detail.HasBrokenManifestReference = true;

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(detail.Run.RunId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureReviewExportService sut = new(runDetailQuery.Object, Mock.Of<IArchitectureAnalysisService>(), new ArchitectureReviewDocxBuilder(),
            new ArchitectureReviewPdfBuilder());

        Func<Task> act = async () =>
            await sut.GenerateReportAsync(detail.Run.RunId, ExportFormat.Docx, null, null, null, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*broken manifest reference*");
    }
}
