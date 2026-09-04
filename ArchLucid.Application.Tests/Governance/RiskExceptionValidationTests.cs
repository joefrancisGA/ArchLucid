using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
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
    public void Validate_rejects_owner_user_id_over_max_length()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = new string('o', RiskExceptionValidation.OwnerUserIdMaxLength + 1),
            Rationale = "Temporary acceptance for pilot.",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = RiskExceptionValidation.DefaultExpiresAtUtc(now),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should().Throw<ArgumentException>().WithMessage($"*at most {RiskExceptionValidation.OwnerUserIdMaxLength}*");
    }

    [Fact]
    public void Validate_rejects_evidence_ref_over_max_length()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner-1",
            Rationale = "Temporary acceptance for pilot.",
            EvidenceRef = new string('e', RiskExceptionValidation.EvidenceRefMaxLength + 1),
            ExpiresAtUtc = RiskExceptionValidation.DefaultExpiresAtUtc(now),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should().Throw<ArgumentException>().WithMessage($"*at most {RiskExceptionValidation.EvidenceRefMaxLength}*");
    }

    [Fact]
    public void Validate_rejects_rationale_shorter_than_minimum_length()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner-1",
            Rationale = "too short",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = RiskExceptionValidation.DefaultExpiresAtUtc(now),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should()
            .Throw<ArgumentException>()
            .WithParameterName("request")
            .WithMessage("*at least 10*");
    }

    [Fact]
    public void ValidateRenew_rejects_past_expiration()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RenewRiskExceptionRequest request = new() { ExpiresAtUtc = now.AddDays(-1) };

        Action act = () => RiskExceptionValidation.ValidateRenew(request, now);

        act.Should().Throw<ArgumentException>().WithMessage("*future*");
    }

    [Fact]
    public void ValidateRenew_rejects_evidence_ref_over_max_length()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = now.AddDays(30),
            EvidenceRef = new string('e', RiskExceptionValidation.EvidenceRefMaxLength + 1),
        };

        Action act = () => RiskExceptionValidation.ValidateRenew(request, now);

        act.Should().Throw<ArgumentException>().WithMessage($"*at most {RiskExceptionValidation.EvidenceRefMaxLength}*");
    }

    [Fact]
    public void ValidateRenew_rejects_rationale_shorter_than_minimum_length()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = now.AddDays(30),
            Rationale = new string('r', FindingDispositionValidation.MinimumRationaleLength - 1),
        };

        Action act = () => RiskExceptionValidation.ValidateRenew(request, now);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*at least {FindingDispositionValidation.MinimumRationaleLength}*");
    }

    [Fact]
    public void Validate_rejects_rationale_over_maximum_length()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner-1",
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = RiskExceptionValidation.DefaultExpiresAtUtc(now),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    [Fact]
    public void ValidateRenew_rejects_rationale_over_maximum_length()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = now.AddDays(30),
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
        };

        Action act = () => RiskExceptionValidation.ValidateRenew(request, now);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    [Fact]
    public void Validate_rejects_overlong_finding_id()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        CreateRiskExceptionRequest request = new()
        {
            FindingId = new string('f', FindingDispositionValidation.MaxFindingIdLength + 1),
            OwnerUserId = "owner-1",
            Rationale = "Temporary acceptance for pilot.",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = RiskExceptionValidation.DefaultExpiresAtUtc(now),
        };

        Action act = () => RiskExceptionValidation.Validate(request, now);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaxFindingIdLength}*");
    }
}
