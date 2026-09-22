using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

using Moq;

namespace ArchLucid.Api.Tests.Support;

internal static class ArchitectureShareManagementServiceTestDefaults
{
    internal static Mock<IArchitectureShareManagementService> CreatePermissiveService()
    {
        Mock<IArchitectureShareManagementService> service = new();

        service
            .Setup(management => management.GetSharesAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareListResult.Success(
                new ArchitectureShareListResponse
                {
                    ArchitectureId = Guid.Empty,
                    RestrictToShares = false,
                    Shares = [],
                }));

        service
            .Setup(management => management.UpsertShareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareUpsertResult.Success());

        service
            .Setup(management => management.DeleteShareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareDeleteResult.Success());

        return service;
    }
}
