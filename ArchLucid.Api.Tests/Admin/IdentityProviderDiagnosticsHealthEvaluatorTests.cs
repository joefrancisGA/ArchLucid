using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class IdentityProviderDiagnosticsHealthEvaluatorTests
{
    [Fact]
    public void BuildResponse_marks_oidc_not_applicable_when_auth_mode_is_not_jwt_bearer()
    {
        AdminOidcDiagnosticsResponse oidc = new()
        {
            AuthMode = "ApiKey",
            DiagnosticSummary = "ArchLucidAuth:Mode is not JwtBearer.",
        };

        AdminSamlOperationalHealthResponse saml = new() { Saml2Enabled = false };

        AdminIdentityProviderDiagnosticsResponse response =
            IdentityProviderDiagnosticsHealthEvaluator.BuildResponse(oidc, saml);

        response.Oidc.Status.Should().Be(IdentityProviderDiagnosticsHealthStatus.NotApplicable);
        response.Saml.Status.Should().Be(IdentityProviderDiagnosticsHealthStatus.NotApplicable);
    }

    [Fact]
    public void BuildResponse_marks_oidc_healthy_when_discovery_succeeds()
    {
        AdminOidcDiagnosticsResponse oidc = new()
        {
            AuthMode = "JwtBearer",
            DiscoveryAttempted = true,
            DiscoverySucceeded = true,
        };

        AdminSamlOperationalHealthResponse saml = new() { Saml2Enabled = false };

        AdminIdentityProviderDiagnosticsResponse response =
            IdentityProviderDiagnosticsHealthEvaluator.BuildResponse(oidc, saml);

        response.Oidc.Status.Should().Be(IdentityProviderDiagnosticsHealthStatus.Healthy);
    }

    [Fact]
    public void BuildResponse_marks_saml_unreachable_when_signing_certificate_expired()
    {
        AdminOidcDiagnosticsResponse oidc = new() { AuthMode = "ApiKey" };

        AdminSamlOperationalHealthResponse saml = new()
        {
            Saml2Enabled = true,
            SpSigningCertificateNotAfterUtc = DateTimeOffset.UtcNow.AddDays(-1),
        };

        AdminIdentityProviderDiagnosticsResponse response =
            IdentityProviderDiagnosticsHealthEvaluator.BuildResponse(oidc, saml);

        response.Saml.Status.Should().Be(IdentityProviderDiagnosticsHealthStatus.Unreachable);
        response.Saml.Summary.Should().Contain("expired");
    }

    [Fact]
    public void BuildResponse_marks_saml_degraded_when_signing_certificate_expires_soon()
    {
        AdminOidcDiagnosticsResponse oidc = new() { AuthMode = "ApiKey" };

        AdminSamlOperationalHealthResponse saml = new()
        {
            Saml2Enabled = true,
            SpSigningCertificateNotAfterUtc = DateTimeOffset.UtcNow.AddDays(7),
        };

        AdminIdentityProviderDiagnosticsResponse response =
            IdentityProviderDiagnosticsHealthEvaluator.BuildResponse(oidc, saml);

        response.Saml.Status.Should().Be(IdentityProviderDiagnosticsHealthStatus.Degraded);
    }
}
