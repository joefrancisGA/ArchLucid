using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ExportsControllerScopeTests
{
    private const string VictimRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private const string ExportRecordId = "export-record-out-of-scope";

    [Fact]
    public async Task GetExportRecord_returns_not_found_when_run_is_out_of_scope()
    {
        ExportsController sut = CreateController(
            out Mock<IRunExportRecordRepository> exports,
            out Mock<IRunDetailQueryService> runDetails);

        exports
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = ExportRecordId, RunId = VictimRunId });

        runDetails
            .Setup(r => r.GetRunDetailAsync(VictimRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        IActionResult result = await sut.GetExportRecord(ExportRecordId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetExportRecord_returns_record_when_run_is_in_scope()
    {
        Guid runGuid = Guid.Parse(VictimRunId);
        const string manifestHash = "abc123";

        Mock<IRunExportRecordRepository> exports = new();
        exports
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = ExportRecordId, RunId = VictimRunId });

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(VictimRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = VictimRunId } });

        Mock<IRunExportLineageVerifier> lineageVerifier = new();
        lineageVerifier
            .Setup(v => v.VerifyAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportLineageVerificationResult { Status = RunExportLineageVerificationStatus.Match });

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(q => q.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runGuid },
                GoldenManifest = new ManifestDocument { ManifestHash = manifestHash },
            });

        Mock<IManifestHashService> manifestHashService = new();
        manifestHashService
            .Setup(s => s.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(manifestHash);

        ExportsController sut = CreateController(
            exports,
            runDetails,
            lineageVerifier: lineageVerifier,
            authorityQuery: authorityQuery,
            manifestHashService: manifestHashService);

        IActionResult result = await sut.GetExportRecord(ExportRecordId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        RunExportRecordResponse body = ok.Value.Should().BeOfType<RunExportRecordResponse>().Subject;
        body.Record.ExportRecordId.Should().Be(ExportRecordId);
    }

    [Fact]
    public async Task GetExportRecord_returns_409_when_lineage_unverified()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");

        Mock<IRunExportRecordRepository> exports = new();
        exports
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = ExportRecordId, RunId = runId });

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = runId } });

        Mock<IRunExportLineageVerifier> lineageVerifier = new();
        lineageVerifier
            .Setup(v => v.VerifyAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportLineageVerificationResult { Status = RunExportLineageVerificationStatus.Mismatch });

        ExportsController sut = CreateController(exports, runDetails, lineageVerifier: lineageVerifier);

        IActionResult result = await sut.GetExportRecord(ExportRecordId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task CompareExportRecords_returns_409_when_lineage_unverified()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        const string leftId = "left-export";
        const string rightId = "right-export";

        Mock<IRunExportRecordRepository> exports = new();
        exports
            .Setup(r => r.GetByIdAsync(leftId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = leftId, RunId = runId });
        exports
            .Setup(r => r.GetByIdAsync(rightId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = rightId, RunId = runId });

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = runId } });

        Mock<IRunExportLineageVerifier> lineageVerifier = new();
        lineageVerifier
            .Setup(v => v.VerifyAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportLineageVerificationResult { Status = RunExportLineageVerificationStatus.Mismatch });

        ExportsController sut = CreateController(exports, runDetails, lineageVerifier: lineageVerifier);

        IActionResult result = await sut.CompareExportRecords(leftId, rightId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    private static ExportsController CreateController(
        out Mock<IRunExportRecordRepository> exports,
        out Mock<IRunDetailQueryService> runDetails)
    {
        exports = new Mock<IRunExportRecordRepository>();
        runDetails = new Mock<IRunDetailQueryService>();

        return CreateController(exports, runDetails);
    }

    private static ExportsController CreateController(
        Mock<IRunExportRecordRepository> exports,
        Mock<IRunDetailQueryService> runDetails,
        Mock<IRunExportLineageVerifier>? lineageVerifier = null,
        Mock<IAuthorityQueryService>? authorityQuery = null,
        Mock<IManifestHashService>? manifestHashService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        RunExportQueryFacade facade = new(
            runDetails.Object,
            exports.Object,
            Mock.Of<IComparisonAuditService>(),
            Mock.Of<IExportReplayService>(),
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            Mock.Of<IAuditService>(),
            (lineageVerifier ?? new Mock<IRunExportLineageVerifier>()).Object,
            (authorityQuery ?? new Mock<IAuthorityQueryService>()).Object,
            (manifestHashService ?? new Mock<IManifestHashService>()).Object,
            scopeProvider.Object);

        ExportsController controller = new(facade);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
