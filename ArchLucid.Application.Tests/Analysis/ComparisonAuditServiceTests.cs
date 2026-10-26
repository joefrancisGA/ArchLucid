using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ComparisonAuditServiceTests
{
    [Fact]
    public async Task RecordEndToEndAsync_payload_json_trims_nested_export_diff_metadata()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    LeftExportRecordId = "  left-anchor  ",
                    RightExportRecordId = "  right-anchor  ",
                    RequestDiff = new ExportRecordRequestDiff
                    {
                        LeftRequest = new PersistedAnalysisExportRequest { CompareManifestVersion = "  v-left  " },
                    },
                },
            ],
        };

        await sut.RecordEndToEndAsync(report, "# summary", CancellationToken.None);

        persisted.Should().NotBeNull();
        EndToEndReplayComparisonReport? payload = JsonSerializer.Deserialize<EndToEndReplayComparisonReport>(
            persisted!.PayloadJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true });
        payload.Should().NotBeNull();
        payload!.ExportDiffs.Should().ContainSingle();
        ExportRecordDiffResult nested = payload.ExportDiffs[0];
        nested.LeftExportRecordId.Should().Be("left-anchor");
        nested.RightExportRecordId.Should().Be("right-anchor");
        nested.RequestDiff.LeftRequest!.CompareManifestVersion.Should().Be("v-left");
    }

    [Fact]
    public async Task RecordEndToEndAsync_AfterCreate_LogsEndToEndComparisonPersisted()
    {
        Mock<IComparisonRecordRepository> repo = new();
        Mock<IAuditService> audit = new();
        ComparisonAuditService sut = new(repo.Object, audit.Object);
        EndToEndReplayComparisonReport report = new() { LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" };
        const string summary = "# Summary";

        string id = await sut.RecordEndToEndAsync(report, summary, CancellationToken.None);

        id.Should().NotBeNullOrWhiteSpace();
        repo.Verify(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.EndToEndComparisonPersisted &&
                    e.RunId == Guid.ParseExact("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "N") &&
                    e.DataJson.Contains(id, StringComparison.Ordinal) &&
                    e.DataJson.Contains(report.LeftRunId, StringComparison.Ordinal) &&
                    e.OccurredUtc <= TimeProvider.System.UtcNowDateTime()),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordReplayOfAsync_AfterCreate_LogsComparisonReplayPersisted()
    {
        Mock<IComparisonRecordRepository> repo = new();
        Mock<IAuditService> audit = new();
        ComparisonAuditService sut = new(repo.Object, audit.Object);
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "cccccccccccccccccccccccccccccccc",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "x",
            PayloadJson = "{}",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        string newId = await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        newId.Should().NotBeNullOrWhiteSpace();
        repo.Verify(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ComparisonReplayPersisted &&
                    e.RunId == Guid.ParseExact("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "N") &&
                    e.DataJson.Contains(newId, StringComparison.Ordinal) &&
                    e.DataJson.Contains(source.ComparisonRecordId, StringComparison.Ordinal) &&
                    e.OccurredUtc <= TimeProvider.System.UtcNowDateTime()),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordReplayOfAsync_default_notes_and_audit_trim_source_comparison_record_id()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        AuditEvent? logged = null;
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => logged = evt)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, audit.Object);
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "  cccccccccccccccccccccccccccccccc  ",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "x",
            PayloadJson = "{}",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, notes: null, CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.Notes.Should().Be("Replay of comparison record cccccccccccccccccccccccccccccccc.");
        logged.Should().NotBeNull();
        logged!.DataJson.Should().Contain("cccccccccccccccccccccccccccccccc");
        logged.DataJson.Should().NotContain("  cccccccccccccccccccccccccccccccc  ");
    }

    [Fact]
    public async Task CompareQuality_RecordReplayOfAsync_nulls_whitespace_only_export_ids_summary_and_format_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "dddddddddddddddddddddddddddddddd",
            ComparisonType = ComparisonTypes.ExportRecordDiff,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            LeftExportRecordId = "   ",
            RightExportRecordId = "  right-anchor  ",
            Format = "   ",
            SummaryMarkdown = "   ",
            PayloadJson = "{}",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.LeftExportRecordId.Should().BeNull();
        persisted.RightExportRecordId.Should().Be("right-anchor");
        persisted.Format.Should().BeEmpty();
        persisted.SummaryMarkdown.Should().BeNull();
    }

    [Fact]
    public async Task CompareQuality_RecordReplayOfAsync_clears_whitespace_only_payload_json_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# e2e",
            PayloadJson = "   ",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.PayloadJson.Should().BeEmpty();
    }

    [Fact]
    public async Task CompareQuality_RecordReplayOfAsync_clears_payload_json_when_typed_rehydrate_returns_null()
    {
        ComparisonRecord? exportPersisted = null;
        Mock<IComparisonRecordRepository> exportRepo = new();
        exportRepo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => exportPersisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService exportSut = new(exportRepo.Object, Mock.Of<IAuditService>());
        ComparisonRecord exportSource = new()
        {
            ComparisonRecordId = "ffffffffffffffffffffffffffffffff",
            ComparisonType = ComparisonTypes.ExportRecordDiff,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            LeftExportRecordId = "left-anchor",
            RightExportRecordId = "right-anchor",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# diff",
            PayloadJson = "null",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await exportSut.RecordReplayOfAsync(exportSource, "replay note", CancellationToken.None);

        exportPersisted.Should().NotBeNull();
        exportPersisted!.PayloadJson.Should().BeEmpty();

        ComparisonRecord? e2ePersisted = null;
        Mock<IComparisonRecordRepository> e2eRepo = new();
        e2eRepo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => e2ePersisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService e2eSut = new(e2eRepo.Object, Mock.Of<IAuditService>());
        ComparisonRecord e2eSource = new()
        {
            ComparisonRecordId = "11111111111111111111111111111111",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# e2e",
            PayloadJson = "null",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await e2eSut.RecordReplayOfAsync(e2eSource, "replay note", CancellationToken.None);

        e2ePersisted.Should().NotBeNull();
        e2ePersisted!.PayloadJson.Should().BeEmpty();
    }

    [Fact]
    public async Task RecordReplayOfAsync_trims_padded_export_record_anchors_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "dddddddddddddddddddddddddddddddd",
            ComparisonType = ComparisonTypes.ExportRecordDiff,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            LeftExportRecordId = "  left-anchor  ",
            RightExportRecordId = "  right-anchor  ",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# diff",
            PayloadJson = "{}",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.LeftExportRecordId.Should().Be("left-anchor");
        persisted.RightExportRecordId.Should().Be("right-anchor");
    }

    [Fact]
    public async Task RecordReplayOfAsync_rewrites_export_diff_payload_json_with_trimmed_export_record_ids()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "  left-anchor  ",
            RightExportRecordId = "  right-anchor  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };
        string payloadJson = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            ComparisonType = ComparisonTypes.ExportRecordDiff,
            LeftRunId = diff.LeftRunId,
            RightRunId = diff.RightRunId,
            LeftExportRecordId = "left-anchor",
            RightExportRecordId = "right-anchor",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# diff",
            PayloadJson = payloadJson,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        ExportRecordDiffResult? payload = JsonSerializer.Deserialize<ExportRecordDiffResult>(
            persisted!.PayloadJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true });
        payload.Should().NotBeNull();
        payload!.LeftExportRecordId.Should().Be("left-anchor");
        payload.RightExportRecordId.Should().Be("right-anchor");
    }

    [Fact]
    public async Task RecordReplayOfAsync_rewrites_export_diff_payload_when_source_comparison_type_has_legacy_casing()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "  left-anchor  ",
            RightExportRecordId = "  right-anchor  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };
        string payloadJson = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "11111111111111111111111111111111",
            ComparisonType = "EXPORT-RECORD-DIFF",
            LeftRunId = diff.LeftRunId,
            RightRunId = diff.RightRunId,
            LeftExportRecordId = "left-anchor",
            RightExportRecordId = "right-anchor",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# diff",
            PayloadJson = payloadJson,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.ComparisonType.Should().Be(ComparisonTypes.ExportRecordDiff);
        ExportRecordDiffResult? payload = JsonSerializer.Deserialize<ExportRecordDiffResult>(
            persisted.PayloadJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true });
        payload.Should().NotBeNull();
        payload!.LeftExportRecordId.Should().Be("left-anchor");
        payload.RightExportRecordId.Should().Be("right-anchor");
    }

    [Fact]
    public async Task RecordReplayOfAsync_rewrites_export_diff_payload_when_source_comparison_type_has_padding()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "  left-anchor  ",
            RightExportRecordId = "  right-anchor  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };
        string payloadJson = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "ffffffffffffffffffffffffffffffff",
            ComparisonType = $"  {ComparisonTypes.ExportRecordDiff}  ",
            LeftRunId = diff.LeftRunId,
            RightRunId = diff.RightRunId,
            LeftExportRecordId = "left-anchor",
            RightExportRecordId = "right-anchor",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# diff",
            PayloadJson = payloadJson,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.ComparisonType.Should().Be(ComparisonTypes.ExportRecordDiff);
        ExportRecordDiffResult? payload = JsonSerializer.Deserialize<ExportRecordDiffResult>(
            persisted.PayloadJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true });
        payload.Should().NotBeNull();
        payload!.LeftExportRecordId.Should().Be("left-anchor");
        payload.RightExportRecordId.Should().Be("right-anchor");
    }

    [Fact]
    public async Task RecordReplayOfAsync_trims_padded_manifest_version_columns_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "ffffffffffffffffffffffffffffffff",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            LeftManifestVersion = "  v-left  ",
            RightManifestVersion = "  v-right  ",
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# e2e",
            PayloadJson = "{}",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.LeftManifestVersion.Should().Be("v-left");
        persisted.RightManifestVersion.Should().Be("v-right");
    }

    [Fact]
    public async Task CompareQuality_RecordReplayOfAsync_canonicalizes_known_comparison_type_and_format_casing_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "dddddddddddddddddddddddddddddddd",
            ComparisonType = "  END-TO-END-REPLAY  ",
            LeftRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RightRunId = "cccccccccccccccccccccccccccccccc",
            Format = "  JSON+MARKDOWN  ",
            SummaryMarkdown = "# e2e",
            PayloadJson = "{}",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
        persisted.Format.Should().Be(ComparisonTypes.FormatJsonMarkdown);
    }

    [Fact]
    public async Task RecordReplayOfAsync_trims_padded_comparison_type_format_summary_and_notes_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ComparisonType = $"  {ComparisonTypes.EndToEndReplay}  ",
            LeftRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RightRunId = "cccccccccccccccccccccccccccccccc",
            Format = $"  {ComparisonTypes.FormatJsonMarkdown}  ",
            SummaryMarkdown = "  # e2e  ",
            PayloadJson = "{}",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "  replay note  ", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
        persisted.Format.Should().Be(ComparisonTypes.FormatJsonMarkdown);
        persisted.SummaryMarkdown.Should().Be("# e2e");
        persisted.Notes.Should().Be("replay note");
    }

    [Fact]
    public async Task RecordEndToEndAsync_trims_padded_summary_markdown_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };

        await sut.RecordEndToEndAsync(report, "  # summary  ", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.SummaryMarkdown.Should().Be("# summary");
    }

    [Fact]
    public async Task CompareQuality_RecordEndToEndAsync_nulls_whitespace_only_summary_markdown_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };

        await sut.RecordEndToEndAsync(report, "   ", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.SummaryMarkdown.Should().BeNull();
    }

    [Fact]
    public async Task CompareQuality_RecordExportDiffAsync_nulls_whitespace_only_summary_markdown_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "left-anchor",
            RightExportRecordId = "right-anchor",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };

        await sut.RecordExportDiffAsync(diff, "\t\n", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.SummaryMarkdown.Should().BeNull();
    }

    [Fact]
    public async Task RecordExportDiffAsync_AfterCreate_DoesNotLogDuplicateDurableRow()
    {
        Mock<IComparisonRecordRepository> repo = new();
        Mock<IAuditService> audit = new();
        ComparisonAuditService sut = new(repo.Object, audit.Object);
        ExportRecordDiffResult diff = new() { LeftExportRecordId = "l1", RightExportRecordId = "r1", LeftRunId = "lr", RightRunId = "rr" };

        await sut.RecordExportDiffAsync(diff, "# md", CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordExportDiffAsync_trims_surrounding_whitespace_on_export_record_anchors()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "  left-anchor  ",
            RightExportRecordId = "  right-anchor  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };

        await sut.RecordExportDiffAsync(diff, "# md", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.LeftExportRecordId.Should().Be("left-anchor");
        persisted.RightExportRecordId.Should().Be("right-anchor");
    }

    [Fact]
    public async Task RecordExportDiffAsync_payload_json_trims_export_record_anchors()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "  left-anchor  ",
            RightExportRecordId = "  right-anchor  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };

        await sut.RecordExportDiffAsync(diff, "# md", CancellationToken.None);

        persisted.Should().NotBeNull();
        ExportRecordDiffResult? payload = JsonSerializer.Deserialize<ExportRecordDiffResult>(
            persisted!.PayloadJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true });
        payload.Should().NotBeNull();
        payload!.LeftExportRecordId.Should().Be("left-anchor");
        payload.RightExportRecordId.Should().Be("right-anchor");
    }

    [Fact]
    public async Task RecordExportDiffAsync_payload_json_trims_nested_compare_manifest_version()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "left-anchor",
            RightExportRecordId = "right-anchor",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RequestDiff = new ExportRecordRequestDiff
            {
                LeftRequest = new PersistedAnalysisExportRequest { CompareManifestVersion = "  v-left  " },
                RightRequest = new PersistedAnalysisExportRequest { CompareManifestVersion = "  v-right  " },
            },
        };

        await sut.RecordExportDiffAsync(diff, "# md", CancellationToken.None);

        persisted.Should().NotBeNull();
        ExportRecordDiffResult? payload = JsonSerializer.Deserialize<ExportRecordDiffResult>(
            persisted!.PayloadJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true });
        payload.Should().NotBeNull();
        payload!.RequestDiff.LeftRequest!.CompareManifestVersion.Should().Be("v-left");
        payload.RequestDiff.RightRequest!.CompareManifestVersion.Should().Be("v-right");
    }

    [Fact]
    public async Task RecordReplayOfAsync_rewrites_end_to_end_payload_json_with_canonical_run_ids()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        string canonicalLeft = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        string canonicalRight = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        string dashedLeft = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        string dashedRight = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        EndToEndReplayComparisonReport report = new() { LeftRunId = dashedLeft, RightRunId = dashedRight };
        string payloadJson = JsonSerializer.Serialize(report, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "cccccccccccccccccccccccccccccccc",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = canonicalLeft,
            RightRunId = canonicalRight,
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = "# e2e",
            PayloadJson = payloadJson,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.RecordReplayOfAsync(source, "replay note", CancellationToken.None);

        persisted.Should().NotBeNull();
        EndToEndReplayComparisonReport? payload = JsonSerializer.Deserialize<EndToEndReplayComparisonReport>(
            persisted!.PayloadJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true });
        payload.Should().NotBeNull();
        payload!.LeftRunId.Should().Be(canonicalLeft);
        payload.RightRunId.Should().Be(canonicalRight);
    }

    [Fact]
    public async Task CompareQuality_RecordExportDiffAsync_nulls_whitespace_only_export_record_ids_on_persist()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "   ",
            RightExportRecordId = "  right-export  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };

        await sut.RecordExportDiffAsync(diff, "# md", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.LeftExportRecordId.Should().BeNull();
        persisted.RightExportRecordId.Should().Be("right-export");
        diff.LeftExportRecordId.Should().BeEmpty();
        diff.RightExportRecordId.Should().Be("right-export");
    }

    [Fact]
    public async Task RecordExportDiffAsync_treats_whitespace_only_run_ids_as_null()
    {
        ComparisonRecord? persisted = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => persisted = record)
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repo.Object, Mock.Of<IAuditService>());
        ExportRecordDiffResult diff = new()
        {
            LeftRunId = "   ",
            RightRunId = "\t",
        };

        await sut.RecordExportDiffAsync(diff, "# md", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.LeftRunId.Should().BeNull();
        persisted.RightRunId.Should().BeNull();
    }
}
