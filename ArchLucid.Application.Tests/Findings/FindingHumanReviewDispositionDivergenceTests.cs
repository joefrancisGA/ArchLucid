using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingHumanReviewDispositionDivergenceTests
{
    private const string PointerToken = "pointer-token";

    [Fact]
    public void IsDiverged_when_approved_and_disposition_deferred_returns_true()
    {
        bool result = FindingHumanReviewDispositionDivergence.IsDiverged(
            FindingHumanReviewStatus.Approved,
            FindingDisposition.Deferred,
            hasCurrentDispositionPointer: true);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsDiverged_when_approved_and_disposition_remediated_returns_false()
    {
        bool result = FindingHumanReviewDispositionDivergence.IsDiverged(
            FindingHumanReviewStatus.Approved,
            FindingDisposition.Remediated,
            hasCurrentDispositionPointer: true);

        result.Should().BeFalse();
    }

    [Fact]
    public void IsDiverged_without_pointer_returns_false()
    {
        bool result = FindingHumanReviewDispositionDivergence.IsDiverged(
            FindingHumanReviewStatus.Approved,
            FindingDisposition.Deferred,
            hasCurrentDispositionPointer: false);

        result.Should().BeFalse();
    }

    [Fact]
    public void FormatHumanReviewStatusForExport_appends_suffix_when_diverged()
    {
        string formatted = FindingHumanReviewDispositionDivergence.FormatHumanReviewStatusForExport(
            FindingHumanReviewStatus.Approved,
            FindingDisposition.Deferred);

        formatted.Should().Be("Approved (diverged from disposition trail)");
    }
}
