using System.Security.Claims;

namespace ArchLucid.Core.Billing;

/// <summary>Validates Microsoft-signed JWTs on Azure Marketplace SaaS webhooks.</summary>
public interface IMarketplaceWebhookTokenVerifier
{
    /// <summary>Returns null when the token is invalid; otherwise the principal claims.</summary>
    Task<ClaimsPrincipal?> ValidateAsync(string bearerToken, CancellationToken cancellationToken);
}
