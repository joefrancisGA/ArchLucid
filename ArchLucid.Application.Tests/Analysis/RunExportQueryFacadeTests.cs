using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RunExportQueryFacadeTests
{
    [Fact]
    public async Task GetRunExportHistoryAsync_returns_run_not_found_for_whitespace_run_id_without_calling_detail_query()
    {
        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Value cannot be null or whitespace.", "runId"));

        RunExportQueryFacade sut = CreateFacade(runDetails);

        RunExportHistoryQueryResult result = await sut.GetRunExportHistoryAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.RunNotFound);
        result.MissingRunId.Should().Be("   ");
        runDetails.Verify(
            r => r.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RunExportQueryFacade CreateFacade(Mock<IRunDetailQueryService> runDetails)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        return new RunExportQueryFacade(
            runDetails.Object,
            Mock.Of<IRunExportRecordRepository>(),
            Mock.Of<IComparisonAuditService>(),
            Mock.Of<IExportReplayService>(),
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IRunExportLineageVerifier>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            scopeProvider.Object);
    }
}
