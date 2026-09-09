using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

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
                    Content = [],
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

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        });

        IAuthorityQueryService authorityQuery = SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun();
        IManifestHashService manifestHashService = SealedManifestHashTestSupport.CreateManifestHashService();
        Mock<IRunExportLineageVerifier> lineageVerifier = new();
        lineageVerifier
            .Setup(v => v.VerifyAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportLineageVerificationResult { Status = RunExportLineageVerificationStatus.Match });

        RunExportQueryFacade facade = new(
            runDetails.Object,
            exports.Object,
            Mock.Of<IComparisonAuditService>(),
            replay.Object,
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            audit.Object,
            lineageVerifier.Object,
            authorityQuery,
            manifestHashService,
            scopeProvider.Object);

        ExportsController sut = new(
            facade,
            authorityQuery,
            scopeProvider.Object,
            manifestHashService);
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "u")])),
            Request = { Method = "POST" },
        };
        sut.ControllerContext = new ControllerContext { HttpContext = http };

        await sut.ReplayExportRecord(
            "source-export",
            new ReplayExportRequest { RecordReplayExport = true },
            exports.Object,
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
