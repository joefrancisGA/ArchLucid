using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RiskExceptionValidationTests
{
    [Fact]
    public void Validate_rejects_waiver_longer_than_365_days()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner-1",
            Rationale = "Temporary acceptance for pilot.",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = now.AddDays(366),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should().Throw<ArgumentException>().WithMessage("*365*");
    }

    [Fact]
    public void Validate_accepts_default_90_day_expiry()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner-1",
            Rationale = "Temporary acceptance for pilot.",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = RiskExceptionValidation.DefaultExpiresAtUtc(now),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_rejects_missing_evidence_reference()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner-1",
            Rationale = "Temporary acceptance for pilot.",
            ExpiresAtUtc = RiskExceptionValidation.DefaultExpiresAtUtc(now),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should().Throw<ArgumentException>().WithMessage("*Evidence*");
    }

    [Fact]
    public void ValidateRenew_rejects_past_expiration()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RenewRiskExceptionRequest request = new() { ExpiresAtUtc = now.AddDays(-1) };

        Action act = () => RiskExceptionValidation.ValidateRenew(request, now);

        act.Should().Throw<ArgumentException>().WithMessage("*future*");
    }
}
