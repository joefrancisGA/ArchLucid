using ArchLucid.Contracts.Admin;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Evaluates inbound JWT role claims for SSO onboarding without validating token signatures.</summary>
public interface ITokenClaimsDiagnosticService
{
    Task<AdminTokenClaimsDiagnosticResponse> DiagnoseAsync(string bearerToken, CancellationToken cancellationToken);
}
