using ArchLucid.Contracts.Serialization;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Serialization;

[Trait("Category", "Unit")]
public sealed class DefinedEnumTests
{
    private enum Sample { First = 1, Second = 2, Third = 3 }

    [Theory]
    [InlineData("First", 1)]
    [InlineData("second", 2)]
    [InlineData("3", 3)]
    public void Accepts_names_and_defined_ordinals(string raw, int expected)
    {
        DefinedEnum.TryParse(raw, true, out Sample value).Should().BeTrue();
        ((int)value).Should().Be(expected);
        DefinedEnum.Parse<Sample>(raw, true).Should().Be(value);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("2147483647")]
    [InlineData("-2147483648")]
    [InlineData("unknown")]
    [InlineData("First,Second")]
    public void Rejects_undefined_or_composite_values(string raw)
    {
        DefinedEnum.TryParse(raw, true, out Sample value).Should().BeFalse();
        value.Should().Be(default(Sample));
        Action act = () => DefinedEnum.Parse<Sample>(raw, true);
        act.Should().Throw<ArgumentException>();
    }
}
