using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Auth;
using ArchLucid.Api.Models.Auth;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PostAuthBootstrapControllerAcceptInvitationTests
{
    [Fact]
    public async Task AcceptInvitationAsync_returns_503_when_local_trial_jwt_misconfigured()
    {
        Guid userId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        Mock<IPostAuthBootstrapService> bootstrap = new();
        bootstrap
            .Setup(service => service.AcceptInvitationAsync(
                userId,
                "user@example.test",
                It.IsAny<PostAuthAcceptInvitationRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PostAuthBootstrapSessionResult
                {
                    Role = "Operator",
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    RedirectPath = "/reviews",
                });

        Mock<IAuthenticatedPlatformUserResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PlatformUserRecord
                {
                    Id = userId,
                    PrimaryEmail = "user@example.test",
                    AuthVersion = Guid.NewGuid(),
                });

        Mock<ILocalTrialJwtIssuer> jwtIssuer = new();
        jwtIssuer
            .Setup(issuer => issuer.IssueAccessToken(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>()))
            .Throws(
                new InvalidOperationException(
                    "Auth:Trial:LocalIdentity:JwtIssuer and JwtAudience must be configured."));

        Mock<IAuditService> audit = new();

        PostAuthBootstrapController controller = new(
            bootstrap.Object,
            resolver.Object,
            jwtIssuer.Object,
            Options.Create(new EmailOtpAuthOptions { AccessTokenLifetimeMinutes = 60 }),
            audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.AcceptInvitationAsync(
            new PostAuthAcceptInvitationBody
            {
                InvitationId = Guid.NewGuid(),
                InvitationToken = "token",
            },
            returnUrl: null,
            CancellationToken.None);

        ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        objectResult.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>();
    }
}
