using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;

using ArchLucid.Core.Audit;

using FluentAssertions;

using ITfoxtec.Identity.Saml2;
using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidSaml2SignInAuditTests
{
    [Fact]
    public void IsItfoxtecSamlProtocolException_is_true_for_itfoxtec_namespace()
    {
        bool result = ArchLucidSaml2SignInAudit.IsItfoxtecSamlProtocolException(new SamlSignInAuditTestProtocolException());

        result.Should().BeTrue();
    }

    [Fact]
    public void IsItfoxtecSamlProtocolException_is_false_for_null()
    {
        ArchLucidSaml2SignInAudit.IsItfoxtecSamlProtocolException(null!).Should().BeFalse();
    }

    [Fact]
    public void IsItfoxtecSamlProtocolException_is_false_for_other_namespaces()
    {
        bool result = ArchLucidSaml2SignInAudit.IsItfoxtecSamlProtocolException(new InvalidOperationException());

        result.Should().BeFalse();
    }

    [Theory]
    [InlineData("/Auth/Login", true)]
    [InlineData("/auth/callback", true)]
    [InlineData("/AUTH/foo", true)]
    [InlineData("/v1/Auth/foo", false)]
    [InlineData("/Authentication/foo", false)]
    [InlineData("/", false)]
    public void IsSamlAuthRoute_matches_auth_prefix_only(string path, bool expected)
    {
        bool result = ArchLucidSaml2SignInAudit.IsSamlAuthRoute(path);

        result.Should().Be(expected);
    }

    [Fact]
    public async Task TryAppendProtocolFailureAudit_writes_failed_event_when_saml_enabled_and_route_matches()
    {
        TaskCompletionSource<AuditEvent> captured = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((e, _) => captured.TrySetResult(e))
            .Returns(Task.CompletedTask);

        await using ServiceProvider provider = BuildProvider(
            samlEnabled: true,
            audit.Object);

        DefaultHttpContext httpContext = new()
        {
            RequestServices = provider,
            TraceIdentifier = "corr-1"
        };

        httpContext.Request.Path = "/Auth/Saml2/Acs";

        await ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit(
            httpContext,
            new SamlSignInAuditTestProtocolException(),
            CancellationToken.None);

        AuditEvent auditEvent = await captured.Task.WaitAsync(TimeSpan.FromSeconds(5));
        auditEvent.EventType.Should().Be(AuditEventTypes.Saml2ServiceProviderSignInFailed);
        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.ActorUserId.Should().Be("saml2:sign-in-failed");
        auditEvent.ActorUserName.Should().Be("Saml2SignIn");
        auditEvent.CorrelationId.Should().Be("corr-1");

        using JsonDocument doc = JsonDocument.Parse(auditEvent.DataJson);
        doc.RootElement.GetProperty("scheme").GetString().Should().Be(Saml2Constants.AuthenticationScheme);
        doc.RootElement.GetProperty("exceptionType").GetString().Should().Be(nameof(SamlSignInAuditTestProtocolException));
        doc.RootElement.GetProperty("path").GetString().Should().Be("/Auth/Saml2/Acs");

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Theory]
    [InlineData("false")]
    [InlineData("")]
    public async Task TryAppendProtocolFailureAudit_skips_when_saml_not_enabled(string enabledValue)
    {
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        await using ServiceProvider provider = BuildProvider(
            samlEnabled: false,
            enabledRaw: enabledValue,
            audit: audit.Object);

        DefaultHttpContext httpContext = new() { RequestServices = provider };
        httpContext.Request.Path = "/Auth/x";

        await ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit(
            httpContext,
            new SamlSignInAuditTestProtocolException(),
            CancellationToken.None);

        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryAppendProtocolFailureAudit_skips_for_non_auth_paths()
    {
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        await using ServiceProvider provider = BuildProvider(samlEnabled: true, audit: audit.Object);

        DefaultHttpContext httpContext = new() { RequestServices = provider };
        httpContext.Request.Path = "/api/values";

        await ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit(
            httpContext,
            new SamlSignInAuditTestProtocolException(),
            CancellationToken.None);

        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryAppendProtocolFailureAudit_skips_for_non_itfoxtec_exceptions()
    {
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        await using ServiceProvider provider = BuildProvider(samlEnabled: true, audit: audit.Object);

        DefaultHttpContext httpContext = new() { RequestServices = provider };
        httpContext.Request.Path = "/Auth/x";

        await ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit(
            httpContext,
            new InvalidOperationException(),
            CancellationToken.None);

        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryAppendProtocolFailureAudit_swallows_audit_service_failures()
    {
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new IOException("audit down"));

        await using ServiceProvider provider = BuildProvider(samlEnabled: true, audit: audit.Object);

        DefaultHttpContext httpContext = new() { RequestServices = provider };
        httpContext.Request.Path = "/Auth/x";

        Func<Task> act = async () => await ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit(
            httpContext,
            new SamlSignInAuditTestProtocolException(),
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AppendCookieSignedInAudit_writes_succeeded_event_with_claim_shapes()
    {
        TaskCompletionSource<AuditEvent> captured = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((e, _) => captured.TrySetResult(e))
            .Returns(Task.CompletedTask);

        await using ServiceProvider provider = BuildProvider(samlEnabled: true, audit: audit.Object);

        DefaultHttpContext httpContext = new()
        {
            RequestServices = provider,
            TraceIdentifier = "corr-2"
        };

        Guid tenantId = Guid.Parse("a1c2e3f4-a5b6-7890-abcd-ef1234567890");
        ClaimsIdentity identity = new("Saml2", ClaimTypes.Name, ClaimTypes.Role);
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, "urn:oasis:names:tc:SAML:2.0:nameid:subject-xyz"));
        identity.AddClaim(new Claim(ClaimTypes.Name, "Ada"));
        identity.AddClaim(new Claim("tenant_id", tenantId.ToString()));

        ClaimsPrincipal principal = new(identity);

        AuthenticationScheme scheme = new(
            Saml2Constants.AuthenticationScheme,
            Saml2Constants.AuthenticationScheme,
            typeof(CookieAuthenticationHandler));

        CookieAuthenticationOptions cookieOptions = new();

        CookieSignedInContext cookieContext = new(
            httpContext,
            scheme,
            principal,
            new AuthenticationProperties(),
            cookieOptions);

        await ArchLucidSaml2SignInAudit.AppendCookieSignedInAudit(cookieContext, CancellationToken.None);

        AuditEvent auditEvent = await captured.Task.WaitAsync(TimeSpan.FromSeconds(5));
        auditEvent.EventType.Should().Be(AuditEventTypes.Saml2ServiceProviderSignInSucceeded);
        auditEvent.TenantId.Should().Be(tenantId);
        auditEvent.ActorUserId.Should().Be("saml2:nameid:urn:oasi");
        auditEvent.ActorUserName.Should().Be("Ada");
        auditEvent.CorrelationId.Should().Be("corr-2");

        using JsonDocument doc = JsonDocument.Parse(auditEvent.DataJson);
        doc.RootElement.GetProperty("scheme").GetString().Should().Be(Saml2Constants.AuthenticationScheme);
        doc.RootElement.GetProperty("nameIdPrefix").GetString().Should().Be("urn:oasi");
        doc.RootElement.GetProperty("hasTenantIdClaim").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("tenantIdClaim").GetGuid().Should().Be(tenantId);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ServiceProvider BuildProvider(bool samlEnabled, IAuditService audit, string? enabledRaw = null)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [$"{ArchLucidSamlAuthOptions.ConfigurationSectionPath}:Enabled"] =
                enabledRaw ?? (samlEnabled ? "true" : "false")
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        ServiceCollection services = new();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton<IAuditService>(audit);

        return services.BuildServiceProvider();
    }
}
