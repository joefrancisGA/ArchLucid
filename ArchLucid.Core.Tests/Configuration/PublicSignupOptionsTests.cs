using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PublicSignupOptionsTests
{
    [Theory]
    [InlineData(0, true, false)]
    [InlineData(1, false, true)]
    [InlineData(-1, true, false)]
    [InlineData(2, true, false)]
    [InlineData(int.MaxValue, true, false)]
    public void Only_explicit_public_self_service_mode_opens_signup(
        int rawMode, bool inviteOnly, bool publicSelfService)
    {
        PublicSignupOptions options = new() { Mode = (PublicSignupMode)rawMode };

        options.IsInviteOnly().Should().Be(inviteOnly);
        options.IsPublicSelfServiceEnabled().Should().Be(publicSelfService);
    }
}
