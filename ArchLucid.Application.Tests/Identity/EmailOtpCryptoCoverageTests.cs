using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EmailOtpCryptoCoverageTests
{
    [Fact]
    public void EmailOtpCodeGenerator_emits_zero_padded_numeric_code()
    {
        string code = EmailOtpCodeGenerator.GenerateNumericCode(length: 6);

        code.Should().HaveLength(6);
        code.Should().MatchRegex("^[0-9]{6}$");
    }

    [Theory]
    [InlineData(3)]
    [InlineData(11)]
    public void EmailOtpCodeGenerator_rejects_out_of_range_lengths(int length)
    {
        Action act = () => EmailOtpCodeGenerator.GenerateNumericCode(length);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void EmailOtpCodeHasher_applies_pepper_and_compares_in_fixed_time()
    {
        Guid challengeId = Guid.NewGuid();
        string hash = EmailOtpCodeHasher.Hash(challengeId, "123456", pepper: "pepper");

        hash.Should().HaveLength(64);
        EmailOtpCodeHasher.FixedTimeEqualsHex(hash, hash).Should().BeTrue();
        EmailOtpCodeHasher.FixedTimeEqualsHex(hash, EmailOtpCodeHasher.Hash(challengeId, "654321", pepper: "pepper"))
            .Should()
            .BeFalse();
    }

    [Fact]
    public void EmailOtpRequestMetadataHasher_returns_null_for_blank_input()
    {
        EmailOtpRequestMetadataHasher.HashOptional(null).Should().BeNull();
        EmailOtpRequestMetadataHasher.HashOptional("   ").Should().BeNull();
    }

    [Fact]
    public void EmailOtpCorrelationFingerprint_is_stable_for_normalized_email()
    {
        string first = EmailOtpCorrelationFingerprint.ComputeHexPrefix("User@Example.com");
        string second = EmailOtpCorrelationFingerprint.ComputeHexPrefix("user@example.com");

        first.Should().Be(second);
        first.Should().HaveLength(12);
    }

    [Fact]
    public void EmailOtpInvitationTokenHasher_returns_sha256_bytes()
    {
        byte[] hash = EmailOtpInvitationTokenHasher.Hash("invite-token");

        hash.Should().HaveCount(32);
        EmailOtpInvitationTokenHasher.Hash("invite-token").Should().Equal(hash);
    }
}
