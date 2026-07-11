using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Analysis;
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
        Mock<IExportReplayService> replay = new();
        replay
            .Setup(r => r.ReplayAsync(It.IsAny<AppReplayExportRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ReplayExportResult
                {
                    ExportRecordId = "source-export",
                    RecordedReplayExportRecordId = "new-export-row",
                    RunId = "abc123def4567890abc123def4567890",
                    Format = "docx",
                    FileName = "r.docx",
                    Content = []
                });

        Mock<IAuditService> audit = new();

        ExportsController sut = new(
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IRunExportRecordRepository>(),
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
