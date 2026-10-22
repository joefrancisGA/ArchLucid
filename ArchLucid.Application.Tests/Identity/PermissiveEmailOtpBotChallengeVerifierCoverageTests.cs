using ArchLucid.Application.Identity;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PermissiveEmailOtpBotChallengeVerifierCoverageTests
{
    [Fact]
    public async Task VerifyAsync_passes_when_bot_challenge_disabled()
    {
        PermissiveEmailOtpBotChallengeVerifier sut = new(
            Options.Create(new EmailOtpAuthOptions { RequireBotChallenge = false }));

        bool ok = await sut.VerifyAsync(botChallengeToken: null, CancellationToken.None);

        ok.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task VerifyAsync_requires_token_when_bot_challenge_enabled(string? token)
    {
        PermissiveEmailOtpBotChallengeVerifier sut = new(
            Options.Create(new EmailOtpAuthOptions { RequireBotChallenge = true }));

        bool ok = await sut.VerifyAsync(token, CancellationToken.None);

        ok.Should().BeFalse();
    }

    [Fact]
    public async Task VerifyAsync_accepts_non_blank_token_when_enabled()
    {
        PermissiveEmailOtpBotChallengeVerifier sut = new(
            Options.Create(new EmailOtpAuthOptions { RequireBotChallenge = true }));

        bool ok = await sut.VerifyAsync("turnstile-token", CancellationToken.None);

        ok.Should().BeTrue();
    }
}
