using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Contracts.Governance;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition;

[Trait("Category", "Unit")]
public sealed class FindingDispositionValidationTests
{
    [Fact]
    public void Validate_null_ratio_disposition_requires_revisit()
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
}
