using Amazon;
using Amazon.SecurityToken;

namespace ArchLucid.Integrations.AwsExtractor;

internal static class AwsWebIdentityStsClientFactory
{
    public static AmazonSecurityTokenServiceClient Create(RegionEndpoint connectionRegion)
    {
        ArgumentNullException.ThrowIfNull(connectionRegion);

        return new AmazonSecurityTokenServiceClient(connectionRegion);
    }
}
