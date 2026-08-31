namespace ArchLucid.Core.Identity;

public interface ISelfServiceTrialAbuseRepository
{
    Task<bool> HasEmailClaimAsync(string normalizedEmail, CancellationToken cancellationToken);

    Task<bool> HasEmailClaimForTenantAsync(
        string normalizedEmail,
        Guid tenantId,
        CancellationToken cancellationToken);

    Task TryInsertEmailClaimAsync(SelfServiceTrialEmailClaimInsert claim, CancellationToken cancellationToken);

    Task<int> CountDomainClaimsSinceAsync(
        string normalizedDomain,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken);

    Task InsertDomainClaimAsync(string normalizedDomain, DateTimeOffset claimedUtc, CancellationToken cancellationToken);
}
