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
