using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Services.Admin;

public interface ISsoWizardTestLoginService
{
    IdentityProviderTestLoginResponse Execute(
        IdentityProviderTestLoginRequest request,
        ScopeContext scope);
}

/// <inheritdoc cref="ISsoWizardTestLoginService" />
public sealed class SsoWizardTestLoginService : ISsoWizardTestLoginService
{
    /// <inheritdoc />
    public IdentityProviderTestLoginResponse Execute(
        IdentityProviderTestLoginRequest request,
        ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.IssuerUri))
        {
            return new IdentityProviderTestLoginResponse
            {
                Success = false,
                DiagnosticSummary = "IssuerUri is required."
            };
        }

        IdentityClaimRoleMappingDocument mapping = IdentityClaimRoleMappingResolver.ToDocument(request.ClaimMapping);

        try
        {
            IdentityClaimRoleMappingResolver.ValidateMapping(mapping);
        }
        catch (ArgumentException ex)
        {
            return new IdentityProviderTestLoginResponse
            {
                Success = false,
                DiagnosticSummary = ex.Message
            };
        }

        IReadOnlyList<string> mappedRoles =
            IdentityClaimRoleMappingResolver.ResolveRoles(mapping, request.SampleClaimValues);

        if (mappedRoles.Count == 0)
        {
            return new IdentityProviderTestLoginResponse
            {
                Success = false,
                DiagnosticSummary =
                    "No ArchLucid roles were mapped from the sample claim values. Adjust mappings or sample values."
            };
        }

        string token = SsoWizardSandboxJwtIssuer.IssuePreviewToken(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            mappedRoles,
            TimeSpan.FromSeconds(SsoWizardSandboxJwtIssuer.DefaultLifetimeSeconds));

        return new IdentityProviderTestLoginResponse
        {
            Success = true,
            MappedRoles = mappedRoles,
            AccessToken = token,
            ExpiresInSeconds = SsoWizardSandboxJwtIssuer.DefaultLifetimeSeconds,
            DiagnosticSummary =
                $"Sandbox test login succeeded. Mapped {mappedRoles.Count} role(s): {string.Join(", ", mappedRoles)}."
        };
    }
}
