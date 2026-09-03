using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

internal static class RoiCostEvidenceCollectionResolverTestSupport
{
    internal static RoiCostEvidenceCollectionResolver Create(
        IAzureExtractorPackageRepository azureRepository,
        ICloudInventoryExtractorPackageRepository cloudInventoryRepository,
        IRunRepository? runRepository = null,
        IRunEvidencePackagePinService? runEvidencePackagePinService = null)
    {
        Mock<IRunRepository> defaultRunRepository = new();
        defaultRunRepository
            .Setup(repo => repo.GetByIdAsync(
                It.IsAny<Core.Scoping.ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IRunEvidencePackagePinService> defaultPinService = new();
        defaultPinService
            .Setup(service => service.ResolvePinsFromHeader(It.IsAny<RunRecord?>()))
            .Returns([]);

        return new RoiCostEvidenceCollectionResolver(
            azureRepository,
            cloudInventoryRepository,
            runRepository ?? defaultRunRepository.Object,
            runEvidencePackagePinService ?? defaultPinService.Object);
    }
}
