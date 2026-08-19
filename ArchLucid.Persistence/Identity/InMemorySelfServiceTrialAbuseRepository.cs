using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemorySelfServiceTrialAbuseRepository : ISelfServiceTrialAbuseRepository
{
    private readonly ConcurrentDictionary<string, SelfServiceTrialEmailClaimInsert> _emailClaims = new(StringComparer.Ordinal);

    private readonly ConcurrentBag<SelfServiceTrialDomainClaimRecord> _domainClaims = [];

    public Task<bool> HasEmailClaimAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult(_emailClaims.ContainsKey(normalizedEmail));
    }

    public Task TryInsertEmailClaimAsync(SelfServiceTrialEmailClaimInsert claim, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _emailClaims.TryAdd(claim.NormalizedEmail, claim);

        return Task.CompletedTask;
    }

    public Task<int> CountDomainClaimsSinceAsync(
        string normalizedDomain,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        int count = _domainClaims.Count(row =>
            string.Equals(row.NormalizedDomain, normalizedDomain, StringComparison.Ordinal)
            && row.ClaimedUtc >= sinceUtc);

        return Task.FromResult(count);
    }

    public Task InsertDomainClaimAsync(string normalizedDomain, DateTimeOffset claimedUtc, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _domainClaims.Add(
            new SelfServiceTrialDomainClaimRecord
            {
                NormalizedDomain = normalizedDomain,
                ClaimedUtc = claimedUtc
            });

        return Task.CompletedTask;
    }
}
