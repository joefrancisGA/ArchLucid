using ArchLucid.Contracts.Drafts;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class ArchitectureDraftStructuredBriefTests
{
    [Fact]
    public void QualityAttributeMeetsMinimum_accepts_qualitative_chip()
    {
        ArchitectureDraftStructuredBrief.QualityAttributeMeetsMinimum("defense in depth")
            .Should().BeTrue();
    }

    [Fact]
    public void QualityAttributeMeetsMinimum_rejects_unknown_sentinel_only()
    {
        ArchitectureDraftStructuredBrief.QualityAttributeMeetsMinimum(
                ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview)
            .Should().BeFalse();
    }

    [Fact]
    public void IsUnknownConfirmSentinel_treats_case_variants_as_unknown()
    {
        ArchitectureDraftStructuredBrief.IsUnknownConfirmSentinel("unknown — confirm before review")
            .Should().BeTrue();
    }

    [Fact]
    public void QualityAttributeMeetsMinimum_rejects_case_variant_unknown_sentinel()
    {
        ArchitectureDraftStructuredBrief.QualityAttributeMeetsMinimum("unknown — confirm before review")
            .Should().BeFalse();
    }
}
