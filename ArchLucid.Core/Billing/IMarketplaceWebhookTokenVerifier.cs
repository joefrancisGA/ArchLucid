namespace ArchLucid.Core.Billing;

/// <summary>Validates Microsoft-signed JWTs on Azure Marketplace SaaS webhooks.</summary>
public interface IMarketplaceWebhookTokenVerifier
{
    /// <summary>Returns null when the token is invalid; otherwise a claim snapshot from the JWT.</summary>
    Task<MarketplaceWebhookValidatedToken?> ValidateAsync(string bearerToken, CancellationToken cancellationToken);
}
