using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;
using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

using AppReplayExportRequest = ArchLucid.Application.Analysis.ReplayExportRequest;
using ReplayExportRequest = ArchLucid.Api.Models.ReplayExportRequest;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ExportsControllerReplayExportAuditTests
{
    [SkippableFact]
    public async Task ReplayExportRecord_WhenReplayPersisted_LogsReplayExportRecordedWithDataJson()
    {
        const string sourceExportId = "source-export";
        const string victimRunId = "abc123def4567890abc123def4567890";

        Mock<IExportReplayService> replay = new();
        replay
            .Setup(r => r.ReplayAsync(It.IsAny<AppReplayExportRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ReplayExportResult
                {
                    ExportRecordId = sourceExportId,
                    RecordedReplayExportRecordId = "new-export-row",
                    RunId = victimRunId,
                    Format = "docx",
                    FileName = "r.docx",
                    Content = []
                });

        Mock<IRunExportRecordRepository> exports = new();
        exports
            .Setup(r => r.GetByIdAsync(sourceExportId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = sourceExportId, RunId = victimRunId });

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(victimRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = victimRunId } });

        Mock<IAuditService> audit = new();

        ExportsController sut = new(
            runDetails.Object,
            exports.Object,
            Mock.Of<IComparisonAuditService>(),
            replay.Object,
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            audit.Object);
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "u")])),
            Request = { Method = "POST" }
        };
        sut.ControllerContext = new ControllerContext { HttpContext = http };

        await sut.ReplayExportRecord(
            "source-export",
            new ReplayExportRequest { RecordReplayExport = true },
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ReplayExportRecorded
                    && !string.IsNullOrWhiteSpace(e.DataJson)
                    && e.DataJson.Contains("source-export", StringComparison.Ordinal)
                    && e.DataJson.Contains("new-export-row", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
