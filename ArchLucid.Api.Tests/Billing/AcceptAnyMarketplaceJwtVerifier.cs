using System.Security.Claims;

using ArchLucid.Core.Billing;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>Test double: accepts any non-empty bearer string so Marketplace webhook tests do not call Microsoft OIDC.</summary>
internal sealed class AcceptAnyMarketplaceJwtVerifier : IMarketplaceWebhookTokenVerifier
{
    public Task<ClaimsPrincipal?> ValidateAsync(string bearerToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(bearerToken)) return Task.FromResult<ClaimsPrincipal?>(null);


        return Task.FromResult<ClaimsPrincipal?>(new ClaimsPrincipal(new ClaimsIdentity()));
    }
}
