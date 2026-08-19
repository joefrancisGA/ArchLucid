using ArchLucid.Application.Identity;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TrialIdentityCoverageTests
{
    [Fact]
    public void TrialEmailNormalizer_trims_and_uppercases()
    {
        TrialEmailNormalizer.Normalize("  User@Example.com ").Should().Be("USER@EXAMPLE.COM");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TrialEmailNormalizer_rejects_missing_email(string? email)
    {
        Action act = () => TrialEmailNormalizer.Normalize(email!);

        act.Should().Throw<Exception>();
    }

    [Fact]
    public void TrialEmailVerificationTokenHasher_returns_stable_hex_digest()
    {
        string hash = TrialEmailVerificationTokenHasher.Hash("raw-token");

        hash.Should().HaveLength(64);
        TrialEmailVerificationTokenHasher.Hash("raw-token").Should().Be(hash);
    }

    [Fact]
    public void TrialEmailVerificationTokenHasher_rejects_blank_token()
    {
        Action act = () => TrialEmailVerificationTokenHasher.Hash("  ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public async Task TrialBootstrapEmailVerificationPolicy_allows_when_local_identity_disabled()
    {
        Mock<ITrialIdentityUserRepository> users = new();
        TrialBootstrapEmailVerificationPolicy sut = CreatePolicy(
            mode: TrialAuthModeConstants.MsaExternalId,
            users.Object);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("user@example.com", CancellationToken.None);

        allowed.Should().BeTrue();
        users.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TrialBootstrapEmailVerificationPolicy_allows_when_no_identity_row()
    {
        Mock<ITrialIdentityUserRepository> users = new();
        users.Setup(u => u.GetByNormalizedEmailAsync("USER@EXAMPLE.COM", It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrialIdentityUserRecord?)null);
        TrialBootstrapEmailVerificationPolicy sut = CreatePolicy(
            mode: TrialAuthModeConstants.LocalIdentity,
            users.Object);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("user@example.com", CancellationToken.None);

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task TrialBootstrapEmailVerificationPolicy_blocks_unverified_local_identity_row()
    {
        Mock<ITrialIdentityUserRepository> users = new();
        users.Setup(u => u.GetByNormalizedEmailAsync("USER@EXAMPLE.COM", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TrialIdentityUserRecord { NormalizedEmail = "USER@EXAMPLE.COM", EmailVerifiedUtc = null });
        TrialBootstrapEmailVerificationPolicy sut = CreatePolicy(
            mode: TrialAuthModeConstants.LocalIdentity,
            users.Object);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("user@example.com", CancellationToken.None);

        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task TrialBootstrapEmailVerificationPolicy_allows_verified_local_identity_row()
    {
        Mock<ITrialIdentityUserRepository> users = new();
        users.Setup(u => u.GetByNormalizedEmailAsync("USER@EXAMPLE.COM", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TrialIdentityUserRecord
            {
                NormalizedEmail = "USER@EXAMPLE.COM",
                EmailVerifiedUtc = DateTimeOffset.UtcNow,
            });
        TrialBootstrapEmailVerificationPolicy sut = CreatePolicy(
            mode: TrialAuthModeConstants.LocalIdentity,
            users.Object);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("user@example.com", CancellationToken.None);

        allowed.Should().BeTrue();
    }

    private static TrialBootstrapEmailVerificationPolicy CreatePolicy(string mode, ITrialIdentityUserRepository users)
    {
        TrialAuthOptions options = new() { Modes = [mode] };
        IOptions<TrialAuthOptions> optionsWrapper = Options.Create(options);

        return new TrialBootstrapEmailVerificationPolicy(optionsWrapper, users);
    }
}
