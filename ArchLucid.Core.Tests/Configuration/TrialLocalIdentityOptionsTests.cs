using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class TrialLocalIdentityOptionsTests
{
    [Fact]
    public void SectionPath_extends_trial_root()
    {
        TrialLocalIdentityOptions.SectionPath.Should().Be("Auth:Trial:LocalIdentity");
    }

    [Fact]
    public void Defaults_match_password_and_token_safety_baseline()
    {
        TrialLocalIdentityOptions o = new();

        o.JwtPrivateKeyPemPath.Should().BeEmpty();
        o.JwtIssuer.Should().BeEmpty();
        o.JwtAudience.Should().BeEmpty();
        o.AccessTokenLifetimeMinutes.Should().Be(60);
        o.MaxFailedAccessAttemptsBeforeLockout.Should().Be(5);
        o.LockoutMinutes.Should().Be(15);
        o.PwnedPasswordRangeCheckEnabled.Should().BeFalse();
        o.MinimumPasswordLength.Should().Be(8);
        o.MaximumPasswordLength.Should().Be(128);
    }

    [Fact]
    public void Properties_round_trip_for_configuration_binding()
    {
        TrialLocalIdentityOptions o = new()
        {
            JwtPrivateKeyPemPath = "/secrets/jwt.pem",
            JwtIssuer = "https://trial.local",
            JwtAudience = "archlucid-api",
            AccessTokenLifetimeMinutes = 45,
            MaxFailedAccessAttemptsBeforeLockout = 7,
            LockoutMinutes = 20,
            PwnedPasswordRangeCheckEnabled = true,
            MinimumPasswordLength = 12,
            MaximumPasswordLength = 200,
        };

        o.JwtPrivateKeyPemPath.Should().Be("/secrets/jwt.pem");
        o.JwtIssuer.Should().Be("https://trial.local");
        o.JwtAudience.Should().Be("archlucid-api");
        o.AccessTokenLifetimeMinutes.Should().Be(45);
        o.MaxFailedAccessAttemptsBeforeLockout.Should().Be(7);
        o.LockoutMinutes.Should().Be(20);
        o.PwnedPasswordRangeCheckEnabled.Should().BeTrue();
        o.MinimumPasswordLength.Should().Be(12);
        o.MaximumPasswordLength.Should().Be(200);
    }
}
