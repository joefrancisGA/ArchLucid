using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IdentityProviderConfigurationControllerTests
{
    [Theory]
    [InlineData("file:///etc/passwd")]
    [InlineData("javascript:alert('xss')")]
    public void TestLogin_rejects_non_http_scheme_issuer_uri(string issuerUri)
    {
        IdentityProviderConfigurationController controller = CreateController();

        IActionResult result = controller.TestLogin(
            new IdentityProviderTestLoginRequest
            {
                Protocol = "oidc",
                IssuerUri = issuerUri,
                ClaimMapping = ValidClaimMapping(),
                SampleClaimValues = ["al-admins"],
            });

        ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        objectResult.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>();

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            (Microsoft.AspNetCore.Mvc.ProblemDetails)objectResult.Value!;

        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        problem.Detail.Should().Contain("HTTP(S)");
    }

    private static IdentityProviderConfigurationController CreateController()
    {
        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider
            .Setup(static p => p.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });

        IdentityProviderConfigurationController controller = new(
            Mock.Of<IIdentityProviderDiscoveryService>(),
            new SsoWizardTestLoginService(),
            Mock.Of<IIdentityProviderActivationService>(),
            Mock.Of<ITenantIdentityProviderConfigurationRepository>(),
            scopeContextProvider.Object,
            Mock.Of<IActorContext>(),
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        return controller;
    }

    private static IdentityClaimRoleMappingRequest ValidClaimMapping() => new()
    {
        RoleClaimName = "groups",
        Mappings =
        [
            new IdentityClaimRoleMappingEntryRequest
            {
                IdpValue = "al-admins",
                ArchLucidRole = "Admin",
            },
        ],
    };
}
