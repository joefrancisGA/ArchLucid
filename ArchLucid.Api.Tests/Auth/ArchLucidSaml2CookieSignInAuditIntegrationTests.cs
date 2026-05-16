using System.Security.Claims;

using ArchLucid.Api.Auth.Services;

using ArchLucid.Core.Audit;

using FluentAssertions;

using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;

using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidSaml2CookieSignInAuditIntegrationTests
{
    [Fact]
    public async Task MergeSignedInHandler_invokes_prior_handler_before_audit()
    {
        List<int> callOrder = [];
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback(() => callOrder.Add(2))
            .Returns(Task.CompletedTask);

        await using ServiceProvider provider = BuildProvider(audit.Object);

        CookieAuthenticationOptions options = new();
        options.Events = new CookieAuthenticationEvents
        {
            OnSignedIn = _ =>
            {
                callOrder.Add(1);

                return Task.CompletedTask;
            }
        };

        ArchLucidSaml2CookieSignInAuditIntegration.MergeSignedInHandler(options);

        DefaultHttpContext httpContext = new()
        {
            RequestServices = provider,
            TraceIdentifier = "trace-merge"
        };

        ClaimsPrincipal principal = new(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "subj-1")], "saml2"));

        AuthenticationScheme scheme = new(
            Saml2Constants.AuthenticationScheme,
            Saml2Constants.AuthenticationScheme,
            typeof(CookieAuthenticationHandler));

        CookieAuthenticationOptions cookieOptions = new();

        CookieSignedInContext context = new(
            httpContext,
            scheme,
            principal,
            new AuthenticationProperties(),
            cookieOptions);

        options.Events.OnSignedIn.Should().NotBeNull();
        await options.Events.OnSignedIn!(context);

        callOrder.Should().Equal(1, 2);
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    private static ServiceProvider BuildProvider(IAuditService audit)
    {
        ServiceCollection services = new();
        services.AddSingleton(audit);

        return services.BuildServiceProvider();
    }
}
