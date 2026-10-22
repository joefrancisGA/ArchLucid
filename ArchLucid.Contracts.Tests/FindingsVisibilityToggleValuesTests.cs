using ArchLucid.Contracts.User;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class FindingsVisibilityToggleValuesTests
{
    [Fact]
    public void Serialize_False_ReturnsFalseString()
    {
        FindingsVisibilityToggleValues.Serialize(false).Should().Be("false");
    }

    [Fact]
    public void ParseOrDefault_ReturnsFalseWhenUnset()
    {
        FindingsVisibilityToggleValues.ParseOrDefault(null).Should().BeFalse();
    }

    [Fact]
    public void ParseOrDefault_ReturnsTrueWhenExplicit()
    {
        FindingsVisibilityToggleValues.ParseOrDefault("true").Should().BeTrue();
    }
}
