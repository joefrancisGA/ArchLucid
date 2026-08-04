using ArchLucid.Application.Bootstrap;

namespace ArchLucid.Application.Tests.Bootstrap;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetiredDemoOrgBrandingTests
{
    [Fact]
    public void Strip_rewrites_contoso_retail_baseline_seed_title()
    {
        string? result = RetiredDemoOrgBranding.Strip(
            "Demo — Contoso retail baseline manifest (trusted baseline seed).");

        Assert.Equal("Demo — Retail baseline manifest (trusted baseline seed).", result);
    }

    [Fact]
    public void Strip_returns_null_for_null_input()
    {
        Assert.Null(RetiredDemoOrgBranding.Strip(null));
    }
}
