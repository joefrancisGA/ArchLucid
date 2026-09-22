using System.Security.Claims;

using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Support;

internal static class ArchitectureShareAccessGateTestDefaults
{
    internal static Mock<IArchitectureShareAccessGate> CreatePermissiveGate()
    {
        Mock<IArchitectureShareAccessGate> gate = new();

        gate
            .Setup(service => service.EnsureArchitectureReadAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<ClaimsPrincipal>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);

        gate
            .Setup(service => service.EnsureArchitectureDecideAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<ClaimsPrincipal>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);

        gate
            .Setup(service => service.EvaluateArchitectureAsync(
                It.IsAny<ClaimsPrincipal>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                CanRead = true,
                CanDecide = true,
                CanAdmin = true,
            });

        return gate;
    }
}
