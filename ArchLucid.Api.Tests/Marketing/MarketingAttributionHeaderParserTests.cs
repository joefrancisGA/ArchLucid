using System.Text;
using System.Text.Json;

using ArchLucid.Api.Marketing;
using ArchLucid.Core.Marketing;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Marketing;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class MarketingAttributionHeaderParserTests
{
    [Fact]
    public void TryParse_returns_null_for_empty_header()
    {
        MarketingAttributionHeaderParser.TryParse(null).Should().BeNull();
        MarketingAttributionHeaderParser.TryParse("   ").Should().BeNull();
    }

    [Fact]
    public void TryParse_reads_json_payload()
    {
        string json = """{"utm_source":"google","utm_medium":"cpc","utm_campaign":"spring","utm_content":"hero"}""";

        MarketingAttributionSnapshot? snapshot = MarketingAttributionHeaderParser.TryParse(json);

        snapshot.Should().NotBeNull();
        snapshot!.UtmSource.Should().Be("google");
        snapshot.UtmMedium.Should().Be("cpc");
        snapshot.UtmCampaign.Should().Be("spring");
        snapshot.UtmContent.Should().Be("hero");
    }

    [Fact]
    public void TryParse_reads_base64_json_payload()
    {
        string json = """{"utm_source":"linkedin","utm_medium":"social"}""";
        string encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));

        MarketingAttributionSnapshot? snapshot = MarketingAttributionHeaderParser.TryParse(encoded);

        snapshot.Should().NotBeNull();
        snapshot!.UtmSource.Should().Be("linkedin");
        snapshot.UtmMedium.Should().Be("social");
    }

    [Fact]
    public void TryParse_strips_control_characters_and_truncates_long_fields()
    {
        string longCampaign = new('x', 200);
        string json = JsonSerializer.Serialize(new { utm_source = "google", utm_campaign = longCampaign + "\u0007" });

        MarketingAttributionSnapshot? snapshot = MarketingAttributionHeaderParser.TryParse(json);

        snapshot.Should().NotBeNull();
        snapshot!.UtmCampaign.Should().HaveLength(120);
        snapshot.UtmCampaign.Should().NotContain("\u0007");
    }
}
