using System.Security.Claims;

namespace ArchLucid.Core.Billing;

/// <summary>Claim snapshot from a validated Marketplace webhook JWT without surfacing HTTP principal types on Core contracts.</summary>
public sealed class MarketplaceWebhookValidatedToken
{
    private readonly Dictionary<string, string> _firstClaimByType;

    public MarketplaceWebhookValidatedToken(IEnumerable<Claim> claims)
    {
        ArgumentNullException.ThrowIfNull(claims);
        _firstClaimByType = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (Claim claim in claims)
        {
            if (string.IsNullOrEmpty(claim.Type) || string.IsNullOrEmpty(claim.Value))
                continue;

            if (!_firstClaimByType.ContainsKey(claim.Type))
                _firstClaimByType[claim.Type] = claim.Value;
        }
    }

    public string? FindFirstClaimValue(string claimType)
    {
        return string.IsNullOrWhiteSpace(claimType) ? null : _firstClaimByType.GetValueOrDefault(claimType);
    }
}
