internal sealed class AcceptAnyMarketplaceJwtVerifier : IMarketplaceWebhookTokenVerifier
{
    public Task<MarketplaceWebhookValidatedToken?> ValidateAsync(string bearerToken, CancellationToken cancellationToken)
    {
        return string.IsNullOrWhiteSpace(bearerToken)
            ? Task.FromResult<MarketplaceWebhookValidatedToken?>(null)
            : Task.FromResult<MarketplaceWebhookValidatedToken?>(new MarketplaceWebhookValidatedToken([]));
    }
}
