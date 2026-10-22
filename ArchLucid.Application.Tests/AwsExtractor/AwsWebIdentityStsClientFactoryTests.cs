using Amazon;

using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsWebIdentityStsClientFactoryTests
{
    [Fact]
    public void Create_uses_connection_region_for_sts_endpoint()
    {
        using Amazon.SecurityToken.AmazonSecurityTokenServiceClient client =
            AwsWebIdentityStsClientFactory.Create(RegionEndpoint.EUWest1);

        client.Config.RegionEndpoint.Should().Be(RegionEndpoint.EUWest1);
    }
}
