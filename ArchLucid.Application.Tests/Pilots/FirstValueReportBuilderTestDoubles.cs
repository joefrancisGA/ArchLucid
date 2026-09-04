using ArchLucid.Application.Roi;
using ArchLucid.Application.Tests.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Data.Repositories;

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
}
