using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

internal static class TenantAuthDomainAdminSupport
{
    internal static async Task<TenantSignInEmailDomainRecord> RequireDomainAsync(
        ITenantSignInEmailDomainRepository domains,
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        TenantSignInEmailDomainRecord? record =
            await domains.TryGetAsync(tenantId, normalizedDomain, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Domain was not found for this tenant.");

        return record;
    }

    internal static string? ExtractDomain(string normalizedEmail)
    {
        int at = normalizedEmail.LastIndexOf('@');

        if (at < 0 || at >= normalizedEmail.Length - 1)
        {
            return null;
        }

        return normalizedEmail[(at + 1)..];
    }
}
