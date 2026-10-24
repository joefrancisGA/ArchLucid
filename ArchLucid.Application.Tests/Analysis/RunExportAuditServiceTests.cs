using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RunExportAuditServiceTests
{
    [Fact]
    public async Task RecordAsync_WhenEmitAuditTrue_LogsArchitectureDocxExportGenerated()
    {
        Mock<IRunExportRecordRepository> repo = new();
        Mock<IAuditService> audit = new();
        RunExportAuditService sut = new(repo.Object, audit.Object, NullLogger<RunExportAuditService>.Instance);
        const string runId = "deadbeefdeadbeefdeadbeefdeadbeef";

        RunExportRecord row = await sut.RecordAsync(
            runId,
            "analysis-report-consulting-docx",
            "docx",
            "file.docx",
            "sponsor",
            "Sponsor",
            false,
            null,
            "mv1",
            emitArchitectureDocxExportGeneratedAudit: true,
            cancellationToken: CancellationToken.None);

        row.ExportRecordId.Should().NotBeNullOrWhiteSpace();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ArchitectureDocxExportGenerated &&
                    e.RunId == Guid.ParseExact(runId, "N") &&
                    e.OccurredUtc <= TimeProvider.System.UtcNowDateTime() &&
                    e.DataJson.Contains(row.ExportRecordId, StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordAsync_trims_surrounding_whitespace_on_metadata_before_persist()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        await sut.RecordAsync(
            "  deadbeefdeadbeefdeadbeefdeadbeef  ",
            "  analysis-report-docx  ",
            "  docx  ",
            "  report.docx  ",
            null,
            null,
            false,
            null,
            null,
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.RunId.Should().Be("deadbeefdeadbeefdeadbeefdeadbeef");
        captured.ExportType.Should().Be("analysis-report-docx");
        captured.Format.Should().Be("docx");
        captured.FileName.Should().Be("report.docx");
    }

    [Fact]
    public async Task RecordAsync_trims_surrounding_whitespace_on_optional_template_profile_and_notes()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            "  executive-summary  ",
            null,
            false,
            null,
            null,
            analysisRequest: null,
            notes: "  operator note  ",
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.TemplateProfile.Should().Be("executive-summary");
        captured.Notes.Should().Be("operator note");
    }

    [Fact]
    public async Task RecordAsync_persists_compact_analysis_request_json_without_indentation()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            null,
            null,
            false,
            null,
            null,
            analysisRequest: new PersistedAnalysisExportRequest { IncludeEvidence = true },
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.AnalysisRequestJson.Should().NotContain("\n");
        captured.AnalysisRequestJson.Should().Contain("includeEvidence");
    }

    [Fact]
    public async Task RecordAsync_nulls_whitespace_only_whitelabel_firm_in_serialized_analysis_request()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        PersistedAnalysisExportRequest request = new()
        {
            ReviewBoardWhitelabelFirmDisplayName = "   ",
        };

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            null,
            null,
            false,
            null,
            null,
            analysisRequest: request,
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        PersistedAnalysisExportRequest? rehydrated = AnalysisExportRequestRehydrator.Rehydrate(captured!);

        rehydrated.Should().NotBeNull();
        rehydrated!.ReviewBoardWhitelabelFirmDisplayName.Should().BeNull();
        captured!.AnalysisRequestJson.Should().NotContain("reviewBoardWhitelabelFirmDisplayName");
    }

    [Fact]
    public async Task RecordAsync_nulls_whitespace_only_notes_before_persist()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            "executive-summary",
            null,
            false,
            null,
            null,
            analysisRequest: null,
            notes: "   ",
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.Notes.Should().BeNull();
    }

    [Fact]
    public async Task RecordAsync_trims_surrounding_whitespace_on_optional_display_name_resolution_and_manifest_version()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            null,
            "  Executive summary  ",
            false,
            "  auto-selected  ",
            "  v2  ",
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.TemplateProfileDisplayName.Should().Be("Executive summary");
        captured.ResolutionReason.Should().Be("auto-selected");
        captured.ManifestVersion.Should().Be("v2");
    }

    [Fact]
    public async Task RecordAsync_nulls_determinism_iterations_when_check_disabled()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        PersistedAnalysisExportRequest analysisRequest = new()
        {
            IncludeDeterminismCheck = false,
            DeterminismIterations = 4,
        };

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            null,
            null,
            false,
            null,
            null,
            analysisRequest: analysisRequest,
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.DeterminismIterations.Should().BeNull();
        captured.IncludedDeterminismCheck.Should().BeFalse();
    }

    [Fact]
    public async Task RecordAsync_nulls_zero_determinism_iterations_when_check_enabled()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        PersistedAnalysisExportRequest analysisRequest = new()
        {
            IncludeDeterminismCheck = true,
            DeterminismIterations = 0,
        };

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            null,
            null,
            false,
            null,
            null,
            analysisRequest: analysisRequest,
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.DeterminismIterations.Should().BeNull();
        captured.IncludedDeterminismCheck.Should().BeTrue();
    }

    [Fact]
    public async Task RecordAsync_trims_padded_compare_run_id_in_serialized_analysis_request()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        const string compareRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        PersistedAnalysisExportRequest analysisRequest = new()
        {
            IncludeAgentResultCompare = true,
            CompareRunId = $"  {compareRunId}  ",
            CompareManifestVersion = "  v3  ",
        };

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            null,
            null,
            false,
            null,
            null,
            analysisRequest: analysisRequest,
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.CompareRunId.Should().Be(compareRunId);
        captured.CompareManifestVersion.Should().Be("v3");
        captured.AnalysisRequestJson.Should().Contain(compareRunId);
        captured.AnalysisRequestJson.Should().Contain("\"v3\"");
    }

    [Fact]
    public async Task RecordAsync_trims_compare_manifest_version_when_emit_audit_false()
    {
        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord? captured = null;
        repo
            .Setup(r => r.CreateAsync(It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        RunExportAuditService sut = new(
            repo.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RunExportAuditService>.Instance);

        await sut.RecordAsync(
            "deadbeefdeadbeefdeadbeefdeadbeef",
            "analysis-report-docx",
            "docx",
            "report.docx",
            null,
            null,
            false,
            null,
            null,
            analysisRequest: new PersistedAnalysisExportRequest { CompareManifestVersion = "  v9  " },
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.CompareManifestVersion.Should().Be("v9");
        captured.AnalysisRequestJson.Should().Contain("\"v9\"");
    }

    [Fact]
    public async Task RecordAsync_WhenEmitAuditFalse_SkipsDurableDocxExportRow()
    {
        Mock<IRunExportRecordRepository> repo = new();
        Mock<IAuditService> audit = new();
        RunExportAuditService sut = new(repo.Object, audit.Object, NullLogger<RunExportAuditService>.Instance);

        await sut.RecordAsync(
            "a",
            "analysis-report-docx",
            "docx",
            "f.docx",
            null,
            null,
            false,
            null,
            null,
            emitArchitectureDocxExportGeneratedAudit: false,
            cancellationToken: CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordFailureAsync_trims_surrounding_whitespace_on_metadata_before_audit()
    {
        Mock<IRunExportRecordRepository> repo = new();
        Mock<IAuditService> audit = new();
        RunExportAuditService sut = new(repo.Object, audit.Object, NullLogger<RunExportAuditService>.Instance);
        const string runId = "deadbeefdeadbeefdeadbeefdeadbeef";

        await sut.RecordFailureAsync(
            $"  {runId}  ",
            "  analysis-report-docx  ",
            "  docx  ",
            "  export failed  ",
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.RunExportFailed &&
                    e.RunId == Guid.ParseExact(runId, "N") &&
                    e.DataJson.Contains($"\"runId\":\"{runId}\"", StringComparison.Ordinal) &&
                    e.DataJson.Contains("\"exportType\":\"analysis-report-docx\"", StringComparison.Ordinal) &&
                    e.DataJson.Contains("\"format\":\"docx\"", StringComparison.Ordinal) &&
                    e.DataJson.Contains("\"errorMessage\":\"export failed\"", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordFailureAsync_LogsExportFailedAudit()
    {
        Mock<IRunExportRecordRepository> repo = new();
        Mock<IAuditService> audit = new();
        RunExportAuditService sut = new(repo.Object, audit.Object, NullLogger<RunExportAuditService>.Instance);
        const string runId = "deadbeefdeadbeefdeadbeefdeadbeef";

        await sut.RecordFailureAsync(
            runId,
            "analysis-report-consulting-docx",
            "docx",
            "Mocked exception occurred",
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.RunExportFailed &&
                    e.RunId == Guid.ParseExact(runId, "N") &&
                    e.OccurredUtc <= TimeProvider.System.UtcNowDateTime() &&
                    e.DataJson.Contains("Mocked exception occurred", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
