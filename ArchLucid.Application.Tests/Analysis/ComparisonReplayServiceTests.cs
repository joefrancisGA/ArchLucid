using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
///     Unit tests for <see cref="ComparisonReplayService" /> replay modes, formats, drift, and persistence branches.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ComparisonReplayServiceTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task ReplayAsync_null_request_throws()
    {
        ComparisonReplayService sut = CreateSut();

        Func<Task> act = async () => await sut.ReplayAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task ReplayAsync_missing_record_throws()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((ComparisonRecord?)null);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object);

        ReplayComparisonRequest request = new() { ComparisonRecordId = "missing" };

        Func<Task> act = async () => await sut.ReplayAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*missing*");
    }

    [Fact]
    public async Task ReplayAsync_unsupported_comparison_type_throws()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c1",
            ComparisonType = "unsupported-type",
            PayloadJson = "{}"
        };
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(record);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object);

        ReplayComparisonRequest request = new() { ComparisonRecordId = "c1" };

        Func<Task> act = async () => await sut.ReplayAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*unsupported-type*");
    }

    [Theory]
    [InlineData("markdown", "markdown")]
    [InlineData("html", "html")]
    public async Task ReplayAsync_end_to_end_artifact_text_formats(string format, string expectedFormat)
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-1", report);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# md");
        export.Setup(e => e.GenerateHtml(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("<html/>");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eExport: export.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-1", Format = format, ReplayMode = "artifact" },
            CancellationToken.None);

        result.Format.Should().Be(expectedFormat);
        result.ReplayMode.Should().Be("artifact");
        result.Content.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_artifact_docx_returns_binary()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-docx", report);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateDocxAsync(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<CancellationToken>(), It.IsAny<string?>()))
            .ReturnsAsync([1, 2, 3]);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eExport: export.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-docx", Format = "docx", ReplayMode = "artifact" },
            CancellationToken.None);

        result.Format.Should().Be("docx");
        result.BinaryContent.Should().Equal([1, 2, 3]);
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_artifact_pdf_returns_binary()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-pdf", report);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GeneratePdfAsync(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<CancellationToken>(), It.IsAny<string?>()))
            .ReturnsAsync([9, 8]);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eExport: export.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-pdf", Format = "pdf", ReplayMode = "artifact" },
            CancellationToken.None);

        result.Format.Should().Be("pdf");
        result.BinaryContent.Should().Equal([9, 8]);
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_regenerate_calls_build_service()
    {
        EndToEndReplayComparisonReport stored = SampleEndToEndReport();
        EndToEndReplayComparisonReport regenerated = SampleEndToEndReport();
        regenerated.InterpretationNotes = ["regenerated"];
        ComparisonRecord record = EndToEndRecord("e2e-regen", stored);
        record.LeftRunId = stored.LeftRunId;
        record.RightRunId = stored.RightRunId;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonService> build = new();
        build.Setup(b => b.BuildAsync(stored.LeftRunId, stored.RightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(regenerated);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# regen");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eBuild: build.Object, e2eExport: export.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-regen", ReplayMode = "regenerate" },
            CancellationToken.None);

        result.ReplayMode.Should().Be("regenerate");
        result.Content.Should().Be("# regen");
        build.Verify(b => b.BuildAsync(stored.LeftRunId, stored.RightRunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_verify_pass_sets_verification_flags()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-verify", report);
        record.LeftRunId = report.LeftRunId;
        record.RightRunId = report.RightRunId;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonService> build = new();
        build.Setup(b => b.BuildAsync(report.LeftRunId, report.RightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# ok");
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(NoDrift());
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            e2eExport: export.Object,
            driftAnalyzer: drift.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-verify", ReplayMode = "verify" },
            CancellationToken.None);

        result.VerificationPassed.Should().BeTrue();
        result.VerificationMessage.Should().Contain("matches stored payload");
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_verify_drift_throws_ComparisonVerificationFailedException()
    {
        EndToEndReplayComparisonReport stored = SampleEndToEndReport();
        EndToEndReplayComparisonReport regenerated = SampleEndToEndReport();
        regenerated.Warnings = ["drift"];
        ComparisonRecord record = EndToEndRecord("e2e-drift", stored);
        record.LeftRunId = stored.LeftRunId;
        record.RightRunId = stored.RightRunId;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonService> build = new();
        build.Setup(b => b.BuildAsync(stored.LeftRunId, stored.RightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(regenerated);
        DriftAnalysisResult driftResult = new() { DriftDetected = true, Summary = "drift summary" };
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(driftResult);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eBuild: build.Object, driftAnalyzer: drift.Object);

        ReplayComparisonRequest request = new() { ComparisonRecordId = "e2e-drift", ReplayMode = "verify" };

        Func<Task> act = async () => await sut.ReplayAsync(request, CancellationToken.None);

        ComparisonVerificationFailedException ex = (await act.Should().ThrowAsync<ComparisonVerificationFailedException>()).Which;
        ex.Drift.Should().BeSameAs(driftResult);
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_regenerate_missing_run_ids_throws()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-no-runs", report);
        record.LeftRunId = string.Empty;
        record.RightRunId = string.Empty;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object);

        ReplayComparisonRequest request = new() { ComparisonRecordId = "e2e-no-runs", ReplayMode = "regenerate" };

        Func<Task> act = async () => await sut.ReplayAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*LeftRunId/RightRunId*");
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_invalid_payload_throws()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "e2e-bad",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            PayloadJson = string.Empty
        };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object);

        ReplayComparisonRequest request = new() { ComparisonRecordId = "e2e-bad", ReplayMode = "artifact" };

        Func<Task> act = async () => await sut.ReplayAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*valid end-to-end payload*");
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_unsupported_format_throws()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-fmt", report);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object);

        ReplayComparisonRequest request = new() { ComparisonRecordId = "e2e-fmt", Format = "zip", ReplayMode = "artifact" };

        Func<Task> act = async () => await sut.ReplayAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Unsupported replay format*");
    }

    [Fact]
    public async Task ReplayAsync_export_diff_artifact_markdown()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-md", diff);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# diff");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, diffFormatter: formatter.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-md", ReplayMode = "artifact" },
            CancellationToken.None);

        result.Format.Should().Be("markdown");
        result.Content.Should().Be("# diff");
    }

    [Fact]
    public async Task ReplayAsync_export_diff_artifact_docx()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-docx", diff);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IExportRecordDiffExportService> diffExport = new();
        diffExport.Setup(d => d.GenerateDocxAsync(It.IsAny<ExportRecordDiffResult>(), It.IsAny<CancellationToken>())).ReturnsAsync([5, 6]);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, diffExport: diffExport.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-docx", Format = "docx", ReplayMode = "artifact" },
            CancellationToken.None);

        result.Format.Should().Be("docx");
        result.BinaryContent.Should().Equal([5, 6]);
    }

    [Fact]
    public async Task ReplayAsync_export_diff_regenerate()
    {
        ExportRecordDiffResult stored = SampleExportDiff();
        ExportRecordDiffResult regenerated = SampleExportDiff();
        regenerated.Warnings = ["new"];
        ComparisonRecord record = ExportDiffRecord("diff-regen", stored);
        record.LeftExportRecordId = stored.LeftExportRecordId;
        record.RightExportRecordId = stored.RightExportRecordId;
        RunExportRecord left = new() { ExportRecordId = stored.LeftExportRecordId, RunId = stored.LeftRunId };
        RunExportRecord right = new() { ExportRecordId = stored.RightExportRecordId, RunId = stored.RightRunId };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(left.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(right.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        Mock<IExportRecordDiffService> diffService = new();
        diffService.Setup(s => s.CompareAsync(left, right, It.IsAny<CancellationToken>())).ReturnsAsync(regenerated);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# regenerated");
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            diffFormatter: formatter.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-regen", ReplayMode = "regenerate" },
            CancellationToken.None);

        result.Content.Should().Be("# regenerated");
        result.ReplayMode.Should().Be("regenerate");
    }

    [Fact]
    public async Task ReplayAsync_export_diff_verify_pass()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-verify", diff);
        record.LeftExportRecordId = diff.LeftExportRecordId;
        record.RightExportRecordId = diff.RightExportRecordId;
        RunExportRecord left = new() { ExportRecordId = diff.LeftExportRecordId, RunId = diff.LeftRunId };
        RunExportRecord right = new() { ExportRecordId = diff.RightExportRecordId, RunId = diff.RightRunId };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(left.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(right.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        Mock<IExportRecordDiffService> diffService = new();
        diffService.Setup(s => s.CompareAsync(left, right, It.IsAny<CancellationToken>())).ReturnsAsync(diff);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# ok");
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(NoDrift());
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            diffFormatter: formatter.Object,
            driftAnalyzer: drift.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-verify", ReplayMode = "verify" },
            CancellationToken.None);

        result.VerificationPassed.Should().BeTrue();
    }

    [Fact]
    public async Task ReplayAsync_export_diff_unsupported_format_throws()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-fmt", diff);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object);

        ReplayComparisonRequest request = new() { ComparisonRecordId = "diff-fmt", Format = "pdf", ReplayMode = "artifact" };

        Func<Task> act = async () => await sut.ReplayAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*export-record diff*");
    }

    [Fact]
    public async Task ReplayAsync_persist_replay_records_new_comparison()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("persist-src", report);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# md");
        Mock<IComparisonAuditService> audit = new();
        audit.Setup(a => a.RecordReplayOfAsync(record, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("new-record-id");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eExport: export.Object, audit: audit.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "persist-src", PersistReplay = true },
            CancellationToken.None);

        result.PersistedReplayRecordId.Should().Be("new-record-id");
    }

    [Fact]
    public async Task AnalyzeDriftAsync_end_to_end_returns_analyzer_result()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("drift-e2e", report);
        record.LeftRunId = report.LeftRunId;
        record.RightRunId = report.RightRunId;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonService> build = new();
        build.Setup(b => b.BuildAsync(report.LeftRunId, report.RightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);
        DriftAnalysisResult expected = new() { DriftDetected = false, Summary = "ok" };
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(expected);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eBuild: build.Object, driftAnalyzer: drift.Object);

        DriftAnalysisResult result = await sut.AnalyzeDriftAsync("drift-e2e", CancellationToken.None);

        result.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task AnalyzeDriftAsync_export_diff_returns_analyzer_result()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("drift-diff", diff);
        record.LeftExportRecordId = diff.LeftExportRecordId;
        record.RightExportRecordId = diff.RightExportRecordId;
        RunExportRecord left = new() { ExportRecordId = diff.LeftExportRecordId, RunId = diff.LeftRunId };
        RunExportRecord right = new() { ExportRecordId = diff.RightExportRecordId, RunId = diff.RightRunId };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(left.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(right.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        Mock<IExportRecordDiffService> diffService = new();
        diffService.Setup(s => s.CompareAsync(left, right, It.IsAny<CancellationToken>())).ReturnsAsync(diff);
        DriftAnalysisResult expected = new() { DriftDetected = true, Summary = "changed" };
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(expected);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            driftAnalyzer: drift.Object);

        DriftAnalysisResult result = await sut.AnalyzeDriftAsync("drift-diff", CancellationToken.None);

        result.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task AnalyzeDriftAsync_missing_record_throws()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((ComparisonRecord?)null);
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object);

        Func<Task> act = async () => await sut.AnalyzeDriftAsync("missing", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    private static DriftAnalysisResult NoDrift()
    {
        return new DriftAnalysisResult { DriftDetected = false, Summary = "No drift detected." };
    }

    private static EndToEndReplayComparisonReport SampleEndToEndReport()
    {
        return new EndToEndReplayComparisonReport
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        };
    }

    private static ExportRecordDiffResult SampleExportDiff()
    {
        return new ExportRecordDiffResult
        {
            LeftExportRecordId = "left-export",
            RightExportRecordId = "right-export",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        };
    }

    private static ComparisonRecord EndToEndRecord(string id, EndToEndReplayComparisonReport report)
    {
        return new ComparisonRecord
        {
            ComparisonRecordId = id,
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = report.LeftRunId,
            RightRunId = report.RightRunId,
            PayloadJson = JsonSerializer.Serialize(report, JsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }

    private static ComparisonRecord ExportDiffRecord(string id, ExportRecordDiffResult diff)
    {
        return new ComparisonRecord
        {
            ComparisonRecordId = id,
            ComparisonType = ComparisonTypes.ExportRecordDiff,
            LeftRunId = diff.LeftRunId,
            RightRunId = diff.RightRunId,
            LeftExportRecordId = diff.LeftExportRecordId,
            RightExportRecordId = diff.RightExportRecordId,
            PayloadJson = JsonSerializer.Serialize(diff, JsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }

    private static Mock<IComparisonRecordRepository> SetupRepo(ComparisonRecord record)
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(record.ComparisonRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(record);

        return repo;
    }

    private static ComparisonReplayService CreateSut(
        IComparisonRecordRepository? comparisonRepo = null,
        IComparisonAuditService? audit = null,
        IComparisonDriftAnalyzer? driftAnalyzer = null,
        IEndToEndReplayComparisonService? e2eBuild = null,
        IEndToEndReplayComparisonExportService? e2eExport = null,
        IExportRecordDiffService? diffService = null,
        IExportRecordDiffSummaryFormatter? diffFormatter = null,
        IExportRecordDiffExportService? diffExport = null,
        IRunExportRecordRepository? runExports = null,
        IAuthorityQueryService? authorityQuery = null,
        IManifestHashService? manifestHash = null,
        IScopeContextProvider? scopeProvider = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        return new ComparisonReplayService(
            comparisonRepo ?? Mock.Of<IComparisonRecordRepository>(),
            audit ?? Mock.Of<IComparisonAuditService>(),
            driftAnalyzer ?? CreateDefaultDriftAnalyzer(),
            e2eBuild ?? Mock.Of<IEndToEndReplayComparisonService>(),
            e2eExport ?? Mock.Of<IEndToEndReplayComparisonExportService>(),
            diffService ?? Mock.Of<IExportRecordDiffService>(),
            diffFormatter ?? Mock.Of<IExportRecordDiffSummaryFormatter>(),
            diffExport ?? Mock.Of<IExportRecordDiffExportService>(),
            runExports ?? Mock.Of<IRunExportRecordRepository>(),
            authorityQuery ?? authority.Object,
            manifestHash ?? Mock.Of<IManifestHashService>(),
            scopeProvider ?? scope.Object);
    }

    private static IComparisonDriftAnalyzer CreateDefaultDriftAnalyzer()
    {
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(NoDrift());

        return drift.Object;
    }
}
