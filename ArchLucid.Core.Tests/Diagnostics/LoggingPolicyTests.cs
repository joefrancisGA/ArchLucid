using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LoggingPolicyTests
{
    [Fact]
    public void NeverLogCategories_is_non_empty_and_unique()
    {
        LoggingPolicy.NeverLogCategories.Should().NotBeEmpty();
        LoggingPolicy.NeverLogCategories.Should().OnlyHaveUniqueItems();
    }
}
