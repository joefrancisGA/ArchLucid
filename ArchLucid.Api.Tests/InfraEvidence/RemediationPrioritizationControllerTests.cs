using ArchLucid.Api.Controllers.OperationalSecurity;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RemediationPrioritizationControllerTests
{
    [Fact]
    public async Task UpdateWeights_rejects_undefined_numeric_factor_without_saving()
    {
        Mock<IRemediationPrioritizationService> service = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });
        RemediationPrioritizationController controller = new(service.Object, scopeProvider.Object, Mock.Of<IActorContext>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.UpdateWeights(
            new Dictionary<string, decimal> { ["999"] = 0.5m }, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        service.VerifyNoOtherCalls();
    }
}
