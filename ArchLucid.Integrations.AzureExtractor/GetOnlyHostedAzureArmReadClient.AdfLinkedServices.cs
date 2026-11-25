using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    public async Task<IReadOnlyList<JsonElement>> ListFactoryLinkedServicesAsync(
        string accessToken,
        string factoryResourceId,
        CancellationToken cancellationToken)
    {
        return await ListFactoryChildResourcesAsync(
            accessToken,
            factoryResourceId,
            "linkedservices",
            ResolveFactoryStyleApiVersion(factoryResourceId),
            "ADF linked-service",
            cancellationToken).ConfigureAwait(false);
    }
}
