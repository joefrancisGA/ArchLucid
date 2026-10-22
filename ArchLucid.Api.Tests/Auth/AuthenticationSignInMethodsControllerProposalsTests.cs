using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Auth;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
public sealed class AuthenticationSignInMethodsControllerProposalsTests
{
    [Fact]
    public async Task ConfirmProposalAsync_returns_400_when_attachment_hits_duplicate_external_key()
    {
        PlatformUserRecord user = new()
        {
            Id = Guid.NewGuid(),
            DisplayName = "User",
            Status = PlatformUserStatus.Active
        };

        Guid proposalId = Guid.NewGuid();

        ExternalIdentityKey externalKey = new()
        {
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = "email-otp",
            Subject = "recovery@example.com"
        };

        Mock<IAuthenticationIdentityLinkingService> linking = new();
        linking.Setup(service => service.ConfirmLinkProposalAsync(
                user.Id,
                proposalId,
                user.Id.ToString("D"),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DuplicateAuthenticationIdentityException(externalKey));

        Mock<IAuthenticatedPlatformUserResolver> userResolver = new();
        userResolver.Setup(resolver => resolver.ResolveAsync(
                It.IsAny<ClaimsPrincipal>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        Mock<IAuditService> audit = new();

        AuthenticationSignInMethodsController sut = new(linking.Object, userResolver.Object, audit.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = CreateRecentlyAuthenticatedPrincipal()
                }
            }
        };

        IActionResult result = await sut.ConfirmProposalAsync(proposalId, CancellationToken.None);

        ObjectResult objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            Assert.IsType<Microsoft.AspNetCore.Mvc.ProblemDetails>(objectResult.Value);
        Assert.Equal("This sign-in method is already linked to another account.", problem.Detail);
        audit.Verify(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static ClaimsPrincipal CreateRecentlyAuthenticatedPrincipal()
    {
        long authTimeSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [new Claim("auth_time", authTimeSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture))],
            authenticationType: "Test");

        return new ClaimsPrincipal(identity);
    }
}
