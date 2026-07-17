using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class AuthDomainDnsVerificationService(
    IDnsTxtRecordLookup dnsTxtRecordLookup,
    TimeProvider timeProvider)
{
    private readonly IDnsTxtRecordLookup _dnsTxtRecordLookup =
        dnsTxtRecordLookup ?? throw new ArgumentNullException(nameof(dnsTxtRecordLookup));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public Task<TenantSignInEmailDomainRecord> BeginVerificationAsync(
        TenantSignInEmailDomainRecord record,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (record.VerificationStatus is AuthDomainVerificationStatus.Verified
            or AuthDomainVerificationStatus.Removed)
        {
            throw new InvalidOperationException("Verified or removed domains cannot start verification again.");
        }

        string token = record.DnsVerificationToken ?? Guid.NewGuid().ToString("N");
        DateTimeOffset now = _timeProvider.GetUtcNow();

        return Task.FromResult(record with
        {
            DnsVerificationToken = token,
            VerificationStatus = AuthDomainVerificationStatus.VerificationPending,
            VerificationPendingUtc = now,
            VerificationFailedUtc = null,
            UpdatedUtc = now
        });
    }

    public async Task<TenantSignInEmailDomainRecord> CheckVerificationAsync(
        TenantSignInEmailDomainRecord record,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (string.IsNullOrWhiteSpace(record.DnsVerificationToken))
        {
            throw new InvalidOperationException("Domain verification token is missing.");
        }

        string expected = AuthEmailDomainNormalizer.BuildDnsVerificationRecordValue(record.DnsVerificationToken);
        IReadOnlyList<string> txtRecords =
            await _dnsTxtRecordLookup.GetTxtRecordsAsync(record.NormalizedDomain, cancellationToken)
                .ConfigureAwait(false);

        DateTimeOffset now = _timeProvider.GetUtcNow();
        bool verified = txtRecords.Any(
            value => string.Equals(value, expected, StringComparison.OrdinalIgnoreCase));

        if (verified)
        {
            return record with
            {
                VerificationStatus = AuthDomainVerificationStatus.Verified,
                VerifiedUtc = now,
                VerificationFailedUtc = null,
                UpdatedUtc = now
            };
        }

        return record with
        {
            VerificationStatus = AuthDomainVerificationStatus.VerificationFailed,
            VerificationFailedUtc = now,
            UpdatedUtc = now
        };
    }
}
