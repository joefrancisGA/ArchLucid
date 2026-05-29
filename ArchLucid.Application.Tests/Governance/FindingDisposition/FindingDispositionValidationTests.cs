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
}
