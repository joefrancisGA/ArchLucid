using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class InMemorySelfServiceTrialAbuseRepositoryCoverageTests
{
    [Fact]
    public async Task Email_claim_is_idempotent_and_domain_counts_respect_window()
    {
        InMemorySelfServiceTrialAbuseRepository sut = new();
        DateTimeOffset now = DateTimeOffset.UtcNow;

        await sut.TryInsertEmailClaimAsync(
            new SelfServiceTrialEmailClaimInsert
            {
                NormalizedEmail = "USER@EXAMPLE.COM",
                ClaimSource = "trial",
                ClaimedUtc = now,
            },
            CancellationToken.None);

        (await sut.HasEmailClaimAsync("USER@EXAMPLE.COM", CancellationToken.None)).Should().BeTrue();

        await sut.TryInsertEmailClaimAsync(
            new SelfServiceTrialEmailClaimInsert
            {
                NormalizedEmail = "user@example.com",
                ClaimSource = "trial-repeat",
                ClaimedUtc = now,
            },
            CancellationToken.None);

        await sut.InsertDomainClaimAsync("example.com", now, CancellationToken.None);
        await sut.InsertDomainClaimAsync("example.com", now.AddMinutes(-1), CancellationToken.None);

        int count = await sut.CountDomainClaimsSinceAsync("example.com", now.AddHours(-1), CancellationToken.None);

        count.Should().Be(2);
    }

    [Fact]
    public async Task Domain_count_excludes_claims_before_since_boundary()
    {
        InMemorySelfServiceTrialAbuseRepository sut = new();
        DateTimeOffset now = DateTimeOffset.UtcNow;

        await sut.InsertDomainClaimAsync("example.org", now.AddHours(-5), CancellationToken.None);

        int count = await sut.CountDomainClaimsSinceAsync("example.org", now.AddHours(-1), CancellationToken.None);

        count.Should().Be(0);
    }
}
