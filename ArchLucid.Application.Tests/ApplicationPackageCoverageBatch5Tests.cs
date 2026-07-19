using ArchLucid.Application.Analysis;
using ArchLucid.Application.Jobs;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch5Tests
{
    [Fact]
    public async Task ComparisonAuditService_records_export_diff_without_audit_row()
    {
        Mock<IComparisonRecordRepository> repository = new();
        repository.Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        ComparisonAuditService sut = new(repository.Object, audit.Object);
        ExportRecordDiffResult diff = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            LeftExportRecordId = "lex",
            RightExportRecordId = "rex",
        };

        string id = await sut.RecordExportDiffAsync(diff, summaryMarkdown: "summary", CancellationToken.None);

        id.Should().NotBeNullOrWhiteSpace();
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ComparisonAuditService_replays_source_record_and_audits()
    {
        Mock<IComparisonRecordRepository> repository = new();
        repository.Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ComparisonAuditService sut = new(repository.Object, audit.Object);
        ComparisonRecord source = new()
        {
            ComparisonRecordId = "source-1",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = Guid.NewGuid().ToString("N"),
            RightRunId = Guid.NewGuid().ToString("N"),
            PayloadJson = "{}",
            SummaryMarkdown = "md",
        };

        string id = await sut.RecordReplayOfAsync(source, notes: "replay", CancellationToken.None);

        id.Should().NotBeNullOrWhiteSpace();
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void TrialLifecycleEmailIntegrationEnvelope_exposes_trigger_and_scope_ids()
    {
        Guid tenantId = Guid.NewGuid();

        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            Trigger = TrialLifecycleEmailTrigger.Converted,
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        envelope.Trigger.Should().Be(TrialLifecycleEmailTrigger.Converted);
        envelope.TenantId.Should().Be(tenantId);
    }

    [Fact]
    public void AnalysisReportDocxWorkUnit_exposes_payload_and_file_metadata()
    {
        AnalysisReportDocxWorkUnit unit = new(
            new AnalysisReportDocxJobPayload { RunId = "run-abc" },
            FileName: "report.docx",
            ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        unit.Payload.RunId.Should().Be("run-abc");
        unit.FileName.Should().Be("report.docx");
        unit.ContentType.Should().Contain("wordprocessingml");
    }
}
