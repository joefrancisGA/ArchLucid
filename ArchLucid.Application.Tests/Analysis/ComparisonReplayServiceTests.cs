using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
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
    public async Task ReplayAsync_trims_padded_comparison_record_id_before_load()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-trim-id", report);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# md");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eExport: export.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest
            {
                ComparisonRecordId = "e2e-trim-id\n",
                Format = "markdown",
                ReplayMode = "artifact",
            },
            CancellationToken.None);

        result.ComparisonRecordId.Should().Be("e2e-trim-id");
        repo.Verify(r => r.GetByIdAsync("e2e-trim-id", It.IsAny<CancellationToken>()), Times.Once);
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

    [Fact]
    public async Task ReplayAsync_end_to_end_artifact_succeeds_when_comparison_type_has_surrounding_whitespace()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-padded-type", report);
        record.ComparisonType = $"  {ComparisonTypes.EndToEndReplay}  ";
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# md");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eExport: export.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest
            {
                ComparisonRecordId = "e2e-padded-type",
                Format = "markdown",
                ReplayMode = "artifact",
            },
            CancellationToken.None);

        result.ComparisonRecordId.Should().Be("e2e-padded-type");
        result.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
        result.Content.Should().Be("# md");
    }

    [Fact]
    public async Task CompareQuality_ReplayAsync_end_to_end_artifact_succeeds_when_comparison_type_has_legacy_casing()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-legacy-type-casing", report);
        record.ComparisonType = "  END-TO-END-REPLAY  ";
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# md");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, e2eExport: export.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest
            {
                ComparisonRecordId = "e2e-legacy-type-casing",
                Format = "markdown",
                ReplayMode = "artifact",
            },
            CancellationToken.None);

        result.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
        result.Content.Should().Be("# md");
    }

    [Fact]
    public async Task ReplayAsync_export_diff_artifact_succeeds_when_comparison_type_has_surrounding_whitespace()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-padded-type", diff);
        record.ComparisonType = $"  {ComparisonTypes.ExportRecordDiff}  ";
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# diff");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, diffFormatter: formatter.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest
            {
                ComparisonRecordId = "diff-padded-type",
                Format = "markdown",
                ReplayMode = "artifact",
            },
            CancellationToken.None);

        result.ComparisonRecordId.Should().Be("diff-padded-type");
        result.ComparisonType.Should().Be(ComparisonTypes.ExportRecordDiff);
        result.Content.Should().Be("# diff");
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
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, stored.LeftRunId, stored.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            e2eExport: export.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-regen", ReplayMode = "regenerate" },
            CancellationToken.None);

        result.ReplayMode.Should().Be("regenerate");
        result.Content.Should().Be("# regen");
        build.Verify(b => b.BuildAsync(stored.LeftRunId, stored.RightRunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_regenerate_calls_build_with_canonical_run_ids_when_record_uses_dashed_padding()
    {
        EndToEndReplayComparisonReport stored = SampleEndToEndReport();
        EndToEndReplayComparisonReport regenerated = SampleEndToEndReport();
        Guid leftGuid = Guid.Parse(stored.LeftRunId);
        Guid rightGuid = Guid.Parse(stored.RightRunId);
        string dashedPaddedLeft = $"{leftGuid:D}  ";
        string dashedPaddedRight = $"{rightGuid:D}  ";

        ComparisonRecord record = EndToEndRecord("e2e-regen-canonical-build", stored);
        record.LeftRunId = dashedPaddedLeft;
        record.RightRunId = dashedPaddedRight;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonService> build = new();
        build
            .Setup(b => b.BuildAsync(stored.LeftRunId, stored.RightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(regenerated);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# canonical-build");
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, stored.LeftRunId, stored.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            e2eExport: export.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-regen-canonical-build", ReplayMode = "regenerate" },
            CancellationToken.None);

        build.Verify(
            b => b.BuildAsync(stored.LeftRunId, stored.RightRunId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_regenerate_succeeds_when_comparison_record_run_ids_are_dashed_with_padding()
    {
        EndToEndReplayComparisonReport stored = SampleEndToEndReport();
        EndToEndReplayComparisonReport regenerated = SampleEndToEndReport();
        Guid leftGuid = Guid.Parse(stored.LeftRunId);
        Guid rightGuid = Guid.Parse(stored.RightRunId);
        string dashedPaddedLeft = $"{leftGuid:D}  ";
        string dashedPaddedRight = $"{rightGuid:D}  ";

        ComparisonRecord record = EndToEndRecord("e2e-dashed-run-id", stored);
        record.LeftRunId = dashedPaddedLeft;
        record.RightRunId = dashedPaddedRight;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonService> build = new();
        build
            .Setup(b => b.BuildAsync(dashedPaddedLeft, dashedPaddedRight, It.IsAny<CancellationToken>()))
            .ReturnsAsync(regenerated);
        Mock<IEndToEndReplayComparisonExportService> export = new();
        export.Setup(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>())).Returns("# dashed-e2e");
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, stored.LeftRunId, stored.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            e2eExport: export.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-dashed-run-id", ReplayMode = "regenerate" },
            CancellationToken.None);

        result.ReplayMode.Should().Be("regenerate");
        result.Content.Should().Be("# dashed-e2e");
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
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, report.LeftRunId, report.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            e2eExport: export.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

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
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, stored.LeftRunId, stored.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

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
    public async Task ReplayAsync_export_diff_artifact_returns_trimmed_comparison_record_id_on_result_metadata()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("cmp-trim-id", diff);
        record.ComparisonRecordId = "  cmp-trim-id  ";
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("cmp-trim-id", It.IsAny<CancellationToken>())).ReturnsAsync(record);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# diff");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, diffFormatter: formatter.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "cmp-trim-id", ReplayMode = "artifact" },
            CancellationToken.None);

        result.ComparisonRecordId.Should().Be("cmp-trim-id");
        result.FileName.Should().Be("comparison_cmp-trim-id.md");
    }

    [Fact]
    public async Task ReplayAsync_export_diff_artifact_returns_trimmed_export_record_ids_on_result_metadata()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-meta-trim", diff);
        record.LeftExportRecordId = $"  {diff.LeftExportRecordId}  ";
        record.RightExportRecordId = $"  {diff.RightExportRecordId}  ";
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# diff");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, diffFormatter: formatter.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-meta-trim", ReplayMode = "artifact" },
            CancellationToken.None);

        result.LeftExportRecordId.Should().Be(diff.LeftExportRecordId);
        result.RightExportRecordId.Should().Be(diff.RightExportRecordId);
    }

    [Fact]
    public async Task CompareQuality_ReplayAsync_export_diff_artifact_nulls_whitespace_only_export_record_ids_on_result_metadata()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-meta-whitespace-export", diff);
        record.LeftExportRecordId = "   ";
        record.RightExportRecordId = $"  {diff.RightExportRecordId}  ";
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# diff");
        ComparisonReplayService sut = CreateSut(comparisonRepo: repo.Object, diffFormatter: formatter.Object);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-meta-whitespace-export", ReplayMode = "artifact" },
            CancellationToken.None);

        result.LeftExportRecordId.Should().BeNull();
        result.RightExportRecordId.Should().Be(diff.RightExportRecordId);
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
    public async Task ReplayAsync_export_diff_artifact_throws_when_career_posture_blocks_metadata_read()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-career-artifact", diff);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Guid leftRunGuid = Guid.Parse(diff.LeftRunId);
        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                leftRunGuid,
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            diffFormatter: formatter.Object,
            careerGate: careerGate.Object);

        Func<Task> act = () => sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-career-artifact", ReplayMode = "artifact" },
            CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        formatter.Verify(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>()), Times.Never);
    }

    [Fact]
    public async Task ReplayAsync_end_to_end_artifact_throws_when_career_posture_blocks_metadata_read()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-career-artifact", report);
        Guid leftRunGuid = Guid.Parse(report.LeftRunId);
        record.LeftRunId = $"{leftRunGuid:D}  ";
        record.RightRunId = report.RightRunId;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                leftRunGuid,
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));
        Mock<IEndToEndReplayComparisonExportService> export = new();
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, report.LeftRunId, report.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eExport: export.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService,
            careerGate: careerGate.Object);

        Func<Task> act = () => sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-career-artifact", ReplayMode = "artifact" },
            CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        export.Verify(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>()), Times.Never);
    }

    [Fact]
    public async Task CompareQuality_ReplayAsync_end_to_end_artifact_throws_conflict_when_lifecycle_incomplete_before_career_gate()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("e2e-lifecycle-artifact", report);
        Guid leftGuid = Guid.Parse(report.LeftRunId);
        record.LeftRunId = $"{leftGuid:D}  ";
        record.RightRunId = report.RightRunId;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Guid leftRunGuid = Guid.Parse(report.LeftRunId);
        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                leftRunGuid,
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));
        Mock<IEndToEndReplayComparisonExportService> export = new();
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, report.LeftRunId, report.RightRunId);
        SetupAuthorityLifecycleInProgress(authority, report.LeftRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eExport: export.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService,
            careerGate: careerGate.Object);

        Func<Task> act = () => sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "e2e-lifecycle-artifact", ReplayMode = "artifact" },
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        careerGate.Verify(
            g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                It.IsAny<Guid>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        export.Verify(e => e.GenerateMarkdown(It.IsAny<EndToEndReplayComparisonReport>(), It.IsAny<string?>()), Times.Never);
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
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, stored.LeftRunId, stored.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            diffFormatter: formatter.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

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
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, diff.LeftRunId, diff.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            diffFormatter: formatter.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-verify", ReplayMode = "verify" },
            CancellationToken.None);

        result.VerificationPassed.Should().BeTrue();
    }

    [Fact]
    public async Task ReplayAsync_export_diff_regenerate_trims_padded_export_record_ids_before_lookup()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-padded", diff);
        record.LeftExportRecordId = $"  {diff.LeftExportRecordId}  ";
        record.RightExportRecordId = $"  {diff.RightExportRecordId}  ";
        RunExportRecord left = new() { ExportRecordId = diff.LeftExportRecordId, RunId = diff.LeftRunId };
        RunExportRecord right = new() { ExportRecordId = diff.RightExportRecordId, RunId = diff.RightRunId };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(diff.LeftExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(diff.RightExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        exports.Setup(r => r.GetByIdAsync(It.Is<string>(id => id != diff.LeftExportRecordId && id != diff.RightExportRecordId), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunExportRecord?)null);
        Mock<IExportRecordDiffService> diffService = new();
        diffService.Setup(s => s.CompareAsync(left, right, It.IsAny<CancellationToken>())).ReturnsAsync(diff);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# padded");
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, diff.LeftRunId, diff.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            diffFormatter: formatter.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-padded", ReplayMode = "regenerate" },
            CancellationToken.None);

        result.Content.Should().Be("# padded");
        exports.Verify(r => r.GetByIdAsync(diff.LeftExportRecordId, It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        exports.Verify(r => r.GetByIdAsync(diff.RightExportRecordId, It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ReplayAsync_export_diff_regenerate_succeeds_when_export_record_run_id_is_dashed_with_padding()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("diff-dashed-run-id", diff);
        record.LeftExportRecordId = diff.LeftExportRecordId;
        record.RightExportRecordId = diff.RightExportRecordId;

        Guid leftGuid = Guid.Parse(diff.LeftRunId);
        Guid rightGuid = Guid.Parse(diff.RightRunId);
        string dashedPaddedLeftRunId = $"{leftGuid:D}  ";
        string dashedPaddedRightRunId = $"{rightGuid:D}  ";

        RunExportRecord left = new() { ExportRecordId = diff.LeftExportRecordId, RunId = dashedPaddedLeftRunId };
        RunExportRecord right = new() { ExportRecordId = diff.RightExportRecordId, RunId = dashedPaddedRightRunId };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(left.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(right.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        Mock<IExportRecordDiffService> diffService = new();
        diffService.Setup(s => s.CompareAsync(left, right, It.IsAny<CancellationToken>())).ReturnsAsync(diff);
        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>())).Returns("# dashed-run-id");
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, diff.LeftRunId, diff.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            diffFormatter: formatter.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        ReplayComparisonResult result = await sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "diff-dashed-run-id", ReplayMode = "regenerate" },
            CancellationToken.None);

        result.Content.Should().Be("# dashed-run-id");
        left.RunId.Should().Be(diff.LeftRunId);
        right.RunId.Should().Be(diff.RightRunId);
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
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, report.LeftRunId, report.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

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
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, diff.LeftRunId, diff.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        DriftAnalysisResult result = await sut.AnalyzeDriftAsync("drift-diff", CancellationToken.None);

        result.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task AnalyzeDriftAsync_export_diff_succeeds_when_payload_export_record_ids_are_padded()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("drift-diff-padded-export-ids", diff);
        record.LeftExportRecordId = diff.LeftExportRecordId;
        record.RightExportRecordId = diff.RightExportRecordId;
        record.PayloadJson = JsonSerializer.Serialize(
            new ExportRecordDiffResult
            {
                LeftExportRecordId = $"  {diff.LeftExportRecordId}  ",
                RightExportRecordId = $"  {diff.RightExportRecordId}  ",
                LeftRunId = diff.LeftRunId,
                RightRunId = diff.RightRunId,
            },
            JsonOptions);

        RunExportRecord left = new() { ExportRecordId = diff.LeftExportRecordId, RunId = diff.LeftRunId };
        RunExportRecord right = new() { ExportRecordId = diff.RightExportRecordId, RunId = diff.RightRunId };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(left.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(right.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        Mock<IExportRecordDiffService> diffService = new();
        diffService.Setup(s => s.CompareAsync(left, right, It.IsAny<CancellationToken>())).ReturnsAsync(diff);
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, diff.LeftRunId, diff.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            driftAnalyzer: new ComparisonDriftAnalyzer(),
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        DriftAnalysisResult result = await sut.AnalyzeDriftAsync("drift-diff-padded-export-ids", CancellationToken.None);

        result.DriftDetected.Should().BeFalse();
    }

    [Fact]
    public async Task AnalyzeDriftAsync_export_diff_succeeds_when_export_anchor_run_id_is_dashed_with_padding()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("drift-diff-dashed-run", diff);
        record.LeftExportRecordId = diff.LeftExportRecordId;
        record.RightExportRecordId = diff.RightExportRecordId;

        Guid leftGuid = Guid.Parse(diff.LeftRunId);
        Guid rightGuid = Guid.Parse(diff.RightRunId);
        string dashedPaddedLeftRunId = $"{leftGuid:D}  ";
        string dashedPaddedRightRunId = $"{rightGuid:D}  ";

        RunExportRecord left = new() { ExportRecordId = diff.LeftExportRecordId, RunId = dashedPaddedLeftRunId };
        RunExportRecord right = new() { ExportRecordId = diff.RightExportRecordId, RunId = dashedPaddedRightRunId };
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(left.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(right.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        Mock<IExportRecordDiffService> diffService = new();
        diffService.Setup(s => s.CompareAsync(left, right, It.IsAny<CancellationToken>())).ReturnsAsync(diff);
        DriftAnalysisResult expected = new() { DriftDetected = false, Summary = "stable" };
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(expected);
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, diff.LeftRunId, diff.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            diffService: diffService.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        DriftAnalysisResult result = await sut.AnalyzeDriftAsync("drift-diff-dashed-run", CancellationToken.None);

        result.Should().BeSameAs(expected);
        left.RunId.Should().Be(diff.LeftRunId);
        right.RunId.Should().Be(diff.RightRunId);
    }

    [Fact]
    public async Task AnalyzeDriftAsync_end_to_end_throws_when_career_posture_blocks_metadata_read()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("drift-career-e2e", report);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Guid leftRunGuid = Guid.Parse(report.LeftRunId);
        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                leftRunGuid,
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));
        Mock<IEndToEndReplayComparisonService> build = new();
        build.Setup(b => b.BuildAsync(report.LeftRunId, report.RightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, report.LeftRunId, report.RightRunId);
        Mock<IComparisonDriftAnalyzer> drift = new();
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService,
            careerGate: careerGate.Object);

        Func<Task> act = () => sut.AnalyzeDriftAsync("drift-career-e2e", CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        build.Verify(b => b.BuildAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        drift.Verify(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzeDriftAsync_export_diff_throws_when_career_posture_blocks_metadata_read()
    {
        ExportRecordDiffResult diff = SampleExportDiff();
        ComparisonRecord record = ExportDiffRecord("drift-career-diff", diff);
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Guid leftRunGuid = Guid.Parse(diff.LeftRunId);
        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                leftRunGuid,
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));
        RunExportRecord left = new() { ExportRecordId = diff.LeftExportRecordId, RunId = diff.LeftRunId };
        RunExportRecord right = new() { ExportRecordId = diff.RightExportRecordId, RunId = diff.RightRunId };
        Mock<IRunExportRecordRepository> exports = new();
        exports.Setup(r => r.GetByIdAsync(left.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(left);
        exports.Setup(r => r.GetByIdAsync(right.ExportRecordId, It.IsAny<CancellationToken>())).ReturnsAsync(right);
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, diff.LeftRunId, diff.RightRunId);
        Mock<IComparisonDriftAnalyzer> drift = new();
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            runExports: exports.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService,
            careerGate: careerGate.Object);

        Func<Task> act = () => sut.AnalyzeDriftAsync("drift-career-diff", CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        drift.Verify(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzeDriftAsync_trims_padded_comparison_record_id_before_load()
    {
        EndToEndReplayComparisonReport report = SampleEndToEndReport();
        ComparisonRecord record = EndToEndRecord("drift-trim-id", report);
        record.LeftRunId = report.LeftRunId;
        record.RightRunId = report.RightRunId;
        Mock<IComparisonRecordRepository> repo = SetupRepo(record);
        Mock<IEndToEndReplayComparisonService> build = new();
        build.Setup(b => b.BuildAsync(report.LeftRunId, report.RightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);
        DriftAnalysisResult expected = new() { DriftDetected = false, Summary = "ok" };
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(expected);
        ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SetupSealedManifestForRuns(authority, manifestHashService, report.LeftRunId, report.RightRunId);
        ComparisonReplayService sut = CreateSut(
            comparisonRepo: repo.Object,
            e2eBuild: build.Object,
            driftAnalyzer: drift.Object,
            authorityQuery: authority.Object,
            manifestHash: manifestHashService);

        DriftAnalysisResult result = await sut.AnalyzeDriftAsync("drift-trim-id\n", CancellationToken.None);

        result.Should().BeSameAs(expected);
        repo.Verify(r => r.GetByIdAsync("drift-trim-id", It.IsAny<CancellationToken>()), Times.Once);
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
        IScopeContextProvider? scopeProvider = null,
        IRunExportCareerPostureGate? careerGate = null)
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
            scopeProvider ?? scope.Object,
            careerGate ?? Mock.Of<IRunExportCareerPostureGate>());
    }

    private static IComparisonDriftAnalyzer CreateDefaultDriftAnalyzer()
    {
        Mock<IComparisonDriftAnalyzer> drift = new();
        drift.Setup(d => d.Analyze(It.IsAny<object>(), It.IsAny<object>())).Returns(NoDrift());

        return drift.Object;
    }

    private static void SetupAuthorityLifecycleInProgress(Mock<IAuthorityQueryService> authority, string runId)
    {
        Guid guid = Guid.Parse(runId);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), guid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = guid,
                    LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
                    GoldenManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                },
            });
    }

    private static void SetupSealedManifestForRuns(
        Mock<IAuthorityQueryService> authority,
        IManifestHashService manifestHashService,
        params string[] runIds)
    {
        foreach (string runId in runIds)
        {
            Guid guid = Guid.Parse(runId);
            ManifestDocument manifest = new()
            {
                RunId = guid,
                TenantId = Guid.Empty,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                ManifestId = Guid.NewGuid(),
            };
            manifest.ManifestHash = manifestHashService.ComputeHash(manifest);
            authority
                .Setup(a => a.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), guid, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new RunDetailDto
                {
                    Run = new RunRecord { RunId = guid },
                    GoldenManifest = manifest,
                });
        }
    }
}
