using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Integrations.Itsm.Outbound;
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
        Mock<IItsmOutboundIssueCreationService> itsmOutbound = new();

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            consulting.Object,
            audit.Object,
            tenantDeletion.Object,
            itsmOutbound.Object);

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
        Mock<IItsmOutboundIssueCreationService> itsmOutbound = new();

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            consulting.Object,
            audit.Object,
            tenantDeletion.Object,
            itsmOutbound.Object);

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
                    !string.IsNullOrWhiteSpace(e.CorrelationId) &&
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
        Mock<IItsmOutboundIssueCreationService> itsmOutbound = new();
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
            tenantDeletion.Object,
            itsmOutbound.Object);

        TenantDeletionWorkUnit unit = new(
            new TenantDeletionJobPayload(tenantId, "actor-id", "actor-name", "corr-1"));

        BackgroundJobFile file = await sut.ExecuteAsync(unit, CancellationToken.None);

        file.ContentType.Should().Be("application/json");
        file.FileName.Should().Be("tenant-deletion-result.json");
        JsonSerializer.Deserialize<TenantDeletionResult>(file.Bytes)!.SqlRowsDeleted.Should().Be(3);
    }

    [Fact]
    public async Task ExecuteAsync_ItsmOutboundCreateSucceeded_ReturnsJsonResultAndLogsAudit()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        Mock<IArchitectureAnalysisService> analysis = new();
        Mock<IArchitectureAnalysisDocxExportService> docx = new();
        Mock<IArchitectureAnalysisConsultingDocxExportService> consulting = new();
        Mock<IAuditService> audit = new();
        Mock<ITenantDeletionService> tenantDeletion = new();
        Mock<IItsmOutboundIssueCreationService> itsmOutbound = new();

        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ItsmOutboundIssueCreationResult createResult = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.Succeeded,
            ExternalKey = "DP-42",
            AuditEvents =
            [
                new AuditEvent { EventType = AuditEventTypes.IntegrationJiraIssueCreateSucceeded, CorrelationId = "c1" }
            ]
        };

        itsmOutbound
            .Setup(s => s.TryCreateForFindingAsync(
                ItsmOutboundIssueProvider.Jira,
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                "finding-1",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(createResult);

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            consulting.Object,
            audit.Object,
            tenantDeletion.Object,
            itsmOutbound.Object);

        ItsmOutboundCreateWorkUnit unit = new(
            new ItsmOutboundCreateJobPayload(
                tenantId,
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Guid.Parse("44444444-4444-4444-4444-444444444444"),
                "finding-1",
                ItsmOutboundIssueProvider.Jira,
                "corr-itsm"));

        BackgroundJobFile file = await sut.ExecuteAsync(unit, CancellationToken.None);

        file.FileName.Should().Be("itsm-outbound-create-result.json");
        JsonSerializerOptions deserOpts = new() { PropertyNameCaseInsensitive = true };
        ItsmOutboundCreateJobResult? parsed = JsonSerializer.Deserialize<ItsmOutboundCreateJobResult>(file.Bytes, deserOpts);
        parsed.Should().NotBeNull();
        parsed!.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        parsed.ExternalKey.Should().Be("DP-42");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.IntegrationJiraIssueCreateSucceeded),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ItsmOutboundCreateVendor503_ThrowsForRetry()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        Mock<IArchitectureAnalysisService> analysis = new();
        Mock<IArchitectureAnalysisDocxExportService> docx = new();
        Mock<IArchitectureAnalysisConsultingDocxExportService> consulting = new();
        Mock<IAuditService> audit = new();
        Mock<ITenantDeletionService> tenantDeletion = new();
        Mock<IItsmOutboundIssueCreationService> itsmOutbound = new();

        itsmOutbound
            .Setup(s => s.TryCreateForFindingAsync(
                It.IsAny<ItsmOutboundIssueProvider>(),
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmOutboundIssueCreationResult
                {
                    Kind = ItsmOutboundCreateTerminalKind.VendorError,
                    VendorStatusCode = 503,
                    UserMessage = "upstream unavailable",
                    AuditEvents =
                    [
                        new AuditEvent { EventType = AuditEventTypes.IntegrationJiraIssueCreateFailed }
                    ]
                });

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            consulting.Object,
            audit.Object,
            tenantDeletion.Object,
            itsmOutbound.Object);

        ItsmOutboundCreateWorkUnit unit = new(
            new ItsmOutboundCreateJobPayload(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                "finding-x",
                ItsmOutboundIssueProvider.Jira,
                null));

        Func<Task> act = async () => _ = await sut.ExecuteAsync(unit, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*upstream unavailable*");
    }
}
