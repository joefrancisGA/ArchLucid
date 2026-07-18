using ArchLucid.Core.Identity;

namespace ArchLucid.Core.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class FixedTimeHexEqualsTests
{
    [Fact]
    public void Equals_returns_true_for_identical_hex()
    {
        const string hex = "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";

        Assert.True(FixedTimeHexEquals.Equals(hex, hex.ToLowerInvariant()));
    }

    [Fact]
    public void Equals_returns_false_for_different_hex()
    {
        const string left = "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";
        const string right = "F123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";

        Assert.False(FixedTimeHexEquals.Equals(left, right));
    }

    [Fact]
    public void Equals_returns_false_for_null_or_empty()
    {
        Assert.False(FixedTimeHexEquals.Equals(null, "AB"));
        Assert.False(FixedTimeHexEquals.Equals("AB", null));
        Assert.False(FixedTimeHexEquals.Equals("", "AB"));
    }
}
