using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Maps OIDC/SAML operational diagnostics into unified health probes.</summary>
public static class IdentityProviderDiagnosticsHealthEvaluator
{
    private const int SamlSigningCertificateWarningDays = 30;

    public static AdminIdentityProviderDiagnosticsResponse BuildResponse(
        AdminOidcDiagnosticsResponse oidc,
        AdminSamlOperationalHealthResponse saml)
    {
        ArgumentNullException.ThrowIfNull(oidc);
        ArgumentNullException.ThrowIfNull(saml);

        return new AdminIdentityProviderDiagnosticsResponse
        {
            Oidc = EvaluateOidc(oidc),
            Saml = EvaluateSaml(saml),
        };
    }

    private static AdminIdentityProviderHealthProbe EvaluateOidc(AdminOidcDiagnosticsResponse oidc)
    {
        if (!string.Equals(oidc.AuthMode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.NotApplicable,
                Summary = oidc.DiagnosticSummary
                    ?? "ArchLucidAuth:Mode is not JwtBearer; OpenID Connect discovery is not used.",
            };
        }

        if (oidc.UsesLocalJwtSigningKey)
        {
            bool issuerConfigured = !string.IsNullOrWhiteSpace(oidc.LocalJwtIssuer);
            bool audienceConfigured = !string.IsNullOrWhiteSpace(oidc.LocalJwtAudience);

            if (issuerConfigured && audienceConfigured)
            {
                return new AdminIdentityProviderHealthProbe
                {
                    Status = IdentityProviderDiagnosticsHealthStatus.Healthy,
                    Summary = oidc.DiagnosticSummary
                        ?? "Local JWT signing key validation is configured with issuer and audience.",
                };
            }

            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Degraded,
                Summary = oidc.DiagnosticSummary
                    ?? "Local JWT signing key is configured but issuer or audience is missing.",
            };
        }

        if (oidc.DiscoverySucceeded == true)
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Healthy,
                Summary = oidc.DiagnosticSummary ?? "OpenID configuration document fetched successfully.",
            };
        }

        if (oidc.DiscoveryAttempted && oidc.DiscoverySucceeded == false)
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Unreachable,
                Summary = oidc.DiscoveryError
                    ?? oidc.DiagnosticSummary
                    ?? "OpenID Connect discovery endpoint is unreachable or returned an error.",
            };
        }

        return new AdminIdentityProviderHealthProbe
        {
            Status = IdentityProviderDiagnosticsHealthStatus.Degraded,
            Summary = oidc.DiagnosticSummary
                ?? oidc.DiscoveryError
                ?? "OIDC authority is not ready for discovery.",
        };
    }

    private static AdminIdentityProviderHealthProbe EvaluateSaml(AdminSamlOperationalHealthResponse saml)
    {
        if (!saml.Saml2Enabled)
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.NotApplicable,
                Summary = "SAML 2.0 SP integration is disabled (ArchLucidAuth:Saml2:Enabled is false).",
            };
        }

        if (!string.IsNullOrWhiteSpace(saml.SpSigningCertificateDiagnosticSummary))
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Unreachable,
                Summary = saml.SpSigningCertificateDiagnosticSummary,
            };
        }

        if (saml.SpSigningCertificateNotAfterUtc is not DateTimeOffset notAfterUtc)
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Degraded,
                Summary = "SAML SP signing certificate expiry could not be determined.",
            };
        }

        DateTimeOffset nowUtc = TimeProvider.System.GetUtcNow();

        if (notAfterUtc <= nowUtc)
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Unreachable,
                Summary = $"SAML SP signing certificate expired at {notAfterUtc:O}.",
            };
        }

        if (notAfterUtc <= nowUtc.AddDays(SamlSigningCertificateWarningDays))
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Degraded,
                Summary =
                    $"SAML SP signing certificate expires within {SamlSigningCertificateWarningDays} days ({notAfterUtc:O}).",
            };
        }

        if (saml.IdpMetadataValidUntilUtc is DateTimeOffset metadataValidUntil && metadataValidUntil <= nowUtc)
        {
            return new AdminIdentityProviderHealthProbe
            {
                Status = IdentityProviderDiagnosticsHealthStatus.Degraded,
                Summary = $"IdP metadata validUntil is in the past ({metadataValidUntil:O}).",
            };
        }

        return new AdminIdentityProviderHealthProbe
        {
            Status = IdentityProviderDiagnosticsHealthStatus.Healthy,
            Summary = "SAML SP signing certificate and metadata signals look healthy.",
        };
    }
}
