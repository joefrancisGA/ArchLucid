using ArchLucid.Application.Identity;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class TrialBootstrapEmailVerificationPolicyTests
{
    [Fact]
    public async Task CanProvision_returns_false_for_whitespace_email()
    {
        TrialBootstrapEmailVerificationPolicy sut = CreateSut(localIdentityEnabled: true, identityRow: null);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("   ", CancellationToken.None);

        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task CanProvision_returns_true_when_local_identity_disabled()
    {
        TrialBootstrapEmailVerificationPolicy sut = CreateSut(localIdentityEnabled: false, identityRow: new TrialIdentityUserRecord
        {
            Id = Guid.NewGuid(),
            NormalizedEmail = "user@example.com",
            Email = "user@example.com",
            EmailVerifiedUtc = null,
        });

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("user@example.com", CancellationToken.None);

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task CanProvision_returns_true_when_no_identity_row_exists()
    {
        TrialBootstrapEmailVerificationPolicy sut = CreateSut(localIdentityEnabled: true, identityRow: null);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("new@example.com", CancellationToken.None);

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task CanProvision_returns_false_when_identity_row_is_unverified()
    {
        TrialBootstrapEmailVerificationPolicy sut = CreateSut(localIdentityEnabled: true, identityRow: new TrialIdentityUserRecord
        {
            Id = Guid.NewGuid(),
            NormalizedEmail = "pending@example.com",
            Email = "pending@example.com",
            EmailVerifiedUtc = null,
        });

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("pending@example.com", CancellationToken.None);

        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task CanProvision_returns_true_when_identity_row_is_verified()
    {
        TrialBootstrapEmailVerificationPolicy sut = CreateSut(localIdentityEnabled: true, identityRow: new TrialIdentityUserRecord
        {
            Id = Guid.NewGuid(),
            NormalizedEmail = "verified@example.com",
            Email = "verified@example.com",
            EmailVerifiedUtc = DateTimeOffset.UtcNow,
        });

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("verified@example.com", CancellationToken.None);

        allowed.Should().BeTrue();
    }

    private static TrialBootstrapEmailVerificationPolicy CreateSut(
        bool localIdentityEnabled,
        TrialIdentityUserRecord? identityRow)
    {
        List<string> modes = localIdentityEnabled
            ? [TrialAuthModeConstants.LocalIdentity]
            : [TrialAuthModeConstants.MsaExternalId];

        Mock<IOptions<TrialAuthOptions>> options = new();
        options.Setup(o => o.Value).Returns(new TrialAuthOptions { Modes = modes });

        Mock<ITrialIdentityUserRepository> identityUsers = new();
        identityUsers
            .Setup(r => r.GetByNormalizedEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(identityRow);

        return new TrialBootstrapEmailVerificationPolicy(options.Object, identityUsers.Object);
    }
}
