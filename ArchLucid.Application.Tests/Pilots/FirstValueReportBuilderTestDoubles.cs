using ArchLucid.Application.Roi;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Application.Tests.Roi;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

internal static class FirstValueReportBuilderTestDoubles
{
    internal static RoiCostEvidenceCollectionResolver CreateDefaultCostEvidenceResolver()
    {
        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();

        return RoiCostEvidenceCollectionResolverTestSupport.Create(azureRepository.Object, cloudRepository.Object);
    }

    internal static IOptions<RoiCostEvidenceFreshnessOptions> CreateDefaultFreshnessOptions() =>
        Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 });

    internal static IGraphSnapshotRepository CreateGraphSnapshotRepository() =>
        Mock.Of<IGraphSnapshotRepository>();

    internal static IConfiguration CreateCareerExportReadyConfiguration() =>
        SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration();

    internal static IAgentExecutionTraceRepository CreateEmptyTraceRepository()
    {
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return traces.Object;
    }

    internal static IAuthorityQueryService CreateCareerExportReadyAuthorityQuery()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(service => service.GetRunDetailForExportAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) => new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                FindingCoverageSummary = new RunFindingCoverageSummary { EnginesSucceeded = 50 },
            });

        return authority.Object;
    }
}
