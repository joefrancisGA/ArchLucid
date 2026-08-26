using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftIntakeValidationTests
{
    private static readonly Lazy<string> OverLimitText = new(
        () => new string('x', DraftIntakeValidation.MaximumFreeTextIntentLength + 1));

    [Fact]
    public void ExceedsMaximumFreeTextIntentLength_is_false_below_limit_and_true_one_over()
    {
        DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(new string('a', 100)).Should().BeFalse();
        DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(OverLimitText.Value).Should().BeTrue();
    }

    [Fact]
    public void ExceedsMaximumFreeTextIntentLength_is_false_for_blank_text()
    {
        DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength("   ").Should().BeFalse();
    }
}
