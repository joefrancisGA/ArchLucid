using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Queries;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
/// Board PDF/DOCX/HTML exports must surface simulator rehearsal notices like the one-pager markdown path.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardSimulatorModeExportTests
{
    [Fact]
    public void Create_sets_simulator_rehearsal_notice_when_run_is_simulator_mode()
    {
        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) = CreateFinalizedReview(StructuralExecutionMode.Simulator);

        ArchitectureReviewBoardExportDocumentModel model =
            ArchitectureReviewBoardExportDocumentFactory.Create(detail, report, httpCorrelationId: null, extractorTimestampUtcLabel: null);

        model.SimulatorRehearsalTitle.Should().Be(SimulatorModeExportRehearsalMarkdown.NoticeTitle);
        model.SimulatorRehearsalBody.Should().Be(SimulatorModeExportRehearsalMarkdown.NoticeBody);
    }

    [Fact]
    public async Task Docx_cover_includes_simulator_rehearsal_notice_for_simulator_runs()
    {
        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) = CreateFinalizedReview(StructuralExecutionMode.Simulator);

        ArchitectureReviewBoardExportDocumentModel model =
            ArchitectureReviewBoardExportDocumentFactory.Create(detail, report, httpCorrelationId: null, extractorTimestampUtcLabel: null);

        ArchitectureReviewDocxBuilder sut = new();
        byte[] docx = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain(SimulatorModeExportRehearsalMarkdown.NoticeTitle);
        text.Should().Contain("rule-based analysis in simulator mode");
    }

    [Fact]
    public async Task GenerateReportAsync_html_includes_simulator_rehearsal_notice_for_simulator_runs()
    {
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        ArchitectureRunDetail detail = CreateFinalizedReview(StructuralExecutionMode.Simulator).Detail;

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureAnalysisReport report = new()
        {
            Run = detail.Run,
            Manifest = detail.Manifest,
            Summary = "Summary text."
        };

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis.Setup(x => x.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(report);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        IAuthorityQueryService authorityQuery =
            SealedExportReceiptTestSupport.CreateAuthorityQueryService(Guid.Parse(runId), manifestHashService);

        ArchitectureReviewExportService sut = new(
            runDetailQuery.Object,
            authorityQuery,
            manifestHashService,
            analysis.Object,
            scope.Object,
            Mock.Of<ITenantRepository>(),
            Mock.Of<IRunExplanationSummaryService>(),
            tenantReviewBoardCoverLogoStore: null,
            new ArchitectureReviewDocxBuilder(),
            new ArchitectureReviewPdfBuilder());

        ExportResult result =
            await sut.GenerateReportAsync(runId, ExportFormat.Html, whitelabel: null, logoImageBytes: null, httpCorrelationId: null,
                CancellationToken.None);

        using MemoryStream ms = new();
        await result.Content.CopyToAsync(ms);
        string html = System.Text.Encoding.UTF8.GetString(ms.ToArray());

        html.Should().Contain("Simulator notice");
        html.Should().Contain(SimulatorModeExportRehearsalMarkdown.NoticeTitle);
        html.Should().Contain("rule-based analysis in simulator mode");

        await result.Content.DisposeAsync();
    }

    private static (ArchitectureRunDetail Detail, ArchitectureAnalysisReport Report) CreateFinalizedReview(
        StructuralExecutionMode executionMode)
    {
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        GoldenManifest manifest = new()
        {
            RunId = runId,
            SystemName = "Payments",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
        };

        ArchitectureRun run = new()
        {
            RunId = runId,
            RequestId = "req-sim",
            Status = ArchitectureRunStatus.Committed,
            CurrentManifestVersion = "v1",
            CreatedUtc = DateTime.UtcNow,
            CompletedUtc = DateTime.UtcNow,
            StructuralExecutionMode = executionMode,
        };

        ArchitectureRunDetail detail = new()
        {
            Run = run,
            Manifest = manifest,
            HasBrokenManifestReference = false,
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            DecisionTraces = [],
        };

        ArchitectureAnalysisReport report = new()
        {
            Run = run,
            Manifest = manifest,
            Summary = "Summary.",
        };

        return (detail, report);
    }

    private static string ExtractDocxBodyText(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);

        return doc.MainDocumentPart!.Document.Body!.InnerText;
    }
}
