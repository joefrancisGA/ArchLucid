using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Jobs;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Jobs;

[Trait("Category", "Unit")]
public sealed class BackgroundJobWorkUnitExecutorTests
{
    [Fact]
    public async Task ExecuteAsync_AnalysisDocx_LogsArchitectureDocxExportGenerated()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(r => r.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = runId, Status = ArchitectureRunStatus.Committed } });

        Mock<IArchitectureAnalysisService> analysis = new();
        ArchitectureAnalysisReport report = new();
        analysis.Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(
            report);

        Mock<IArchitectureAnalysisDocxExportService> docx = new();
        docx.Setup(d => d.GenerateDocxAsync(report, It.IsAny<CancellationToken>())).ReturnsAsync([1, 2, 3]);

        Mock<IArchitectureAnalysisConsultingDocxExportService> consulting = new();
        Mock<IAuditService> audit = new();
        Mock<ITenantDeletionService> tenantDeletion = new();

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            consulting.Object,
            audit.Object,
            tenantDeletion.Object);

        AnalysisReportDocxWorkUnit unit = new(
            new AnalysisReportDocxJobPayload { RunId = runId },
            "out.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        BackgroundJobFile file = await sut.ExecuteAsync(unit, CancellationToken.None);

        file.Bytes.Should().Equal(1, 2, 3);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ArchitectureDocxExportGenerated &&
                    e.RunId == Guid.ParseExact(runId, "N") &&
                    !string.IsNullOrWhiteSpace(e.CorrelationId) &&
                    e.CorrelationId.StartsWith("analysis-report-docx-async:", StringComparison.Ordinal) &&
                    e.OccurredUtc <= TimeProvider.System.UtcNowDateTime()),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ConsultingDocx_LogsArchitectureDocxExportGenerated()
    {
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(r => r.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = runId, Status = ArchitectureRunStatus.Committed } });

        Mock<IArchitectureAnalysisService> analysis = new();
        ArchitectureAnalysisReport report = new();
        analysis.Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(
            report);

        Mock<IArchitectureAnalysisDocxExportService> docx = new();
        Mock<IArchitectureAnalysisConsultingDocxExportService> consulting = new();
        consulting.Setup(c => c.GenerateDocxAsync(report, It.IsAny<ConsultingDocxExportBranding?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([9]);

        Mock<IAuditService> audit = new();
        Mock<ITenantDeletionService> tenantDeletion = new();

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            consulting.Object,
            audit.Object,
            tenantDeletion.Object);

        ConsultingDocxWorkUnit unit = new(
            new ConsultingDocxJobPayload { RunId = runId },
            "consult.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        BackgroundJobFile file = await sut.ExecuteAsync(unit, CancellationToken.None);

        file.Bytes.Should().Equal(9);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ArchitectureDocxExportGenerated &&
                    e.CorrelationId != null &&
                    e.CorrelationId.StartsWith("analysis-report-consulting-docx-async:", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_TenantDeletion_ReturnsJsonResult()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Mock<IRunDetailQueryService> runDetail = new();
        Mock<IArchitectureAnalysisService> analysis = new();
        Mock<IArchitectureAnalysisDocxExportService> docx = new();
        Mock<IArchitectureAnalysisConsultingDocxExportService> consulting = new();
        Mock<IAuditService> audit = new();
        Mock<ITenantDeletionService> tenantDeletion = new();
        tenantDeletion
            .Setup(t => t.DeleteTenantAsync(tenantId, It.IsAny<TenantDeletionInvocation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantDeletionResult
                {
                    TenantId = tenantId,
                    SqlRowsDeleted = 3,
                    SqlRowCountsByTable = new Dictionary<string, int> { ["Tenants"] = 1 },
                    BlobsDeletedByContainer = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["golden-manifests"] = 2
                    }
                });

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            consulting.Object,
            audit.Object,
            tenantDeletion.Object);

        TenantDeletionWorkUnit unit = new(
            new TenantDeletionJobPayload(tenantId, "actor-id", "actor-name", "corr-1"));

        BackgroundJobFile file = await sut.ExecuteAsync(unit, CancellationToken.None);

        file.ContentType.Should().Be("application/json");
        file.FileName.Should().Be("tenant-deletion-result.json");
        JsonSerializer.Deserialize<TenantDeletionResult>(file.Bytes)!.SqlRowsDeleted.Should().Be(3);
    }
}
