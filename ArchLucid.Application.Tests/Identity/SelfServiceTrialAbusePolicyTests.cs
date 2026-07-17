using ArchLucid.Application.Identity;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using Microsoft.Extensions.Options;

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
