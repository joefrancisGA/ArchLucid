using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmChildCollectionReadResult
{
    public int StatusCode
    {
        get;
        init;
    }

    public IReadOnlyList<JsonElement> Values
    {
        get;
        init;
    } = [];

    public bool PartialCollection
    {
        get;
        init;
    }

    public static HostedAzureArmChildCollectionReadResult Succeeded(
        IReadOnlyList<JsonElement> values,
        bool partialCollection = false)
    {
        return new HostedAzureArmChildCollectionReadResult
        {
            StatusCode = 200,
            Values = values,
            PartialCollection = partialCollection,
        };
    }

    public static HostedAzureArmChildCollectionReadResult Failed(int statusCode)
    {
        return new HostedAzureArmChildCollectionReadResult
        {
            StatusCode = statusCode,
            Values = [],
        };
    }
}
