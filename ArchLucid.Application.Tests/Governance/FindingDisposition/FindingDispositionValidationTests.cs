using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Contracts.Governance;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition;

[Trait("Category", "Unit")]
public sealed class FindingDispositionValidationTests
{
    [Fact]
    public void Validate_deferred_disposition_rejects_past_revisit_due_date()
    {
        DateTimeOffset nowUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Deferred,
            RevisitDueUtc = nowUtc.AddDays(-1),
        };

        Action act = () => FindingDispositionValidation.Validate(request, nowUtc);

        act.Should().Throw<ArgumentException>().WithMessage("*future*");
    }

    [Fact]
    public void Validate_deferred_disposition_rejects_revisit_due_date_at_now()
    {
        DateTimeOffset nowUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Deferred,
            RevisitDueUtc = nowUtc,
        };

        Action act = () => FindingDispositionValidation.Validate(request, nowUtc);

        act.Should().Throw<ArgumentException>().WithMessage("*future*");
    }

    [Fact]
    public void Validate_deferred_without_rationale_passes_when_revisit_set()
    {
        DateTimeOffset nowUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Deferred,
            RevisitDueUtc = nowUtc.AddDays(30),
        };

        Action act = () => FindingDispositionValidation.Validate(request, nowUtc);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_deferred_disposition_requires_revisit()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Deferred,
            Rationale = "defer until next quarter",
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*Revisit*");
    }

    [Fact]
    public void Validate_needs_evidence_requires_request_text()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.NeedsEvidence,
            Rationale = "need docs",
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*Evidence*");
    }

    [Fact]
    public void Validate_rejected_as_not_applicable_rejects_short_rationale()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.RejectedAsNotApplicable,
            Rationale = "too short",
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*10 characters*");
    }

    [Fact]
    public void Validate_needs_evidence_accepts_single_character_evidence_request_text()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.NeedsEvidence,
            EvidenceRequestText = "x",
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_accepted_requires_minimum_rationale_and_trade_off()
    {
        RecordFindingDispositionRequest shortRationale = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Accepted,
            Rationale = "too short",
            TradeOffAcknowledgment = "accepting latency trade-off for lower cost",
        };

        Action shortAct = () => FindingDispositionValidation.Validate(shortRationale);

        shortAct.Should().Throw<ArgumentException>().WithMessage("*10 characters*");

        RecordFindingDispositionRequest missingTradeOff = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Accepted,
            Rationale = "We accept residual risk because rollback is documented.",
        };

        Action tradeOffAct = () => FindingDispositionValidation.Validate(missingTradeOff);

        tradeOffAct.Should().Throw<ArgumentException>().WithMessage("*Trade-off*");
    }

    [Fact]
    public void Validate_rejected_as_not_applicable_rejects_overlong_rationale()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.RejectedAsNotApplicable,
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    [Fact]
    public void Validate_accepted_rejects_overlong_trade_off_acknowledgment()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Accepted,
            Rationale = "We accept residual risk because rollback is documented.",
            TradeOffAcknowledgment = new string('t', FindingDispositionValidation.MaximumRationaleLength + 1),
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    [Fact]
    public void Validate_needs_evidence_rejects_overlong_evidence_request_text()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.NeedsEvidence,
            EvidenceRequestText = new string('e', FindingDispositionValidation.MaximumRationaleLength + 1),
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    [Fact]
    public void Validate_deferred_rejects_overlong_optional_rationale()
    {
        DateTimeOffset nowUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Deferred,
            RevisitDueUtc = nowUtc.AddDays(30),
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
        };

        Action act = () => FindingDispositionValidation.Validate(request, nowUtc);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    [Fact]
    public void Validate_rejects_overlong_finding_id()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = new string('f', FindingDispositionValidation.MaxFindingIdLength + 1),
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaxFindingIdLength}*");
    }

    [Fact]
    public void Validate_rejects_zero_width_space_only_finding_id()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "\u200B",
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*Finding id*");
    }

    [Fact]
    public void Validate_accepted_rejects_zero_width_space_only_trade_off_acknowledgment()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Accepted,
            Rationale = "We accept residual risk because rollback is documented.",
            TradeOffAcknowledgment = new string('\u200B', FindingDispositionValidation.MinimumRationaleLength),
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*Trade-off acknowledgment*");
    }

    [Fact]
    public void Validate_rejects_finding_id_with_embedded_format_character()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = $"finding-\u200B-001",
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*Finding id*");
    }

    [Fact]
    public void Validate_rejects_undefined_disposition_enum_value()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = (Disposition)999,
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*disposition*");
    }

    [Fact]
    public void Validate_rejects_negative_disposition_enum_value()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = (Disposition)(-1),
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*disposition*");
    }

    [Fact]
    public void Validate_deferred_accepts_revisit_due_at_max_value()
    {
        DateTimeOffset nowUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Deferred,
            RevisitDueUtc = DateTimeOffset.MaxValue,
        };

        Action act = () => FindingDispositionValidation.Validate(request, nowUtc);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_accepts_finding_id_at_max_length()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = new string('f', FindingDispositionValidation.MaxFindingIdLength),
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_rejects_finding_id_with_embedded_control_character()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-\u0001-001",
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().Throw<ArgumentException>().WithMessage("*Finding id*");
    }

    [Fact]
    public void Validate_rejects_overlong_architect_restatement()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Remediated,
            ArchitectRestatement = new string('a', FindingDispositionValidation.MaximumRationaleLength + 1),
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    [Fact]
    public void Validate_remediated_without_rationale_passes()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.Validate(request);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_working_remediated_rejects_short_preview_override_reason()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "f1",
            Disposition = Disposition.Remediated,
            PreviewOverrideReason = "too short",
        };

        Action act = () => FindingDispositionValidation.ValidateWorkingRemediatedImpactPreviewAttestation(request, true);

        act.Should().Throw<ArgumentException>().WithMessage("*Impact preview attestation*");
    }
}
