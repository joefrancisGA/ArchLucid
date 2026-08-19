using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AwsEc2OfferIndexParserTests
{
    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_sample_offer_index()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }
}
