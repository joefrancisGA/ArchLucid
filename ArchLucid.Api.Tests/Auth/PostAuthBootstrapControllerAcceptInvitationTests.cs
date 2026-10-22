using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;

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
                It.IsAny<Guid?>(),
                It.IsAny<int?>()))
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

    [Fact]
    public async Task AcceptInvitationAsync_jwt_lifetime_matches_clamped_email_otp_lifetime_when_trial_ttl_differs()
    {
        Guid userId = Guid.NewGuid();
        string privatePemPath = Path.Combine(Path.GetTempPath(), $"archlucid-bootstrap-lifetime-{Guid.NewGuid():N}.pem");

        using (RSA rsa = RSA.Create(2048))
        {
            File.WriteAllText(privatePemPath, rsa.ExportPkcs8PrivateKeyPem(), Encoding.UTF8);
        }

        try
        {
            const int trialLocalIdentityMinutes = 60;
            int expectedLifetimeSeconds = 24 * 60 * 60;

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
                        TenantId = Guid.NewGuid(),
                        WorkspaceId = Guid.NewGuid(),
                        ProjectId = Guid.NewGuid(),
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

            LocalTrialJwtIssuer issuer = new(
                Options.Create(
                    new TrialAuthOptions
                    {
                        LocalIdentity = new TrialLocalIdentityOptions
                        {
                            JwtIssuer = "https://issuer.test",
                            JwtAudience = "api://test",
                            JwtPrivateKeyPemPath = privatePemPath,
                            AccessTokenLifetimeMinutes = trialLocalIdentityMinutes
                        }
                    }));

            PostAuthBootstrapController controller = new(
                bootstrap.Object,
                resolver.Object,
                issuer,
                Options.Create(new EmailOtpAuthOptions { AccessTokenLifetimeMinutes = 2000 }),
                Mock.Of<IAuditService>())
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

            OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
            PostAuthBootstrapSessionResponse response = ok.Value.Should().BeOfType<PostAuthBootstrapSessionResponse>().Subject;
            response.ExpiresInSeconds.Should().Be(expectedLifetimeSeconds);

            JwtSecurityToken jwt = new JwtSecurityTokenHandler().ReadJwtToken(response.AccessToken);
            long expUnix = long.Parse(jwt.Claims.Single(claim => claim.Type == "exp").Value, System.Globalization.CultureInfo.InvariantCulture);
            long remainingSeconds = expUnix - DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            remainingSeconds.Should().BeCloseTo(expectedLifetimeSeconds, 30);
        }
        finally
        {
            if (File.Exists(privatePemPath))
            {
                File.Delete(privatePemPath);
            }
        }
    }
}
