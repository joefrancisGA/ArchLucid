using ArchLucid.Application.Identity;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialEmailCorrelationFingerprintTests
{
    [Fact]
    public void ComputeHexPrefix_same_logical_email_different_casing_matches()
    {
        string first = TrialEmailCorrelationFingerprint.ComputeHexPrefix("User@Example.Com");
        string second = TrialEmailCorrelationFingerprint.ComputeHexPrefix("  user@example.com  ");

        second.Should().Be(first);
    }

    [Fact]
    public void ComputeHexPrefix_distinct_emails_differs()
    {
        string a = TrialEmailCorrelationFingerprint.ComputeHexPrefix("a@example.com");
        string b = TrialEmailCorrelationFingerprint.ComputeHexPrefix("b@example.com");

        a.Should().NotBe(b);
    }

    [Fact]
    public void ComputeHexPrefix_returns_twelve_lowercase_hex_chars()
    {
        string fingerprint = TrialEmailCorrelationFingerprint.ComputeHexPrefix("ops@contoso.com");

        fingerprint.Should().HaveLength(12);
        fingerprint.Should().MatchRegex("^[0-9a-f]{12}$");
    }

    [Fact]
    public void ComputeHexPrefix_null_throws()
    {
        Action act = () => TrialEmailCorrelationFingerprint.ComputeHexPrefix(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("email");
    }
}
