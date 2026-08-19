using ArchLucid.Application.Bootstrap;

namespace ArchLucid.Application.Tests.Bootstrap;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class Utf8MojibakeRepairTests
{
    [Fact]
    public void RepairOptional_returns_null_for_null_input()
    {
        Assert.Null(Utf8MojibakeRepair.RepairOptional(null));
    }

    [Fact]
    public void RepairOptional_repairs_em_dash_mojibake()
    {
        const string mojibake = "Demo â€\u201D Retail baseline manifest (trusted baseline seed).";

        Assert.Equal(
            "Demo — Retail baseline manifest (trusted baseline seed).",
            Utf8MojibakeRepair.RepairOptional(mojibake));
    }

    [Fact]
    public void RepairOptional_repairs_en_dash_mojibake()
    {
        const string mojibake = "Primary region footprint lands near $45â€\u201C60k/month.";

        Assert.Equal(
            "Primary region footprint lands near $45–60k/month.",
            Utf8MojibakeRepair.RepairOptional(mojibake));
    }

    [Fact]
    public void RepairOptional_repairs_arrow_mojibake()
    {
        const string mojibake = "storefront â†\u2019 BFF â†\u2019 catalog";

        Assert.Equal("storefront → BFF → catalog", Utf8MojibakeRepair.RepairOptional(mojibake));
    }

    [Fact]
    public void RepairOptional_returns_original_when_no_mojibake_present()
    {
        const string value = "Demo — Retail baseline manifest (trusted baseline seed).";

        Assert.Equal(value, Utf8MojibakeRepair.RepairOptional(value));
    }
}
