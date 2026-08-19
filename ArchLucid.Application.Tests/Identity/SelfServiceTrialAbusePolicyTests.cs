using ArchLucid.Application.Identity;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class SelfServiceTrialAbusePolicyTests
{
    [Fact]
    public async Task EvaluateAsync_denies_repeat_email_when_enabled()
    {
        InMemorySelfServiceTrialAbuseRepository repository = new();

        await repository.TryInsertEmailClaimAsync(
            new SelfServiceTrialEmailClaimInsert
            {
                NormalizedEmail = "repeat@example.com",
                ClaimSource = "test",
                ClaimedUtc = DateTimeOffset.UtcNow
            },
            CancellationToken.None);

        SelfServiceTrialAbusePolicy sut = CreateSut(repository, PublicSignupMode.PublicSelfService);

        SelfServiceTrialAbuseEvaluation result = await sut.EvaluateAsync(
            new SelfServiceTrialAbuseEvaluationRequest { NormalizedEmail = "repeat@example.com" },
            CancellationToken.None);

        Assert.False(result.Allowed);
        Assert.Equal("email_lifetime_cap", result.DenyReasonCode);
    }

    [Fact]
    public async Task EvaluateAsync_denies_when_invite_only_mode()
    {
        SelfServiceTrialAbusePolicy sut = CreateSut(new InMemorySelfServiceTrialAbuseRepository(), PublicSignupMode.InviteOnly);

        SelfServiceTrialAbuseEvaluation result = await sut.EvaluateAsync(
            new SelfServiceTrialAbuseEvaluationRequest { NormalizedEmail = "new@example.com" },
            CancellationToken.None);

        Assert.False(result.Allowed);
        Assert.Equal("invite_only", result.DenyReasonCode);
    }

    [Fact]
    public async Task EvaluateAsync_allows_when_abuse_guard_disabled()
    {
        InMemorySelfServiceTrialAbuseRepository repository = new();

        await repository.TryInsertEmailClaimAsync(
            new SelfServiceTrialEmailClaimInsert
            {
                NormalizedEmail = "repeat@example.com",
                ClaimSource = "test",
                ClaimedUtc = DateTimeOffset.UtcNow
            },
            CancellationToken.None);

        SelfServiceTrialAbusePolicy sut = new(
            Options.Create(new SelfServiceAbuseOptions { Enabled = false }),
            Options.Create(new PublicSignupOptions { Mode = PublicSignupMode.PublicSelfService }),
            repository,
            new InMemoryUserInvitationRepository(),
            TimeProvider.System);

        SelfServiceTrialAbuseEvaluation result = await sut.EvaluateAsync(
            new SelfServiceTrialAbuseEvaluationRequest { NormalizedEmail = "repeat@example.com" },
            CancellationToken.None);

        Assert.True(result.Allowed);
    }

    [Fact]
    public async Task EvaluateAsync_denies_domain_velocity_cap()
    {
        InMemorySelfServiceTrialAbuseRepository repository = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        for (int index = 0; index < 2; index++)
        {
            await repository.InsertDomainClaimAsync("example.com", clock.GetUtcNow(), CancellationToken.None);
        }

        SelfServiceTrialAbusePolicy sut = new(
            Options.Create(new SelfServiceAbuseOptions
            {
                Enabled = true,
                DomainVelocityWindowHours = 24,
                MaxTrialsPerDomainPerWindow = 2,
            }),
            Options.Create(new PublicSignupOptions { Mode = PublicSignupMode.PublicSelfService }),
            repository,
            new InMemoryUserInvitationRepository(),
            clock);

        SelfServiceTrialAbuseEvaluation result = await sut.EvaluateAsync(
            new SelfServiceTrialAbuseEvaluationRequest { NormalizedEmail = "new@example.com" },
            CancellationToken.None);

        Assert.False(result.Allowed);
        Assert.Equal("domain_velocity", result.DenyReasonCode);
    }

    [Fact]
    public async Task RecordSuccessfulClaimAsync_inserts_email_and_domain_rows()
    {
        InMemorySelfServiceTrialAbuseRepository repository = new();
        SelfServiceTrialAbusePolicy sut = CreateSut(repository, PublicSignupMode.PublicSelfService);

        await sut.RecordSuccessfulClaimAsync(
            "User@Example.COM",
            platformUserId: Guid.NewGuid(),
            tenantId: Guid.NewGuid(),
            claimSource: "trial",
            CancellationToken.None);

        // IdentityEmailNormalizer keys are lower-invariant; repository lookups are Ordinal.
        (await repository.HasEmailClaimAsync("user@example.com", CancellationToken.None)).Should().BeTrue();
        (await repository.CountDomainClaimsSinceAsync("example.com", DateTimeOffset.UtcNow.AddDays(-1), CancellationToken.None))
            .Should()
            .Be(1);
    }

    private static SelfServiceTrialAbusePolicy CreateSut(
        ISelfServiceTrialAbuseRepository repository,
        PublicSignupMode mode) =>
        new(
            Options.Create(new SelfServiceAbuseOptions { Enabled = true }),
            Options.Create(new PublicSignupOptions { Mode = mode }),
            repository,
            new InMemoryUserInvitationRepository(),
            TimeProvider.System);
}
