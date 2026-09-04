using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
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
        ExportsController sut = CreateController(
            out Mock<IRunExportRecordRepository> exports,
            out Mock<IRunDetailQueryService> runDetails);

        RunExportRecord record = new() { ExportRecordId = ExportRecordId, RunId = VictimRunId };

        exports
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        runDetails
            .Setup(r => r.GetRunDetailAsync(VictimRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = VictimRunId } });

        IActionResult result = await sut.GetExportRecord(ExportRecordId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        RunExportRecordResponse body = ok.Value.Should().BeOfType<RunExportRecordResponse>().Subject;
        body.Record.ExportRecordId.Should().Be(ExportRecordId);
    }

    private static ExportsController CreateController(
        out Mock<IRunExportRecordRepository> exports,
        out Mock<IRunDetailQueryService> runDetails)
    {
        exports = new Mock<IRunExportRecordRepository>();
        runDetails = new Mock<IRunDetailQueryService>();

        RunExportQueryFacade facade = new(
            runDetails.Object,
            exports.Object,
            Mock.Of<IComparisonAuditService>(),
            Mock.Of<IExportReplayService>(),
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IRunExportLineageVerifier>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<IScopeContextProvider>());

        ExportsController controller = new(facade);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
