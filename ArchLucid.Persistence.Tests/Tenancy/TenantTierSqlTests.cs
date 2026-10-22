using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantTierSqlTests
{
    [Theory]
    [InlineData(TenantTier.Free, "Free")]
    [InlineData(TenantTier.Standard, "Standard")]
    [InlineData(TenantTier.Enterprise, "Enterprise")]
    public void ToTierString_round_trips_known_values(TenantTier tier, string expected)
    {
        TenantTierSql.ToTierString(tier).Should().Be(expected);
        TenantTierSql.ParseTier(expected).Should().Be(tier);
    }

    [Fact]
    public void ToTierString_throws_for_invalid_enum_value()
    {
        Action act = () => TenantTierSql.ToTierString((TenantTier)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void ParseTier_defaults_unknown_string_to_standard()
    {
        TenantTierSql.ParseTier("mystery-tier").Should().Be(TenantTier.Standard);
    }
}
